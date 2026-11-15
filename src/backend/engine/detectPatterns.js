const DAY_MS = 86_400_000;

function timestamp(issue) {
  const parsed = Date.parse(issue.dateDetected || issue.created || '');
  return Number.isFinite(parsed) ? parsed : null;
}

function withinDays(issue, days, now) {
  const value = timestamp(issue);
  return value !== null && value >= now - days * DAY_MS && value <= now;
}

function groupBy(items, selector) {
  const groups = new Map();
  for (const item of items) {
    const key = selector(item);
    if (!key) continue;
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

function alert(rule, severity, title, description, dimensions, count) {
  return {
    id: `${rule}:${Object.values(dimensions).join(':')}`,
    rule,
    severity,
    title,
    description,
    dimensions,
    count,
    computedAt: new Date().toISOString(),
  };
}

function siteClusterAlerts(issues, rules, now) {
  const perSite = groupBy(
    issues.filter(issue => withinDays(issue, rules.siteCluster.windowDays, now) && issue.site && issue.site !== 'Unassigned'),
    issue => issue.site,
  );
  return [...perSite.entries()]
    .filter(([, group]) => group.length >= rules.siteCluster.threshold)
    .map(([site, group]) => alert(
      'SITE_CLUSTER',
      'Medium',
      'Deviation cluster at one site',
      `${group.length} deviations were recorded at ${site} within ${rules.siteCluster.windowDays} days.`,
      { site },
      group.length,
    ));
}

function crossSiteRootCauseAlerts(issues, rules, now) {
  const recent = issues.filter(issue =>
    withinDays(issue, rules.crossSiteRootCause.windowDays, now)
      && issue.rootCause
      && issue.rootCause !== 'Not specified'
      && issue.site
      && issue.site !== 'Unassigned'
  );
  const byCause = groupBy(recent, issue => issue.rootCause);
  const results = [];
  for (const [rootCause, group] of byCause) {
    const sites = [...new Set(group.map(issue => issue.site))];
    if (sites.length < rules.crossSiteRootCause.threshold) continue;
    results.push(alert(
      'CROSS_SITE_ROOT_CAUSE',
      sites.length >= rules.crossSiteRootCause.highAlertSites ? 'High' : 'Medium',
      'Root cause detected across sites',
      `${rootCause} has been reported at ${sites.length} sites within ${rules.crossSiteRootCause.windowDays} days.`,
      { rootCause, sites: sites.sort() },
      group.length,
    ));
  }
  return results;
}

function siteOutlierAlerts(issues, rules, now) {
  const recent = issues.filter(issue =>
    withinDays(issue, rules.siteOutlier.windowDays, now) && issue.site && issue.site !== 'Unassigned'
  );
  const counts = groupBy(recent, issue => issue.site);
  if (counts.size < rules.siteOutlier.minimumSites) return [];
  const mean = recent.length / counts.size;
  return [...counts.entries()]
    .filter(([, group]) =>
      group.length >= rules.siteOutlier.minimumCount
      && group.length >= mean * rules.siteOutlier.meanMultiplier
    )
    .map(([site, group]) => alert(
      'SITE_OUTLIER',
      'Medium',
      'Site deviation rate is above the observed mean',
      `${site} has ${group.length} deviations, at least ${rules.siteOutlier.meanMultiplier}x the mean across ${counts.size} sites in ${rules.siteOutlier.windowDays} days.`,
      { site },
      group.length,
    ));
}

function majorSpikeAlerts(issues, rules, now) {
  const bySite = groupBy(
    issues.filter(issue =>
      issue.category === 'major'
      && withinDays(issue, rules.majorSpike.windowDays, now)
      && issue.site
      && issue.site !== 'Unassigned'
    ),
    issue => issue.site,
  );
  return [...bySite.entries()]
    .filter(([, group]) => group.length >= rules.majorSpike.threshold)
    .map(([site, group]) => alert(
      'MAJOR_SPIKE',
      'High',
      'Major deviation spike',
      `${group.length} major deviations were recorded at ${site} within ${rules.majorSpike.windowDays} days.`,
      { site },
      group.length,
    ));
}

function repeatAfterCapaAlerts(issues, rules, now) {
  const datedIssues = issues
    .filter(issue => issue.site && issue.site !== 'Unassigned' && issue.rootCause && issue.rootCause !== 'Not specified')
    .map(issue => ({ issue, createdAt: timestamp(issue) }))
    .filter(item => item.createdAt !== null);
  const results = [];
  for (const { issue: original } of datedIssues) {
    const resolvedAt = Date.parse(original.capa?.resolvedAt || '');
    if (!Number.isFinite(resolvedAt) || resolvedAt < now - rules.repeatAfterCapa.windowDays * DAY_MS) continue;
    const repeated = datedIssues.some(({ issue: candidate, createdAt }) =>
      candidate.key !== original.key
      && candidate.site === original.site
      && candidate.rootCause === original.rootCause
      && createdAt > resolvedAt
    );
    if (!repeated) continue;
    results.push(alert(
      'REPEAT_AFTER_CAPA',
      'High',
      'Deviation repeated after CAPA resolution',
      `A ${original.rootCause} deviation was recorded at ${original.site} after its linked CAPA was resolved.`,
      { site: original.site, rootCause: original.rootCause, capaKey: original.capa.key },
      1,
    ));
  }
  return results;
}

export function detectPatterns(issues, patternRules, now = Date.now()) {
  if (!Array.isArray(issues) || !patternRules) return [];
  return [
    ...siteClusterAlerts(issues, patternRules, now),
    ...crossSiteRootCauseAlerts(issues, patternRules, now),
    ...siteOutlierAlerts(issues, patternRules, now),
    ...majorSpikeAlerts(issues, patternRules, now),
    ...repeatAfterCapaAlerts(issues, patternRules, now),
  ];
}

export function summarizeAggregates(issues, alerts, computedAt = new Date().toISOString()) {
  const bySite = {};
  const byCategory = {};
  const byDate = {};
  const byRootCause = {};
  for (const issue of issues) {
    const site = issue.site || 'Unassigned';
    const category = issue.category || 'unknown';
    const rootCause = issue.rootCause || 'Not specified';
    bySite[site] = (bySite[site] || 0) + 1;
    byCategory[category] = (byCategory[category] || 0) + 1;
    byRootCause[rootCause] = (byRootCause[rootCause] || 0) + 1;
    const createdAt = timestamp(issue);
    if (createdAt !== null) {
      const date = new Date(createdAt).toISOString().slice(0, 10);
      byDate[date] = (byDate[date] || 0) + 1;
    }
  }
  return {
    computedAt,
    totalDeviations: issues.length,
    bySite,
    byCategory,
    byRootCause,
    byDate,
    alertCount: alerts.length,
  };
}
