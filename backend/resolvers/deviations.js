import api, { route } from '@forge/api';
import { ISSUE_TYPE } from '../config/constants';
import {
  escapeJql,
  getIssue,
  searchAll,
  fieldText,
  findCustomFieldId,
  validateRequiredField
} from '../lib/jira';
import { normalizeDeviation } from '../lib/mapper';

const OPTIONAL_FIELD_NAMES = [
  'Subject ID',
  'Protocol version',
  'date detected',
  'Root cause',
  'Report status'
];
const REQUIRED_FIELD_NAMES = [
  'site',
  'category'
];
const ALL_FIELD_NAMES = [...REQUIRED_FIELD_NAMES, ...OPTIONAL_FIELD_NAMES];

async function getFieldMapping() {
  const fieldResponse = await api.asUser().requestJira(route`/rest/api/3/field`);
  if (!fieldResponse.ok) {
    const errorText = await fieldResponse.text();
    throw new Error(`Failed to fetch Jira fields (status ${fieldResponse.status}): ${errorText}`);
  }
  const fieldsData = await fieldResponse.json();
  const mapping = {};
  for (const name of ALL_FIELD_NAMES) {
    mapping[name] = findCustomFieldId(fieldsData, name);
  }
  return { mapping, fieldsData };
}

/**
 * Resolver: getDeviations({ site, days, category })
 */
export async function getDeviations(payload = {}) {
  console.log('getDeviations v2');
  const siteFilter = payload?.site || payload?.siteFilter;
  const days = payload?.days ? Number(payload.days) : 90;
  const categoryFilter = payload?.category;
  const { mapping, fieldsData } = await getFieldMapping();

  validateRequiredField(mapping['site'], 'site', fieldsData);
  validateRequiredField(mapping['category'], 'category', fieldsData);

  let jql = `issuetype = "${ISSUE_TYPE}"`;
  if (siteFilter && siteFilter !== 'all') {
    jql += ` AND "${mapping['site']}" = "${escapeJql(siteFilter)}"`;
  }
  if (categoryFilter && categoryFilter !== 'all') {
    jql += ` AND "${mapping['category']}" = "${escapeJql(categoryFilter)}"`;
  }
  if (days && days > 0) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    jql += ` AND created >= "${startDate}"`;
  }
  jql += ` ORDER BY created DESC`;

  const fields = ['summary', 'status', 'created', 'duedate', 'assignee', 'reporter', ...Object.values(mapping).filter(Boolean)];
  const issues = await searchAll(jql, fields);
  const deviations = issues.map(i => normalizeDeviation(i, mapping));

  // Compute all distinct sites
  const allSites = [...new Set(deviations.map(d => d.site).filter(s => s && s !== 'Unassigned'))];

  const now = new Date();
  const openDeviations = deviations.filter(d => !d.isDone);
  const kpis = {
    open: openDeviations.length,
    total: deviations.length,
    major: openDeviations.filter(d => d.category === 'major').length,
    overdueCapas: deviations.filter(d => d.dueDate && new Date(d.dueDate) < now && !d.isDone).length,
    pendingTasks: openDeviations.length
  };

  // Weekly trend for deviations (last 12 weeks)
  const today = new Date();
  const currentWeek = Math.ceil((Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))) / 7);
  const weeklyCounts = {};
  for (let w = currentWeek - 11; w <= currentWeek; w++) {
    weeklyCounts[w] = 0;
  }
  deviations.forEach(d => {
    const dateVal = d.dateDetected || d.created;
    if (dateVal) {
      const dObj = new Date(dateVal);
      const week = Math.ceil((Math.floor((dObj - new Date(dObj.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))) / 7);
      if (weeklyCounts[week] !== undefined) {
        weeklyCounts[week]++;
      }
    }
  });

  const weeklyTrend = Object.values(weeklyCounts);

  return { deviations, kpis, trend: weeklyTrend, allSites };
}

/**
 * Resolver: getDeviation(issueKey)
 */
export async function getDeviation(issueKey) {
  console.log(`getDeviation v2 - fetching ${issueKey}`);
  if (!issueKey) throw new Error('issueKey is required for getDeviation');
  const { mapping } = await getFieldMapping();
  const issue = await getIssue(issueKey);

  // Fetch comments
  let comments = [];
  try {
    const commentsRes = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment`);
    if (commentsRes.ok) {
      const commentsData = await commentsRes.json();
      comments = (commentsData.comments || []).map(c => {
        let text = '';
        if (typeof c.body === 'string') {
          text = c.body;
        } else if (c.body?.content) {
          text = c.body.content.map(p => p.content?.map(t => t.text).join('')).filter(Boolean).join('\n');
        } else {
          text = fieldText(c.body);
        }
        const authorName = c.author?.displayName || 'User';
        return {
          id: c.id,
          name: authorName,
          author: authorName,
          initials: authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          role: 'Clinical Monitor',
          time: c.created ? new Date(c.created).toLocaleDateString() : '',
          created: c.created,
          text: text || 'No comment text'
        };
      });
    }
  } catch (err) {
    console.warn(`Could not load comments for ${issueKey}:`, err);
  }

  const normalized = normalizeDeviation(issue, mapping);

  // Issue links / CAPA
  let capa = null;
  const issueLinks = issue.fields?.issuelinks || [];
  for (const link of issueLinks) {
    const linkedIssue = link.outwardIssue || link.inwardIssue;
    if (linkedIssue) {
      capa = {
        id: linkedIssue.key,
        summary: linkedIssue.fields?.summary || '',
        status: linkedIssue.fields?.status?.name || 'In Progress',
        owner: linkedIssue.fields?.assignee?.displayName || 'Safety Committee',
        badge: linkedIssue.fields?.status?.name || 'Linked CAPA'
      };
      break;
    }
  }

  // Related deviations at same site
  let related = [];
  if (normalized.site && normalized.site !== 'Unassigned') {
    related = await getRelatedDeviations(normalized.site, issueKey);
  }

  return {
    ...normalized,
    comments,
    capa,
    related,
    similar: related.slice(0, 5)
  };
}

/**
 * Resolver: getRelatedDeviations(site, excludeKey)
 */
export async function getRelatedDeviations(site, excludeKey) {
  if (!site || site === 'Unassigned') return [];
  const { mapping } = await getFieldMapping();
  let jql = `issuetype = "${ISSUE_TYPE}" AND "${mapping['site']}" = "${escapeJql(site)}"`;
  if (excludeKey) {
    jql += ` AND key != "${escapeJql(excludeKey)}"`;
  }
  jql += ` ORDER BY created DESC`;

  const fields = ['summary', 'status', 'created', 'duedate', ...Object.values(mapping).filter(Boolean)];
  const issues = await searchAll(jql, fields, 10);
  return issues.map(i => normalizeDeviation(i, mapping));
}

/**
 * Resolver: getSites()
 */
export async function getSites() {
  console.log('getSites v2');
  const { mapping } = await getFieldMapping();
  const jql = `issuetype = "${ISSUE_TYPE}"`;
  const issues = await searchAll(jql, ['status', 'created', mapping['site'], mapping['category']]);

  const siteMap = {};
  for (const issue of issues) {
    const site = fieldText(issue.fields[mapping['site']]) || 'Unassigned';
    const cat = fieldText(issue.fields[mapping['category']]).trim().toLowerCase();
    const isDone = issue.fields?.status?.statusCategory?.key === 'done';
    if (!siteMap[site]) {
      siteMap[site] = { id: site, name: site, total: 0, open: 0, major: 0, minor: 0, flagged: false };
    }
    siteMap[site].total++;
    if (!isDone) siteMap[site].open++;
    if (cat === 'major') siteMap[site].major++;
    else siteMap[site].minor++;
    if (siteMap[site].total > 5) siteMap[site].flagged = true;
  }

  return Object.values(siteMap).sort((a, b) => b.total - a.total);
}

/**
 * Resolver: getCapas()
 */
export async function getCapas() {
  console.log('getCapas v2');
  const { mapping } = await getFieldMapping();
  // Issues with due date or marked with CAPA requirement
  const jql = `issuetype = "${ISSUE_TYPE}" AND (duedate is not EMPTY OR "${mapping['category']}" = "major") ORDER BY duedate ASC`;
  const issues = await searchAll(jql, ['summary', 'status', 'created', 'duedate', 'assignee', ...Object.values(mapping).filter(Boolean)]);

  const now = new Date();
  return issues.map(i => {
    const norm = normalizeDeviation(i, mapping);
    const dueDate = norm.dueDate ? new Date(norm.dueDate) : null;
    const isOverdue = dueDate && dueDate < now && !norm.isDone;
    const daysDiff = dueDate ? Math.round(Math.abs(dueDate - now) / (1000 * 60 * 60 * 24)) : null;

    let dueLabel = 'No CAPA due date';
    let dueTone = 'normal';
    if (norm.isDone) {
      dueLabel = 'Closed';
      dueTone = 'closed';
    } else if (isOverdue) {
      dueLabel = `Overdue by ${daysDiff}d`;
      dueTone = 'overdue';
    } else if (dueDate) {
      dueLabel = daysDiff <= 1 ? 'Tomorrow' : `Due ${dueDate.toLocaleDateString()}`;
      dueTone = daysDiff <= 3 ? 'soon' : 'normal';
    }

    return {
      id: norm.key,
      key: norm.key,
      subject: norm.subjectId,
      site: norm.site,
      summary: norm.summary,
      pi: 'Study Investigator',
      severity: norm.category === 'major' ? 'Major' : 'Minor',
      category: norm.category,
      status: norm.status,
      statusTone: norm.isDone ? 'green' : (isOverdue ? 'red' : 'blue'),
      dueDate: norm.dueDate,
      dueLabel,
      dueNote: norm.dueDate ? `Target: ${new Date(norm.dueDate).toLocaleDateString()}` : 'Target: Not set',
      dueTone,
      owner: norm.assignee.name,
      initials: norm.assignee.initials,
      avatar: '#0052CC',
      age: `${norm.daysOpen} days`,
      isOverdue
    };
  });
}

/**
 * Resolver: getSiteTasks(site)
 */
export async function getSiteTasks(site) {
  console.log(`getSiteTasks v2 for ${site || 'all'}`);
  const { mapping } = await getFieldMapping();

  let jql = `project = CLIN`;
  if (site && site !== 'all') {
    jql += ` AND (site ~ "${escapeJql(site)}" OR text ~ "${escapeJql(site)}")`;
  }
  jql += ` ORDER BY duedate ASC`;

  let issues = [];
  try {
    issues = await searchAll(jql, ['summary', 'status', 'duedate', 'assignee', 'priority', mapping['site']]);
  } catch (e) {
    console.warn('getSiteTasks search failed, falling back to Protocol Deviations:', e.message);
    const fallbackJql = `issuetype = "${ISSUE_TYPE}" ORDER BY created DESC`;
    issues = await searchAll(fallbackJql, ['summary', 'status', 'duedate', 'assignee', 'priority', mapping['site']]);
  }

  return issues.slice(0, 15).map(i => {
    const isDone = i.fields?.status?.statusCategory?.key === 'done';
    const issueSite = fieldText(i.fields?.[mapping['site']]) || 'Unassigned';
    return {
      id: i.key,
      title: i.fields?.summary || 'Untitled Task',
      priority: i.fields?.priority?.name || 'Medium',
      detail: `Site: ${issueSite} | Status: ${i.fields?.status?.name || 'Open'}`,
      due: i.fields?.duedate ? new Date(i.fields.duedate).toLocaleDateString() : 'Pending schedule',
      status: i.fields?.status?.name || 'In Progress',
      ref: i.key,
      done: isDone,
      assignee: i.fields?.assignee?.displayName || 'Unassigned'
    };
  });
}

/**
 * Resolver: getReports()
 */
export async function getReports() {
  console.log('getReports v2');
  const { mapping } = await getFieldMapping();
  const issues = await searchAll(`issuetype = "${ISSUE_TYPE}"`, ['created', 'status', mapping['category'], mapping['Root cause'], mapping['site']]);

  const byCategory = {};
  const byRootCause = {};
  const bySite = {};
  const byMonth = {};

  for (const i of issues) {
    const cat = fieldText(i.fields[mapping['category']]).trim().toLowerCase() || 'unknown';
    byCategory[cat] = (byCategory[cat] || 0) + 1;

    const rc = fieldText(i.fields[mapping['Root cause']]) || 'Not specified';
    byRootCause[rc] = (byRootCause[rc] || 0) + 1;

    const s = fieldText(i.fields[mapping['site']]) || 'Unassigned';
    bySite[s] = (bySite[s] || 0) + 1;

    if (i.fields?.created) {
      const month = i.fields.created.slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    }
  }

  return {
    total: issues.length,
    byCategory,
    byRootCause,
    bySite,
    byMonth
  };
}

export async function getSiteHistory(site) {
  return getRelatedDeviations(site, null);
}
