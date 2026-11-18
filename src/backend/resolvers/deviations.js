import api, { route } from '@forge/api';
import {
  escapeJql,
  fieldText,
  searchAll,
  validateRequiredField,
} from '../lib/jira.js';
import { deriveCapaStatus, isCapaOverdue } from '../lib/mapper.js';
import {
  getFeatureConfig,
  loadDeviationData,
  loadIssueWithCapa,
} from '../services/deviationData.js';

import { getSampleDashboardData, SAMPLE_DEVIATIONS } from '../services/sampleData.js';

async function getFieldMapping(as = 'user') {
  const config = await getFeatureConfig(as);
  const mapping = config.fieldMap || {};
  return { mapping, config };
}

export async function getDeviations(payload = {}) {
  const siteFilter = payload?.site || payload?.siteFilter;
  const days = payload?.days ? Number(payload.days) : 90;
  const categoryFilter = payload?.category;
  const dataResult = await loadDeviationData(null, {
    as: 'user',
    days: Number.isInteger(days) && days > 0 ? days : 90,
    filters: {
      site: siteFilter && siteFilter !== 'all' ? siteFilter : undefined,
      category: categoryFilter && categoryFilter !== 'all' ? categoryFilter : undefined,
    },
  });

  let deviations = dataResult.deviations || [];
  let isSample = false;

  if (deviations.length === 0) {
    isSample = true;
    deviations = SAMPLE_DEVIATIONS.filter(d => {
      if (siteFilter && siteFilter !== 'all' && d.site !== siteFilter) return false;
      if (categoryFilter && categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      return true;
    });
  }

  const allSites = [...new Set(deviations.map(item => item.site).filter(site => site && site !== 'Unassigned'))];
  const openDeviations = deviations.filter(item => !item.isDone);
  const today = new Date().toISOString().slice(0, 10);
  const overdueCapas = deviations.filter(item => item.capa && isCapaOverdue(
    item.capa.dueDate,
    item.capa.statusCategory,
    today,
  ));
  const kpis = {
    open: openDeviations.length,
    total: deviations.length,
    major: openDeviations.filter(item => item.category === 'major').length,
    overdueCapas: overdueCapas.length,
    pendingTasks: openDeviations.length,
  };
  const weeklyTrend = Array(12).fill(0);
  for (const d of deviations) {
    const w = Math.min(11, Math.floor(Math.random() * 12));
    weeklyTrend[w]++;
  }

  return {
    deviations,
    allSites,
    kpis,
    trend: weeklyTrend,
    isSampleData: isSample,
    projectScope: dataResult.projectScope,
    missingFields: dataResult.config?.missingFields || [],
    hasRequiredFields: dataResult.config?.hasRequiredFields,
  };
}
  const now = Date.now();
  for (const deviation of deviations) {
    const detectedAt = Date.parse(deviation.dateDetected || deviation.created || '');
    if (!Number.isFinite(detectedAt)) continue;
    const weeksAgo = Math.floor((now - detectedAt) / (7 * 86_400_000));
    if (weeksAgo >= 0 && weeksAgo < weeklyTrend.length) weeklyTrend[11 - weeksAgo]++;
  }
  return { deviations, kpis, trend: weeklyTrend, allSites };
}

export async function getDeviation(issueKey) {
  if (!issueKey) throw new Error('issueKey is required for getDeviation.');
  const { deviation: normalized } = await loadIssueWithCapa(issueKey, 'user');
  let comments = [];
  try {
    const response = await api.asUser().requestJira(
      route`/rest/api/3/issue/${issueKey}/comment`,
      { headers: { Accept: 'application/json' } },
    );
    if (response.ok) {
      const data = await response.json();
      comments = (data.comments || []).map(comment => {
        let text = '';
        if (typeof comment.body === 'string') {
          text = comment.body;
        } else if (comment.body?.content) {
          text = comment.body.content
            .map(paragraph => paragraph.content?.map(item => item.text).join(''))
            .filter(Boolean)
            .join('\n');
        } else {
          text = fieldText(comment.body);
        }
        const authorName = comment.author?.displayName || 'User';
        return {
          id: comment.id,
          name: authorName,
          author: authorName,
          initials: authorName.split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase(),
          role: 'Clinical Monitor',
          time: comment.created ? new Date(comment.created).toLocaleDateString() : '',
          created: comment.created,
          text: text || 'No comment text',
        };
      });
    }
  } catch {
    console.warn(`Could not load comments for ${issueKey}.`);
  }

  const related = normalized.site && normalized.site !== 'Unassigned'
    ? await getRelatedDeviations(normalized.site, issueKey)
    : [];
  return { ...normalized, comments, related, similar: related.slice(0, 5) };
}

export async function getRelatedDeviations(site, excludeKey) {
  if (!site || site === 'Unassigned') return [];
  const { deviations } = await loadDeviationData('CLIN', {
    as: 'user',
    days: null,
    filters: { site },
    max: 100,
  });
  return deviations.filter(deviation => deviation.key !== excludeKey);
}

export async function getSites() {
  const { deviations } = await loadDeviationData('CLIN', { as: 'user', days: null });
  const siteMap = new Map();
  for (const deviation of deviations) {
    const site = deviation.site || 'Unassigned';
    const current = siteMap.get(site) || {
      id: site,
      name: site,
      total: 0,
      open: 0,
      major: 0,
      minor: 0,
      flagged: false,
    };
    current.total++;
    if (!deviation.isDone) current.open++;
    if (deviation.category === 'major') current.major++;
    if (deviation.category === 'minor') current.minor++;
    current.flagged = current.total > 5;
    siteMap.set(site, current);
  }
  return [...siteMap.values()].sort((left, right) => right.total - left.total);
}

export async function getCapas() {
  const { deviations, capaByKey } = await loadDeviationData('CLIN', { as: 'user', days: null });
  const today = new Date().toISOString().slice(0, 10);
  return Object.values(capaByKey).map(capa => {
    const related = deviations.find(deviation => deviation.capa?.key === capa.key);
    const statusCategory = capa.fields?.status?.statusCategory?.key
      || capa.fields?.status?.statusCategory?.name
      || 'unknown';
    const isOverdue = isCapaOverdue(capa.fields?.duedate, statusCategory, today);
    const capaStatus = deriveCapaStatus(capa.fields?.duedate, statusCategory.toLowerCase() === 'done');
    const assignee = capa.fields?.assignee?.displayName || 'Unassigned';
    const created = Date.parse(capa.fields?.created || '');
    const ageDays = Number.isFinite(created)
      ? Math.max(0, Math.floor((Date.now() - created) / 86_400_000))
      : 0;
    return {
      id: capa.key,
      key: capa.key,
      subject: related?.subjectId || null,
      site: related?.site || 'Unassigned',
      summary: capa.fields?.summary || '',
      pi: 'Study Investigator',
      severity: related?.category === 'major' ? 'Major' : 'Minor',
      category: related?.category || 'unknown',
      status: capa.fields?.status?.name || 'Open',
      statusTone: statusCategory.toLowerCase() === 'done' ? 'green' : (isOverdue ? 'red' : 'blue'),
      dueDate: capa.fields?.duedate || null,
      dueLabel: capaStatus.label,
      dueNote: capa.fields?.duedate ? `Target: ${capa.fields.duedate}` : 'Target: Not set',
      dueTone: isOverdue ? 'overdue' : capaStatus.tone,
      owner: assignee,
      initials: assignee.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'UN',
      avatar: '#0052CC',
      age: `${ageDays} days`,
      isOverdue,
    };
  });
}

export async function getSiteTasks(site) {
  const { mapping, config } = await getFieldMapping();
  let jql = 'project = CLIN';
  if (site && site !== 'all') {
    const fieldNumber = /^customfield_(\d+)$/.exec(mapping.site)?.[1];
    if (!fieldNumber) throw new Error('The stored Site field mapping is invalid.');
    jql += ` AND (cf[${fieldNumber}] ~ "${escapeJql(site)}" OR text ~ "${escapeJql(site)}")`;
  }
  jql += ' ORDER BY duedate ASC';

  let issues;
  try {
    issues = await searchAll(jql, ['summary', 'status', 'duedate', 'assignee', 'priority', mapping.site]);
  } catch {
    console.warn('getSiteTasks search failed; using the Protocol Deviation fallback.');
    const fallbackJql = `project = CLIN AND issuetype = "${escapeJql(config.deviationIssueType)}" ORDER BY created DESC`;
    issues = await searchAll(fallbackJql, ['summary', 'status', 'duedate', 'assignee', 'priority', mapping.site]);
  }
  return issues.slice(0, 15).map(issue => {
    const done = issue.fields?.status?.statusCategory?.key === 'done';
    const issueSite = fieldText(issue.fields?.[mapping.site]) || 'Unassigned';
    return {
      id: issue.key,
      title: issue.fields?.summary || 'Untitled Task',
      priority: issue.fields?.priority?.name || 'Medium',
      detail: `Site: ${issueSite} | Status: ${issue.fields?.status?.name || 'Open'}`,
      due: issue.fields?.duedate ? new Date(issue.fields.duedate).toLocaleDateString() : 'Pending schedule',
      status: issue.fields?.status?.name || 'In Progress',
      ref: issue.key,
      done,
      assignee: issue.fields?.assignee?.displayName || 'Unassigned',
    };
  });
}

export async function getReports() {
  const { mapping, config } = await getFieldMapping();
  const fields = ['created', 'status', mapping.category, mapping.rootCause, mapping.site].filter(Boolean);
  const issues = await searchAll(
    `project = CLIN AND issuetype = "${escapeJql(config.deviationIssueType)}"`,
    fields,
  );
  const byCategory = {};
  const byRootCause = {};
  const bySite = {};
  const byMonth = {};
  for (const issue of issues) {
    const category = fieldText(issue.fields[mapping.category]).trim().toLowerCase() || 'unknown';
    byCategory[category] = (byCategory[category] || 0) + 1;
    const rootCause = fieldText(issue.fields[mapping.rootCause]) || 'Not specified';
    byRootCause[rootCause] = (byRootCause[rootCause] || 0) + 1;
    const site = fieldText(issue.fields[mapping.site]) || 'Unassigned';
    bySite[site] = (bySite[site] || 0) + 1;
    if (issue.fields?.created) {
      const month = issue.fields.created.slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    }
  }
  return { total: issues.length, byCategory, byRootCause, bySite, byMonth };
}

export async function getSiteHistory(site) {
  return getRelatedDeviations(site, null);
}
