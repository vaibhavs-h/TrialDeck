import { fieldText } from '../lib/jira.js';

const AMENDMENT_LABEL = /^amendment-(\d+)-v(\d+)-v(\d+)$/i;
const MAX_QUERY_LENGTH = 500;

function normalizedFieldId(fieldId) {
  if (typeof fieldId !== 'string' || !fieldId) return null;
  return /^\d+$/.test(fieldId) ? `customfield_${fieldId}` : fieldId;
}

function issueDescriptionText(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const ownText = typeof value.text === 'string' ? value.text : '';
  const children = Array.isArray(value.content)
    ? value.content.map(issueDescriptionText).filter(Boolean).join(' ')
    : '';
  return [ownText, children].filter(Boolean).join(' ');
}

function amendmentFromLabels(labels = []) {
  for (const label of labels) {
    const match = AMENDMENT_LABEL.exec(String(label));
    if (match) {
      return {
        pageId: match[1],
        fromVersion: Number(match[2]),
        toVersion: Number(match[3]),
      };
    }
  }
  return null;
}

function statusOf(issue) {
  const status = issue?.fields?.status;
  const category = String(
    status?.statusCategory?.key || status?.statusCategory?.name || '',
  ).toLowerCase();
  return {
    status: status?.name || 'Unknown',
    statusCategory: category || 'unknown',
    isDone: category === 'done',
  };
}

function taskSite(issue, siteFieldId) {
  const fieldId = normalizedFieldId(siteFieldId);
  const siteFromField = fieldId ? fieldText(issue?.fields?.[fieldId]).trim() : '';
  if (siteFromField) return siteFromField;
  const match = /^\[([^\]]+)\]\s*/.exec(String(issue?.fields?.summary || ''));
  return match?.[1]?.trim() || null;
}

function taskKind(issue) {
  const text = `${issue?.fields?.summary || ''} ${issueDescriptionText(issue?.fields?.description)}`;
  return /\b(?:retrain\w*|training)\b/i.test(text) ? 'retraining' : 'other';
}

function taskRecord(issue, siteFieldId) {
  const status = statusOf(issue);
  const assignee = issue?.fields?.assignee;
  return {
    key: String(issue?.key || ''),
    site: taskSite(issue, siteFieldId),
    taskType: taskKind(issue),
    status: status.status,
    statusCategory: status.statusCategory,
    isDone: status.isDone,
    dueDate: issue?.fields?.duedate || null,
    assignee: assignee?.accountId
      ? {
          accountId: String(assignee.accountId),
          name: String(assignee.displayName || 'Jira user'),
        }
      : null,
    amendment: amendmentFromLabels(issue?.fields?.labels),
    text: `${issue?.fields?.summary || ''} ${issueDescriptionText(issue?.fields?.description)}`,
  };
}

function matchesAmendment(record, version) {
  if (record.amendment?.toVersion === version) return true;
  const literalAmendment = new RegExp(`\\bamendment\\s+${version}\\b`, 'i');
  return literalAmendment.test(record.text);
}

function graphId(type, value) {
  return `${type}:${encodeURIComponent(String(value))}`;
}

function pageTitleFromTask(record, task) {
  const description = issueDescriptionText(task?.fields?.description);
  const match = /Protocol amendment task for [^:]+:\s*(.+?)\.\s+Needed because:/i.exec(description);
  if (match) return match[1];
  return `Protocol page ${record.amendment.pageId} (v${record.amendment.fromVersion} to v${record.amendment.toVersion})`;
}

export function parseKnowledgeQuestion(question) {
  if (typeof question !== 'string') return null;
  const value = question.trim();
  if (!value || value.length > MAX_QUERY_LENGTH) return null;

  const amendmentMatch = /\bamendment\s+(?:version\s*)?(\d+)\b/i.exec(value);
  const asksAboutSites = /\bsites?\b/i.test(value);
  const asksAboutRetraining = /\b(?:retrain\w*|training)\b/i.test(value);
  const asksAboutIncomplete = /\b(?:haven['’]?t|have\s+not|not|incomplete|pending|outstanding|unfinished|uncompleted)\b/i.test(value);

  if (!amendmentMatch || !asksAboutSites || !asksAboutRetraining || !asksAboutIncomplete) return null;

  return {
    intent: 'incomplete-amendment-training',
    amendmentVersion: Number(amendmentMatch[1]),
  };
}

export function getAmendmentTrainingAnswer(question, tasks, siteFieldId, knownSites = [], deviations = []) {
  const parsed = parseKnowledgeQuestion(question);
  if (!parsed) return null;

  const taskRecords = tasks.map(task => taskRecord(task, siteFieldId));
  const matchingTasks = taskRecords.filter(record =>
    record.taskType === 'retraining' && matchesAmendment(record, parsed.amendmentVersion)
  );
  const sites = new Set(
    knownSites.map(site => String(site || '').trim()).filter(Boolean),
  );
  for (const record of taskRecords) {
    if (record.site) sites.add(record.site);
  }
  for (const item of deviations) {
    const site = String(item?.normalized?.site || '').trim();
    if (site && site !== 'Unassigned') sites.add(site);
  }

  const incompleteSites = [...sites].sort((a, b) => a.localeCompare(b)).flatMap(site => {
    const siteTasks = matchingTasks.filter(task => task.site === site);
    const outstanding = siteTasks.filter(task => !task.isDone);
    if (siteTasks.length && !outstanding.length) return [];
    return [{
      site,
      reason: siteTasks.length ? 'NOT_MARKED_DONE' : 'NO_TASK_FOUND',
      tasks: outstanding.map(({ key, status, dueDate, assignee }) => ({
        key,
        status,
        dueDate,
        assignee,
      })),
    }];
  });

  const taskSites = new Set(matchingTasks.map(task => task.site).filter(Boolean));
  const unassignedTaskCount = matchingTasks.filter(task => !task.site && !task.isDone).length;
  const answer = incompleteSites.length
    ? `Sites without a retraining task marked Done for Amendment ${parsed.amendmentVersion}: ${incompleteSites.map(item => item.site).join(', ')}.`
    : unassignedTaskCount
      ? `No incomplete retraining tasks were attributed to a known site for Amendment ${parsed.amendmentVersion}; ${unassignedTaskCount} outstanding task(s) have no resolvable site.`
    : sites.size
      ? `All known sites have a retraining task marked Done for Amendment ${parsed.amendmentVersion}.`
      : `No sites were found for Amendment ${parsed.amendmentVersion}.`;

  return {
    answer,
    amendmentVersion: parsed.amendmentVersion,
    matchingTaskCount: matchingTasks.length,
    completeSiteCount: taskSites.size - incompleteSites.filter(item => item.reason === 'NOT_MARKED_DONE').length,
    incompleteSites,
    unassignedTaskCount,
    interpretation: `Amendment ${parsed.amendmentVersion} matches Jira amendment labels whose target protocol page version is v${parsed.amendmentVersion}, or issue text that explicitly says "Amendment ${parsed.amendmentVersion}".`,
  };
}

export function buildKnowledgeGraph({ deviations = [], amendmentTasks = [], siteFieldId, knownSites = [] } = {}) {
  const nodes = new Map();
  const edges = new Map();

  const addNode = (node) => {
    if (!nodes.has(node.id)) nodes.set(node.id, node);
    return node.id;
  };
  const addEdge = (source, target, type) => {
    if (!source || !target) return;
    const key = `${source}|${type}|${target}`;
    if (!edges.has(key)) edges.set(key, { source, target, type });
  };
  const addSite = (site) => {
    const value = String(site || '').trim();
    return value ? addNode({ id: graphId('site', value), type: 'site', label: value }) : null;
  };
  const addPerson = (person, relationship, from) => {
    if (!person?.accountId) return;
    const id = graphId('person', person.accountId);
    addNode({
      id,
      type: 'person',
      label: String(person.displayName || 'Jira user'),
    });
    addEdge(from, id, relationship);
  };

  knownSites.forEach(addSite);

  for (const item of deviations) {
    const issue = item?.raw;
    const deviation = item?.normalized;
    if (!issue?.key || !deviation) continue;

    const id = graphId('deviation', issue.key);
    addNode({
      id,
      type: 'deviation',
      label: `Deviation ${issue.key}`,
      issueKey: issue.key,
      status: deviation.status || 'Unknown',
      category: deviation.category || 'unknown',
    });
    addEdge(id, addSite(deviation.site), 'RECORDED_AT');

    if (deviation.protocolVersion && deviation.protocolVersion !== 'Not provided') {
      const protocolId = graphId('protocol-version', deviation.protocolVersion);
      addNode({
        id: protocolId,
        type: 'protocol',
        label: deviation.protocolVersion,
        protocolKind: 'version',
      });
      addEdge(id, protocolId, 'RECORDED_UNDER');
    }

    addPerson(issue.fields?.assignee, 'ASSIGNED_TO', id);
    addPerson(issue.fields?.reporter, 'REPORTED_BY', id);
  }

  for (const issue of amendmentTasks) {
    if (!issue?.key) continue;
    const record = taskRecord(issue, siteFieldId);
    const id = graphId('task', issue.key);
    addNode({
      id,
      type: 'amendment-task',
      label: `${record.taskType === 'retraining' ? 'Retraining' : 'Amendment'} task ${issue.key}`,
      issueKey: issue.key,
      status: record.status,
      dueDate: record.dueDate,
    });
    addEdge(id, addSite(record.site), 'ASSIGNED_TO_SITE');
    addPerson(issue.fields?.assignee, 'ASSIGNED_TO_PERSON', id);

    if (record.amendment) {
      const amendmentId = graphId(
        'protocol-amendment',
        `${record.amendment.pageId}:v${record.amendment.fromVersion}:v${record.amendment.toVersion}`,
      );
      addNode({
        id: amendmentId,
        type: 'protocol',
        label: pageTitleFromTask(record, issue),
        protocolKind: 'amendment',
        pageId: record.amendment.pageId,
        fromVersion: record.amendment.fromVersion,
        toVersion: record.amendment.toVersion,
      });
      addEdge(id, amendmentId, 'IMPLEMENTS_AMENDMENT');
    }
  }

  return {
    nodes: [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...edges.values()].sort((a, b) =>
      `${a.source}|${a.type}|${a.target}`.localeCompare(`${b.source}|${b.type}|${b.target}`)
    ),
  };
}
