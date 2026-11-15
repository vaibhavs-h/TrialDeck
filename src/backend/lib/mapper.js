import { fieldText } from './jira.js';

function mappedField(fields, mapping, fieldName) {
  const aliases = {
    'Subject ID': ['Subject ID', 'subjectId'],
    'Protocol version': ['Protocol version', 'protocolVersion'],
    'Root cause': ['Root cause', 'rootCause'],
    'Report status': ['Report status', 'reportStatus'],
    'date detected': ['date detected', 'dateDetected'],
  };
  const fieldId = (aliases[fieldName] || [fieldName]).map(key => mapping?.[key]).find(Boolean);
  if (!fieldId) return undefined;
  const fieldKey = /^\d+$/.test(fieldId) ? `customfield_${fieldId}` : fieldId;
  return fields[fieldKey];
}

function statusCategory(issue) {
  return issue?.fields?.status?.statusCategory?.key
    || issue?.fields?.status?.statusCategory?.name
    || 'unknown';
}

function capaFromLinkedIssue(linkedIssue) {
  if (!linkedIssue?.key) return null;
  const fields = linkedIssue.fields || {};
  const status = fields.status || {};
  const category = status.statusCategory || {};
  const statusName = status.name || null;
  return {
    id: linkedIssue.key,
    key: linkedIssue.key,
    summary: fields.summary || '',
    status: statusName,
    statusCategory: category.key || category.name || 'unknown',
    dueDate: fields.duedate || null,
    resolvedAt: fields.resolutiondate || null,
    owner: fields.assignee?.displayName || 'Unassigned',
    badge: statusName || 'Linked CAPA',
  };
}

function findLinkedCapa(issue, mapping, capaByKey, capaIssueType) {
  const links = Array.isArray(issue?.fields?.issuelinks) ? issue.fields.issuelinks : [];
  for (const link of links) {
    const typeName = link?.type?.name || '';
    if (mapping.capaLinkType && typeName.toLowerCase() !== mapping.capaLinkType.toLowerCase()) continue;
    for (const linkedIssue of [link?.outwardIssue, link?.inwardIssue]) {
      if (!linkedIssue?.key) continue;
      const knownCapa = capaByKey?.[linkedIssue.key];
      const candidate = knownCapa || linkedIssue;
      const candidateType = candidate?.fields?.issuetype?.name;
      if (candidateType && candidateType.toLowerCase() !== capaIssueType.toLowerCase()) continue;
      if (!candidateType && !knownCapa) continue;
      return capaFromLinkedIssue(candidate);
    }
  }
  return null;
}

export function normalizeDeviation(issue, mapping = {}, capaByKey = {}, config = {}) {
  const fields = issue?.fields || {};
  const categoryRaw = fieldText(mappedField(fields, mapping, 'category')).trim().toLowerCase();
  const category = categoryRaw === 'major' || categoryRaw === 'minor' ? categoryRaw : 'unknown';
  const created = fields.created || null;
  const createdTime = created ? new Date(created).getTime() : Number.NaN;
  const daysOpen = Number.isFinite(createdTime)
    ? Math.max(0, Math.floor((Date.now() - createdTime) / 86_400_000))
    : 0;
  const assigneeName = fields.assignee?.displayName || 'Unassigned';
  const capa = findLinkedCapa(issue, mapping, capaByKey, config.capaIssueType || 'CAPA');
  const rawSubjectId = fieldText(mappedField(fields, mapping, 'Subject ID'));
  const subjectId = /^SUBJ-\d{4}$/.test(rawSubjectId) ? rawSubjectId : null;
  const categoryKey = statusCategory(issue);

  return {
    key: issue?.key || '',
    id: issue?.key || '',
    summary: fields.summary || 'No summary',
    site: fieldText(mappedField(fields, mapping, 'site')) || 'Unassigned',
    category,
    subjectId,
    subjectIdPresent: Boolean(subjectId),
    protocolVersion: fieldText(mappedField(fields, mapping, 'Protocol version')) || 'Not provided',
    rootCause: fieldText(mappedField(fields, mapping, 'Root cause')) || 'Not specified',
    reportStatus: fieldText(mappedField(fields, mapping, 'Report status')) || 'Not provided',
    status: fields.status?.name || 'Open',
    statusCategoryKey: categoryKey,
    isDone: categoryKey.toLowerCase() === 'done',
    created,
    dateDetected: fieldText(mappedField(fields, mapping, 'date detected')) || created,
    dueDate: fields.duedate || null,
    capa,
    capaStatus: capa
      ? deriveCapaStatus(capa.dueDate, capa.statusCategory.toLowerCase() === 'done')
      : deriveCapaStatus(null, false),
    daysOpen,
    assignee: {
      name: assigneeName,
      initials: assigneeName.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'UN',
    },
    reporter: fields.reporter?.displayName || 'Unknown Reporter',
  };
}

export function deriveCapaStatus(duedate, isDone) {
  if (isDone) return { label: 'Closed', tone: 'green', reason: 'closed' };
  if (!duedate) return { label: 'No CAPA due date', tone: 'neutral', reason: 'none' };
  const due = new Date(`${duedate.slice(0, 10)}T00:00:00Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) {
    return { label: 'Overdue', tone: 'danger', reason: `${Math.abs(diffDays)} days overdue` };
  }
  return {
    label: `Due ${due.toLocaleDateString()}`,
    tone: diffDays <= 3 ? 'warning' : 'neutral',
    reason: `Due in ${diffDays} days`,
  };
}

export function isCapaOverdue(duedate, statusCategory, today = new Date().toISOString().slice(0, 10)) {
  const dueDate = typeof duedate === 'string' ? duedate.slice(0, 10) : '';
  return Boolean(dueDate && dueDate < today && String(statusCategory).toLowerCase() !== 'done');
}
