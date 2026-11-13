import { fieldText } from './jira.js';

/**
 * Derives CAPA status object strictly from real due date and statusCategory
 * @param {string|null} duedate 
 * @param {boolean} isDone 
 * @returns {{ label: string, tone: string, reason: string }}
 */
export function deriveCapaStatus(duedate, isDone) {
  if (isDone) {
    return {
      label: 'Closed',
      tone: 'green',
      reason: 'closed'
    };
  }

  if (!duedate) {
    return {
      label: 'No CAPA due date',
      tone: 'neutral',
      reason: 'none'
    };
  }

  const now = new Date();
  const due = new Date(duedate);
  const diffDays = Math.round((due - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    return {
      label: 'Overdue',
      tone: 'danger',
      reason: `${daysOverdue} days overdue`
    };
  }

  return {
    label: `Due ${due.toLocaleDateString()}`,
    tone: diffDays <= 3 ? 'warning' : 'neutral',
    reason: `Due in ${diffDays} days`
  };
}

/**
 * Maps any Jira Protocol Deviation issue into our standardized domain model.
 * Single source of truth used across all resolvers.
 */
export function normalizeDeviation(issue, mapping = {}) {
  const f = issue.fields || {};

  const site = fieldText(f[mapping['site']]) || 'Unassigned';
  const categoryRaw = fieldText(f[mapping['category']]).trim().toLowerCase();
  const category = categoryRaw === 'major' ? 'major' : (categoryRaw === 'minor' ? 'minor' : (categoryRaw || 'unknown'));

  const created = f.created ? new Date(f.created) : new Date();
  const daysOpen = Math.round(Math.abs(Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
  const dateDetected = fieldText(f[mapping['date detected']]) || f.created || null;
  const rootCause = fieldText(f[mapping['Root cause']]) || 'Not specified';
  const reportStatus = fieldText(f[mapping['Report status']]) || 'Not provided';
  const protocolVersion = fieldText(f[mapping['Protocol version']]) || 'Not provided';
  const subjectId = fieldText(f[mapping['Subject ID']]) || `SUBJ-${String(site).replace(/\D/g, '') || (issue.key ? issue.key.split('-')[1] : '0000')}`;

  const statusName = f.status?.name || 'Open';
  const statusCategoryKey = f.status?.statusCategory?.key || 'new';
  const isDone = statusCategoryKey === 'done';
  const dueDate = f.duedate || null;

  const capaStatus = deriveCapaStatus(dueDate, isDone);

  return {
    key: issue.key,
    id: issue.key,
    summary: f.summary || 'No summary',
    site,
    category,
    subjectId,
    protocolVersion,
    rootCause,
    reportStatus,
    status: statusName,
    statusCategoryKey,
    isDone,
    created: f.created,
    dateDetected,
    dueDate,
    capaStatus,
    daysOpen,
    assignee: f.assignee ? {
      name: f.assignee.displayName || 'Unassigned',
      initials: (f.assignee.displayName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    } : { name: 'Unassigned', initials: 'UN' },
    reporter: f.reporter?.displayName || 'Unknown Reporter'
  };
}

