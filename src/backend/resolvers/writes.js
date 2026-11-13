import api, { route, storage } from '@forge/api';
import { ISSUE_TYPE } from '../config/constants';
import {
  escapeJql,
  fieldText,
  findCustomFieldId
} from '../lib/jira';

/**
 * Converts a plain string to simple Atlassian Document Format (ADF)
 */
export function toADF(text) {
  if (!text) {
    return {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'No description provided.' }]
        }
      ]
    };
  }
  return {
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: String(text) }]
      }
    ]
  };
}

/**
 * Resolver: getCreateMeta()
 * Returns real dropdown options for site, category, Protocol version, Root cause, Report status,
 * Protocol Deviation issue type id, Task issue type id, and the CLIN project id.
 */
export async function getCreateMeta() {
  console.log('getCreateMeta v1');
  // 1. Get Project ID for CLIN
  const projectRes = await api.asUser().requestJira(route`/rest/api/3/project/CLIN`);
  if (!projectRes.ok) {
    const errorText = await projectRes.text();
    throw new Error(`Failed to fetch project CLIN (status ${projectRes.status}): ${errorText}`);
  }
  const projectData = await projectRes.json();
  const projectId = projectData.id;

  // 2. Find issue types for CLIN
  const issueTypes = projectData.issueTypes || [];
  const deviationType = issueTypes.find(t => t.name.trim().toLowerCase() === ISSUE_TYPE.toLowerCase());
  const taskType = issueTypes.find(t => t.name.trim().toLowerCase() === 'task') || issueTypes.find(t => !t.subtask && t.id !== deviationType?.id);

  // 3. Fetch custom fields metadata
  const fieldResponse = await api.asUser().requestJira(route`/rest/api/3/field`);
  if (!fieldResponse.ok) {
    const errorText = await fieldResponse.text();
    throw new Error(`Failed to fetch fields (status ${fieldResponse.status}): ${errorText}`);
  }
  const allFields = await fieldResponse.json();

  const fieldMapping = {
    site: findCustomFieldId(allFields, 'site'),
    category: findCustomFieldId(allFields, 'category'),
    subjectId: findCustomFieldId(allFields, 'Subject ID'),
    protocolVersion: findCustomFieldId(allFields, 'Protocol version'),
    rootCause: findCustomFieldId(allFields, 'Root cause'),
    reportStatus: findCustomFieldId(allFields, 'Report status'),
    dateDetected: findCustomFieldId(allFields, 'date detected')
  };

  // 4. Fetch create metadata for Protocol Deviation
  let deviationFieldsMeta = {};
  if (deviationType) {
    try {
      let startAt = 0;
      let isLast = false;
      while (!isLast) {
        const metaRes = await api.asUser().requestJira(
          route`/rest/api/3/issue/createmeta/${projectId}/issuetypes/${deviationType.id}?startAt=${startAt}&maxResults=50`
        );
        if (!metaRes.ok) {
          const errText = await metaRes.text();
          console.warn(`createmeta request failed (status ${metaRes.status}): ${errText}`);
          break;
        }
        const metaData = await metaRes.json();
        const rawFields = metaData.values || metaData.fields || [];
        if (Array.isArray(rawFields)) {
          rawFields.forEach(f => {
            const fid = f.fieldId || f.key || f.id;
            if (fid) deviationFieldsMeta[fid] = f;
          });
          if (metaData.isLast === true || rawFields.length === 0 || metaData.total <= startAt + rawFields.length) {
            isLast = true;
          } else {
            startAt += rawFields.length;
          }
        } else if (typeof rawFields === 'object') {
          Object.assign(deviationFieldsMeta, rawFields);
          isLast = true;
        } else {
          isLast = true;
        }
      }
    } catch (e) {
      console.warn('Could not fetch createmeta for deviation type:', e.message);
    }
  }

  // Extract allowed values for dropdown fields - strictly read real Jira options (no hardcoded guesses)
  const extractOptions = (fieldId) => {
    if (fieldId && deviationFieldsMeta[fieldId]?.allowedValues) {
      return deviationFieldsMeta[fieldId].allowedValues.map(v => ({
        id: String(v.id),
        value: v.value || v.name || fieldText(v) || String(v.id),
        label: v.value || v.name || fieldText(v) || String(v.id)
      }));
    }
    return [];
  };

  const siteOptions = extractOptions(fieldMapping.site);
  const categoryOptions = extractOptions(fieldMapping.category);
  const protocolVersionOptions = extractOptions(fieldMapping.protocolVersion);
  const rootCauseOptions = extractOptions(fieldMapping.rootCause);
  const reportStatusOptions = extractOptions(fieldMapping.reportStatus);

  return {
    projectId,
    projectKey: 'CLIN',
    deviationTypeId: deviationType?.id || null,
    taskTypeId: taskType?.id || null,
    fieldMapping,
    allFields: allFields.map(f => ({ id: f.id, name: f.name })),
    options: {
      site: siteOptions,
      category: categoryOptions,
      protocolVersion: protocolVersionOptions,
      rootCause: rootCauseOptions,
      reportStatus: reportStatusOptions
    }
  };
}

/**
 * Resolver: getAssignableUsers(query)
 */
export async function getAssignableUsers(query = '') {
  console.log('getAssignableUsers v1');
  const q = encodeURIComponent(query || '');
  const res = await api.asUser().requestJira(route`/rest/api/3/user/assignable/search?project=CLIN&query=${q}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to search users (status ${res.status}): ${errorText}`);
  }
  const users = await res.json();
  return users.map(u => ({
    accountId: u.accountId,
    displayName: u.displayName,
    emailAddress: u.emailAddress,
    avatarUrl: u.avatarUrls?.['24x24'] || null
  }));
}

/**
 * Resolver: createDeviation(payload)
 */
export async function createDeviation(payload) {
  console.log('createDeviation v1');
  const {
    summary,
    description,
    site,
    category,
    subjectId,
    protocolVersion,
    dateDetected,
    rootCause
  } = payload || {};

  // Server-side validation
  if (!summary || !summary.trim()) {
    throw new Error('Summary is required.');
  }

  const subjPattern = /^SUBJ-\d{4}$/;
  if (!subjectId || !subjPattern.test(subjectId.trim())) {
    throw new Error('Subject ID must be pseudonymized matching format SUBJ-xxxx (e.g. SUBJ-0042).');
  }

  if (dateDetected) {
    const detected = new Date(dateDetected);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (detected > today) {
      throw new Error('Date detected cannot be in the future.');
    }
  }

  const meta = await getCreateMeta();
  const fm = meta.fieldMapping;

  const issueFields = {
    project: { id: meta.projectId },
    issuetype: { id: meta.deviationTypeId },
    summary: summary.trim(),
    description: toADF(description || summary)
  };

  // Helper to format custom dropdown options (send as { id: "<id>" } if id is available, else { value: "<value>" })
  const setOption = (fieldId, opt) => {
    if (!fieldId || !opt) return;
    if (typeof opt === 'object') {
      if (opt.id) {
        issueFields[fieldId] = { id: String(opt.id) };
      } else if (opt.value) {
        issueFields[fieldId] = { value: String(opt.value) };
      }
    } else {
      // If a string was passed, check if it's numeric id
      const strVal = String(opt).trim();
      if (/^\d+$/.test(strVal)) {
        issueFields[fieldId] = { id: strVal };
      } else {
        issueFields[fieldId] = { value: strVal };
      }
    }
  };

  setOption(fm.site, site);
  setOption(fm.category, category);
  setOption(fm.protocolVersion, protocolVersion);
  setOption(fm.rootCause, rootCause);

  // Set default report status if available
  const notStartedOption = meta.options.reportStatus.find(o => o.value?.toLowerCase().includes('not started'));
  if (fm.reportStatus && notStartedOption) {
    issueFields[fm.reportStatus] = notStartedOption.id
      ? { id: String(notStartedOption.id) }
      : { value: notStartedOption.value };
  }

  if (fm.subjectId && subjectId) {
    issueFields[fm.subjectId] = subjectId.trim();
  }

  if (fm.dateDetected && dateDetected) {
    issueFields[fm.dateDetected] = dateDetected;
  }

  const res = await api.asUser().requestJira(route`/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ fields: issueFields })
  });

  if (!res.ok) {
    const errorText = await res.text();
    let parsedError = null;
    try {
      parsedError = JSON.parse(errorText);
    } catch (e) {
      // not JSON
    }

    if (parsedError && (parsedError.errors || parsedError.errorMessages)) {
      const fieldMap = {};
      if (meta.allFields) {
        meta.allFields.forEach(f => {
          fieldMap[f.id] = f.name;
        });
      }

      const readableErrors = [];
      if (parsedError.errorMessages && parsedError.errorMessages.length > 0) {
        readableErrors.push(...parsedError.errorMessages);
      }
      if (parsedError.errors) {
        Object.entries(parsedError.errors).forEach(([fKey, fErr]) => {
          const displayName = fieldMap[fKey] || fKey;
          readableErrors.push(`${displayName}: ${fErr}`);
        });
      }

      const summaryMsg = readableErrors.join(' | ') || `Jira returned status ${res.status}`;
      const err = new Error(summaryMsg);
      err.details = {
        status: res.status,
        readableErrors,
        rawErrors: parsedError.errors || {},
        errorMessages: parsedError.errorMessages || [],
        rawResponse: errorText
      };
      throw err;
    }

    throw new Error(`Failed to create deviation (status ${res.status}): ${errorText}`);
  }

  const created = await res.json();
  return {
    key: created.key,
    id: created.id,
    self: created.self
  };
}

/**
 * Resolver: createCapaTask({ deviationKey, title, assigneeAccountId, dueDate, description })
 */
export async function createCapaTask(payload) {
  console.log('createCapaTask v1');
  const { deviationKey, title, assigneeAccountId, dueDate, description } = payload || {};
  if (!deviationKey) throw new Error('deviationKey is required.');
  if (!title || !title.trim()) throw new Error('Title is required.');

  const meta = await getCreateMeta();
  const taskFields = {
    project: { id: meta.projectId },
    issuetype: { id: meta.taskTypeId },
    summary: title.trim(),
    description: toADF(description || `Corrective and Preventive Action for deviation ${deviationKey}`)
  };

  if (dueDate) {
    taskFields.duedate = dueDate;
  }
  if (assigneeAccountId) {
    taskFields.assignee = { accountId: assigneeAccountId };
  }

  // 1. Create the Task
  const createRes = await api.asUser().requestJira(route`/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ fields: taskFields })
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create CAPA task (status ${createRes.status}): ${errorText}`);
  }

  const taskData = await createRes.json();
  const taskKey = taskData.key;

  // 2. Link task to deviation
  try {
    const linksRes = await api.asUser().requestJira(route`/rest/api/3/issueLinkType`);
    let linkTypeName = 'Relates';
    if (linksRes.ok) {
      const linkTypes = await linksRes.json();
      const relatesType = (linkTypes.issueLinkTypes || []).find(t => t.name.toLowerCase().includes('relat'));
      if (relatesType) linkTypeName = relatesType.name;
    }

    const linkRes = await api.asUser().requestJira(route`/rest/api/3/issueLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        type: { name: linkTypeName },
        inwardIssue: { key: deviationKey },
        outwardIssue: { key: taskKey },
        comment: {
          body: toADF(`Linked CAPA action item ${taskKey} created.`)
        }
      })
    });

    if (!linkRes.ok) {
      console.warn(`Could not link ${taskKey} to ${deviationKey}: status ${linkRes.status}`);
    }
  } catch (linkErr) {
    console.warn('Issue link failed:', linkErr.message);
  }

  return { key: taskKey, id: taskData.id };
}

/**
 * Resolver: createSiteTask({ site, title, assigneeAccountId, dueDate, type })
 */
export async function createSiteTask(payload) {
  console.log('createSiteTask v1');
  const { site, title, assigneeAccountId, dueDate, type } = payload || {};
  if (!title || !title.trim()) throw new Error('Task title is required.');

  const meta = await getCreateMeta();
  const taskFields = {
    project: { id: meta.projectId },
    issuetype: { id: meta.taskTypeId },
    summary: `[${site || 'Site Task'}] ${title.trim()}`,
    description: toADF(`Protocol compliance task (${type || 'Operational Checkpoint'}) for trial site ${site || 'Unassigned'}.`)
  };

  if (dueDate) taskFields.duedate = dueDate;
  if (assigneeAccountId) taskFields.assignee = { accountId: assigneeAccountId };

  if (meta.fieldMapping.site && site) {
    taskFields[meta.fieldMapping.site] = { value: String(site) };
  }

  const res = await api.asUser().requestJira(route`/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ fields: taskFields })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create site task (status ${res.status}): ${errorText}`);
  }

  const taskData = await res.json();
  return { key: taskData.key, id: taskData.id };
}

/**
 * Resolver: escalateCapa({ issueKey })
 * Posts a formal escalation comment and raises priority to High if allowed.
 */
export async function escalateCapa(payload) {
  console.log('escalateCapa v1');
  const { issueKey } = payload || {};
  if (!issueKey) throw new Error('issueKey is required.');

  // 1. Post escalation comment
  const commentText = `⚠️ GCP ESCALATION NOTICE: Corrective action for deviation ${issueKey} has been formally escalated to the Lead Study Investigator and Clinical QA Safety Committee.`;
  const commentRes = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      body: toADF(commentText)
    })
  });

  if (!commentRes.ok) {
    const errorText = await commentRes.text();
    throw new Error(`Failed to post escalation comment (status ${commentRes.status}): ${errorText}`);
  }

  // 2. Attempt raising priority to High
  try {
    await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          priority: { name: 'High' }
        }
      })
    });
  } catch (pErr) {
    console.warn('Could not update priority to High:', pErr.message);
  }

  return { ok: true, issueKey };
}

/**
 * Resolver: updateReportStatus({ issueKey, status })
 */
export async function updateReportStatus(payload) {
  console.log('updateReportStatus v1');
  const { issueKey, status } = payload || {};
  if (!issueKey) throw new Error('issueKey is required.');
  if (!status) throw new Error('Status is required.');

  const meta = await getCreateMeta();
  const fm = meta.fieldMapping;
  if (!fm.reportStatus) {
    throw new Error('Report status custom field not found in Jira.');
  }

  const updateRes = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        [fm.reportStatus]: { value: String(status) }
      }
    })
  });

  if (!updateRes.ok) {
    const errorText = await updateRes.text();
    throw new Error(`Failed to update report status (status ${updateRes.status}): ${errorText}`);
  }

  // Record audit comment
  try {
    const commentBody = `Regulatory Report status updated to "${status}" on ${new Date().toLocaleString()}.`;
    await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ body: toADF(commentBody) })
    });
  } catch (cErr) {
    console.warn('Could not post report status audit comment:', cErr.message);
  }

  return { ok: true, issueKey, status };
}

/**
 * Resolver: transitionIssue({ issueKey, targetStatus })
 */
export async function transitionIssue(payload) {
  console.log('transitionIssue v1');
  const { issueKey, targetStatus } = payload || {};
  if (!issueKey) throw new Error('issueKey is required.');

  // 1. Fetch available transitions
  const transRes = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`);
  if (!transRes.ok) {
    const errorText = await transRes.text();
    throw new Error(`Failed to fetch transitions (status ${transRes.status}): ${errorText}`);
  }

  const transData = await transRes.json();
  const transitions = transData.transitions || [];

  const target = (targetStatus || 'done').toLowerCase().trim();
  const matched = transitions.find(t =>
    t.name.toLowerCase() === target ||
    t.to?.name?.toLowerCase() === target ||
    t.to?.statusCategory?.key === target
  );

  if (!matched) {
    const available = transitions.map(t => `"${t.name}" -> ${t.to?.name}`).join(', ');
    throw new Error(`No transition found matching "${targetStatus}". Available transitions: ${available || 'none'}`);
  }

  // 2. Perform transition
  const doTrans = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      transition: { id: matched.id }
    })
  });

  if (!doTrans.ok) {
    const errorText = await doTrans.text();
    throw new Error(`Failed to transition issue ${issueKey} (status ${doTrans.status}): ${errorText}`);
  }

  return { ok: true, issueKey, transition: matched.name };
}

/**
 * Resolver: updateDeviation({ issueKey, fields })
 */
export async function updateDeviation(payload) {
  console.log('updateDeviation v1');
  const { issueKey, fields } = payload || {};
  if (!issueKey) throw new Error('issueKey is required.');
  if (!fields) throw new Error('Fields object is required.');

  const meta = await getCreateMeta();
  const fm = meta.fieldMapping;
  const updatePayload = {};

  if (fields.category && fm.category) {
    updatePayload[fm.category] = { value: String(fields.category) };
  }
  if (fields.rootCause && fm.rootCause) {
    updatePayload[fm.rootCause] = { value: String(fields.rootCause) };
  }
  if (fields.dueDate !== undefined) {
    updatePayload.duedate = fields.dueDate || null;
  }
  if (fields.summary) {
    updatePayload.summary = fields.summary.trim();
  }

  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ fields: updatePayload })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update deviation ${issueKey} (status ${res.status}): ${errorText}`);
  }

  return { ok: true, issueKey };
}

/**
 * Resolver: getSettings()
 */
export async function getSettings() {
  console.log('getSettings v1');
  const defaultSettings = {
    overdueThresholdDays: 0,
    targetThreshold: 15,
    repeatIssueThreshold: 2
  };
  try {
    const saved = await storage.get('app_settings');
    return { ...defaultSettings, ...(saved || {}) };
  } catch (e) {
    console.warn('Could not read settings from storage:', e.message);
    return defaultSettings;
  }
}

/**
 * Resolver: saveSettings(newSettings)
 */
export async function saveSettings(payload) {
  console.log('saveSettings v1');
  const { overdueThresholdDays, targetThreshold, repeatIssueThreshold } = payload || {};
  const settingsToSave = {
    overdueThresholdDays: Number(overdueThresholdDays ?? 0),
    targetThreshold: Number(targetThreshold ?? 15),
    repeatIssueThreshold: Number(repeatIssueThreshold ?? 2)
  };

  await storage.set('app_settings', settingsToSave);
  return { ok: true, settings: settingsToSave };
}
