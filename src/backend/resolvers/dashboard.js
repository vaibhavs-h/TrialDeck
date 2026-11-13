import api, { route } from '@forge/api';
import { searchAll, findCustomFieldId, validateRequiredField } from '../lib/jira';
import { normalizeDeviation } from '../lib/mapper';

/**
 * Groups issues by site, counting total, major, and minor
 */
function groupBySite(issues) {
  const siteCounts = {};

  issues.forEach(issue => {
    const siteKey = issue.site || 'Unassigned';
    const { category } = issue;

    if (!siteCounts[siteKey]) {
      siteCounts[siteKey] = { total: 0, major: 0, minor: 0 };
    }

    siteCounts[siteKey].total++;
    if (category === 'major') {
      siteCounts[siteKey].major++;
    } else if (category === 'minor') {
      siteCounts[siteKey].minor++;
    }
  });

  return Object.entries(siteCounts)
    .map(([id, counts]) => ({
      id,
      name: id,
      total: counts.total,
      major: counts.major,
      minor: counts.minor,
      flagged: counts.total > 5
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Checks if a site has 2 or more deviations in the same Root cause or same summary theme (e.g. consent, window, dosing, lab)
 */
function findRepeatSites(issues) {
  const siteThemeCounts = {};
  const activeSites = new Set();

  const themes = ['consent', 'window', 'dosing', 'dose', 'lab', 'safety', 'eligibility', 'temperature', 'storage'];

  issues.forEach(issue => {
    const siteKey = issue.site || 'Unassigned';
    if (siteKey === 'Unassigned') return;
    activeSites.add(siteKey);

    if (!siteThemeCounts[siteKey]) {
      siteThemeCounts[siteKey] = {
        rootCauses: {},
        themes: {},
        total: 0
      };
    }
    siteThemeCounts[siteKey].total++;

    // Track root cause
    const rc = (issue.rootCause || '').toLowerCase().trim();
    if (rc && rc !== 'not specified') {
      siteThemeCounts[siteKey].rootCauses[rc] = (siteThemeCounts[siteKey].rootCauses[rc] || 0) + 1;
    }

    // Track summary themes
    const summaryLower = (issue.summary || '').toLowerCase();
    themes.forEach(theme => {
      if (summaryLower.includes(theme)) {
        siteThemeCounts[siteKey].themes[theme] = (siteThemeCounts[siteKey].themes[theme] || 0) + 1;
      }
    });
  });

  const repeatSites = [];
  Object.entries(siteThemeCounts).forEach(([site, data]) => {
    const hasRepeatRootCause = Object.values(data.rootCauses).some(count => count >= 2);
    const hasRepeatTheme = Object.values(data.themes).some(count => count >= 2);
    const hasMultipleDeviations = data.total >= 2;

    if (hasRepeatRootCause || hasRepeatTheme || hasMultipleDeviations) {
      repeatSites.push(site);
    }
  });

  return {
    sites: repeatSites.join(', '),
    activeSites: activeSites.size
  };
}

/**
 * Generates a clean weekly trend data array from grouped issues
 */
function generateWeeklyTrend(issues) {
  const today = new Date();
  const currentWeek = Math.ceil((Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))) / 7);

  const weeklyCounts = {};
  for (let w = currentWeek - 11; w <= currentWeek; w++) {
    weeklyCounts[w] = 0;
  }

  issues.forEach(issue => {
    const dateField = issue.dateDetected || issue.created;
    if (dateField) {
      const dateObj = new Date(dateField);
      const dayOfYear = Math.floor((dateObj - new Date(dateObj.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      const weekOfYear = Math.ceil(dayOfYear / 7);
      if (weeklyCounts[weekOfYear] !== undefined) {
        weeklyCounts[weekOfYear]++;
      }
    }
  });

  return Object.values(weeklyCounts);
}

function getTrendSummary(weeklyTrend) {
  if (!weeklyTrend || weeklyTrend.length === 0) {
    return { average: '0.0 / wk', movingAvg: '0.0 items/wk', stability: 'Stable' };
  }
  const avg = (weeklyTrend.reduce((a, b) => a + b, 0) / weeklyTrend.length).toFixed(1);
  const movingAvg = (weeklyTrend.slice(-3).reduce((a, b) => a + b, 0) / 3).toFixed(1);
  const direction = weeklyTrend.length >= 2 && weeklyTrend[weeklyTrend.length - 1] > weeklyTrend[weeklyTrend.length - 2] ? 'Trending Upward' : 'Trending Downward';

  return {
    average: `${avg} / wk`,
    movingAvg: `${movingAvg} items/wk`,
    stability: direction
  };
}

function buildOverdueList(issues) {
  const now = new Date();
  return issues
    .filter(issue => (issue.dueDate && new Date(issue.dueDate) < now && !issue.isDone) || issue.category === 'major')
    .slice(0, 10)
    .map(issue => {
      const daysOverdue = issue.dueDate ? Math.round(Math.abs(new Date(issue.dueDate) - now) / (1000 * 60 * 60 * 24)) : null;
      const isPastDue = issue.dueDate && new Date(issue.dueDate) < now && !issue.isDone;
      const dueLabel = issue.isDone ? 'Closed' : (isPastDue ? `Overdue by ${daysOverdue}d` : (issue.dueDate ? `Due ${new Date(issue.dueDate).toLocaleDateString()}` : 'No CAPA due date'));

      return {
        id: issue.key,
        key: issue.key,
        subject: issue.subjectId,
        site: issue.site,
        pi: 'Study Investigator',
        severity: issue.category === 'major' ? 'Major' : 'Minor',
        category: issue.category,
        status: issue.status,
        statusTone: issue.isDone ? 'green' : (isPastDue ? 'red' : 'blue'),
        dueLabel: dueLabel,
        dueNote: issue.dueDate ? `Target: ${new Date(issue.dueDate).toLocaleDateString()}` : 'Target: Not set',
        dueTone: issue.isDone ? 'closed' : (isPastDue ? 'overdue' : 'normal'),
        owner: issue.assignee?.name || 'Staff User',
        initials: issue.assignee?.initials || 'SU',
        avatar: '#0052CC',
        age: daysOverdue ? `${daysOverdue} days` : `${issue.daysOpen || 0} days`
      };
    });
}

export async function getDashboard() {
  console.log('getDashboard v2');
  try {
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

    // 1. Fetch custom field IDs by name
    const fieldResponse = await api.asUser().requestJira(route`/rest/api/3/field`);
    if (!fieldResponse.ok) {
      const status = fieldResponse.status;
      const errorText = await fieldResponse.text();
      throw new Error(`Failed to fetch Jira fields (status ${status}): ${errorText}`);
    }

    const fieldsData = await fieldResponse.json();
    const fieldMapping = {};

    for (const name of ALL_FIELD_NAMES) {
      const fieldId = findCustomFieldId(fieldsData, name);
      if (fieldId) {
        fieldMapping[name] = fieldId;
      }
    }

    validateRequiredField(fieldMapping['site'], 'site', fieldsData);
    validateRequiredField(fieldMapping['category'], 'category', fieldsData);

    const jql = 'issuetype = "Protocol Deviation" ORDER BY created DESC';
    const fieldsToRequest = ['summary', 'status', 'created', 'duedate', 'assignee', 'reporter'];
    for (const name of ALL_FIELD_NAMES) {
      const fieldId = fieldMapping[name];
      if (fieldId) fieldsToRequest.push(fieldId);
    }

    const collectedIssues = await searchAll(jql, fieldsToRequest);

    const issues = collectedIssues.map(issue =>
      normalizeDeviation(issue, fieldMapping)
    );

    const bySite = groupBySite(issues);
    const repeatSites = findRepeatSites(issues);

    // Overdue CAPAs KPI = count of issues with duedate in the past and statusCategory not done
    const now = new Date();
    const overdueCapasCount = issues.filter(i => i.dueDate && new Date(i.dueDate) < now && !i.isDone).length;

    // Treat an issue as open when statusCategory.key !== "done"
    const openIssues = issues.filter(i => !i.isDone);

    const kpis = {
      open: openIssues.length,
      totalCount: issues.length,
      major: openIssues.filter(i => i.category === 'major').length,
      overdueCapas: overdueCapasCount,
      sitesAffected: bySite.length,
      repeatSites: repeatSites,
      simulatedThreshold: '≤ 15',
      simulatedDelta: openIssues.length > 15 ? 'Elevated' : 'Normal',
      overdueCapasList: buildOverdueList(issues)
    };

    const weeklyTrend = generateWeeklyTrend(issues);
    const trendSummary = getTrendSummary(weeklyTrend);

    // Build insight banner
    const flaggedSite = bySite.find(s => s.flagged);
    const insight = flaggedSite ? {
      site: flaggedSite.name,
      message: `has logged ${flaggedSite.total} protocol deviations. Having multiple deviations may indicate systemic process gaps that need immediate CRA review.`
    } : null;

    const allSites = bySite.map(s => s.name);

    return {
      kpis,
      bySite,
      sites: allSites,
      byCategory: {
        total: kpis.open,
        major: kpis.major,
        minor: kpis.open - kpis.major,
        unknown: 0
      },
      trend: {
        weekly: weeklyTrend,
        summary: trendSummary
      },
      overdueCapasList: kpis.overdueCapasList,
      insight
    };
  } catch (error) {
    console.error('getDashboard error:', error);
    throw error;
  }
}

export default getDashboard;
