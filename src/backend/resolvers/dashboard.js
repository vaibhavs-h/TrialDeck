import { loadDeviationData } from '../services/deviationData.js';
import { isCapaOverdue } from '../lib/mapper.js';
import { detectPatterns } from '../engine/detectPatterns.js';
import { getSampleDashboardData } from '../services/sampleData.js';

const DAY_MS = 86_400_000;

function groupBySite(issues) {
  const counts = new Map();
  for (const issue of issues) {
    const site = issue.site || 'Unassigned';
    const entry = counts.get(site) || { total: 0, major: 0, minor: 0 };
    entry.total++;
    if (issue.category === 'major') entry.major++;
    if (issue.category === 'minor') entry.minor++;
    counts.set(site, entry);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ id: name, name, ...count, flagged: count.total > 5 }))
    .sort((left, right) => right.total - left.total);
}

function weekStart(value) {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

function generateWeeklyTrend(issues, now = new Date()) {
  const currentWeek = weekStart(now);
  const starts = [];
  const buckets = new Map();
  for (let offset = 11; offset >= 0; offset--) {
    const start = new Date(`${currentWeek}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - offset * 7);
    const key = start.toISOString().slice(0, 10);
    starts.push(key);
    buckets.set(key, 0);
  }
  for (const issue of issues) {
    const date = issue.dateDetected || issue.created;
    if (!date) continue;
    const key = weekStart(date);
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + 1);
  }
  return starts.map(key => buckets.get(key));
}

function getTrendSummary(weeklyTrend) {
  const average = weeklyTrend.length
    ? (weeklyTrend.reduce((sum, value) => sum + value, 0) / weeklyTrend.length).toFixed(1)
    : '0.0';
  const recent = weeklyTrend.slice(-3);
  const movingAvg = recent.length
    ? (recent.reduce((sum, value) => sum + value, 0) / recent.length).toFixed(1)
    : '0.0';
  const last = weeklyTrend[weeklyTrend.length - 1] || 0;
  const prior = weeklyTrend[weeklyTrend.length - 2] || 0;
  return {
    average: `${average} / wk`,
    movingAvg: `${movingAvg} items/wk`,
    stability: last > prior ? 'Trending Upward' : last < prior ? 'Trending Downward' : 'Stable',
  };
}

function linkedDeviation(capaKey, deviations) {
  return deviations.find(deviation => deviation.capa?.key === capaKey);
}

function toOverdueCapa(capaIssue, deviations, today) {
  const dueDate = capaIssue.fields?.duedate || null;
  const statusCategory = capaIssue.fields?.status?.statusCategory?.key
    || capaIssue.fields?.status?.statusCategory?.name
    || 'unknown';
  if (!isCapaOverdue(dueDate, statusCategory, today)) return null;
  const deviation = linkedDeviation(capaIssue.key, deviations);
  const assignee = capaIssue.fields?.assignee?.displayName || 'Unassigned';
  const dueDateValue = new Date(`${dueDate.slice(0, 10)}T00:00:00Z`);
  const daysOverdue = Math.max(
    1,
    Math.ceil((Date.parse(`${today}T00:00:00Z`) - dueDateValue.getTime()) / DAY_MS),
  );
  return {
    id: capaIssue.key,
    key: capaIssue.key,
    subject: deviation?.subjectId || null,
    site: deviation?.site || 'Unassigned',
    pi: 'Study Investigator',
    severity: deviation?.category === 'major' ? 'Major' : 'Minor',
    category: deviation?.category || 'unknown',
    status: capaIssue.fields?.status?.name || 'Open',
    statusTone: 'red',
    dueDate,
    dueLabel: `Overdue by ${daysOverdue}d`,
    dueNote: `Target: ${dueDate}`,
    dueTone: 'overdue',
    owner: assignee,
    initials: assignee.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'UN',
    avatar: '#0052CC',
    age: `${daysOverdue} days`,
    isOverdue: true,
  };
}

export async function getDashboard() {
  const result = await loadDeviationData(null, { as: 'user', days: null });
  const { config, deviations = [], capaByKey = {}, projectScope } = result || {};

  // If zero real deviations exist on the site, provide synthetic Sample Data mode
  if (deviations.length === 0) {
    const sample = getSampleDashboardData();
    return {
      ...sample,
      projectScope,
      workTypeMissing: !projectScope?.detectedProjects?.length,
      fieldStatus: {
        missingFields: config?.missingFields || [],
        missingRequired: config?.missingRequired || [],
        hasRequired: config?.hasRequiredFields,
      },
    };
  }

  const bySite = groupBySite(deviations);
  const openIssues = deviations.filter(issue => !issue.isDone);
  const today = new Date().toISOString().slice(0, 10);
  const linkedCapas = Object.values(capaByKey);
  const overdueCapasList = linkedCapas
    .map(capa => toOverdueCapa(capa, deviations, today))
    .filter(Boolean)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .slice(0, 10);
  const patternAlerts = detectPatterns(deviations, config.patternRules);
  const siteClusterAlerts = patternAlerts.filter(item => item.rule === 'SITE_CLUSTER');
  const weeklyTrend = generateWeeklyTrend(deviations);

  const kpis = {
    open: openIssues.length,
    totalCount: deviations.length,
    major: openIssues.filter(issue => issue.category === 'major').length,
    overdueCapas: linkedCapas.filter(capa => isCapaOverdue(
      capa.fields?.duedate,
      capa.fields?.status?.statusCategory?.key || capa.fields?.status?.statusCategory?.name,
      today,
    )).length,
    sitesAffected: bySite.filter(site => site.name !== 'Unassigned').length,
    repeatSites: siteClusterAlerts.map(item => item.dimensions.site).join(', '),
    simulatedThreshold: '≤ 15',
    simulatedDelta: openIssues.length > 15 ? 'Elevated' : 'Normal',
    overdueCapasList,
  };
  const flaggedSite = bySite.find(site => site.flagged);
  const insight = flaggedSite ? {
    site: flaggedSite.name,
    message: `has logged ${flaggedSite.total} protocol deviations. Having multiple deviations may indicate systemic process gaps that need immediate CRA review.`,
  } : null;

  return {
    kpis,
    bySite,
    sites: bySite.map(site => site.name),
    byCategory: {
      total: openIssues.length,
      major: openIssues.filter(issue => issue.category === 'major').length,
      minor: openIssues.filter(issue => issue.category === 'minor').length,
      unknown: openIssues.filter(issue => issue.category === 'unknown').length,
    },
    trend: { weekly: weeklyTrend, summary: getTrendSummary(weeklyTrend) },
    overdueCapasList,
    alerts: patternAlerts,
    insight,
    isSampleData: false,
    projectScope,
  };
}

export default getDashboard;
