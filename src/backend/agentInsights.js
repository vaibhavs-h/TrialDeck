import { loadDeviationData, loadIssueWithCapa } from './services/deviationData.js';
import { detectPatterns } from './engine/detectPatterns.js';
import { getFeatureConfig } from './services/deviationData.js';
import { searchAll } from './lib/jira.js';
import { SAMPLE_DEVIATIONS } from './services/sampleData.js';
import { fetchTeamworkGraphContext } from './services/teamworkGraph.js';

/**
 * Action: list-deviations (GET)
 * Read-only listing of deviations with optional filtering by site, category, root cause, days.
 * Returns at most 20 items, short fields, truncated flag, and total count.
 */
export async function listDeviations(payload) {
  const site = payload?.site;
  const category = payload?.category;
  const rootCause = payload?.rootCause;
  const days = payload?.days ? Number(payload.days) : 90;

  try {
    const dataResult = await loadDeviationData(null, {
      as: 'user',
      days: Number.isInteger(days) && days > 0 ? days : 90,
      filters: {
        site: site && site !== 'all' ? site : undefined,
        category: category && category !== 'all' ? category : undefined,
        rootCause: rootCause && rootCause !== 'all' ? rootCause : undefined,
      },
    });

    let allDeviations = dataResult.deviations || [];
    let isSample = false;

    if (allDeviations.length === 0) {
      isSample = true;
      allDeviations = SAMPLE_DEVIATIONS.filter(d => {
        if (site && site !== 'all' && d.site !== site) return false;
        if (category && category !== 'all' && d.category !== category) return false;
        if (rootCause && rootCause !== 'all' && d.rootCause !== rootCause) return false;
        return true;
      });
    }

    const limit = 20;
    const truncated = allDeviations.length > limit;
    const deviations = allDeviations.slice(0, limit).map(d => ({
      key: d.key,
      summary: d.summary,
      site: d.site,
      category: d.category,
      rootCause: d.rootCause,
      status: d.status,
      dateDetected: d.dateDetected || d.created,
      reportStatus: d.reportStatus || 'Draft',
    }));

    return {
      deviations,
      count: deviations.length,
      total: allDeviations.length,
      truncated,
      isSampleData: isSample,
    };
  } catch (error) {
    return {
      error: `Failed to list deviations: ${error.message}`,
      deviations: [],
      count: 0,
      total: 0,
      truncated: false,
    };
  }
}

/**
 * Action: find-cross-site-signals (GET)
 * Runs cross-site pattern detection engine on recent deviations.
 * Returns pattern clusters (e.g. repeat visit windows, site cluster spikes) with ticket keys.
 * Truncated to at most 20 alerts.
 */
export async function findCrossSiteSignals(payload) {
  try {
    const dataResult = await loadDeviationData(null, { as: 'user', days: 90 });
    let deviations = dataResult.deviations || [];
    let isSample = false;

    if (deviations.length === 0) {
      isSample = true;
      deviations = SAMPLE_DEVIATIONS;
    }

    const config = await getFeatureConfig('user');
    const alerts = detectPatterns(deviations, config.patternRules);

    const limit = 20;
    const truncated = alerts.length > limit;
    const signals = alerts.slice(0, limit).map(a => ({
      id: a.id,
      rule: a.rule,
      severity: a.severity,
      title: a.title,
      description: a.description,
      site: a.dimensions?.site || null,
      count: a.count,
      recommendation: a.recommendation || null,
    }));

    return {
      signals,
      count: signals.length,
      total: alerts.length,
      truncated,
      isSampleData: isSample,
    };
  } catch (error) {
    return {
      error: `Failed to detect cross-site signals: ${error.message}`,
      signals: [],
      count: 0,
      total: 0,
      truncated: false,
    };
  }
}

/**
 * Action: trace-deviation (GET)
 * Retrieves deep operational traceability for a single deviation:
 * linked CAPA, similar historical deviations, protocol version, and report status.
 */
export async function traceDeviation(payload) {
  const issueKey = payload?.issueKey;
  if (!issueKey) return { error: 'Please provide issueKey (e.g. CLIN-12).' };

  try {
    const { deviation, rawIssue } = await loadIssueWithCapa(issueKey, 'user');
    if (!deviation) {
      return { error: `Deviation ticket "${issueKey}" not found.` };
    }

    // Find similar deviations on the same site or with same root cause
    let similar = [];
    try {
      const site = deviation.site;
      const rootCause = deviation.rootCause;
      let jql = `issuetype = "Protocol Deviation" AND key != "${issueKey}"`;
      if (site && site !== 'Unassigned') {
        jql += ` AND (text ~ "${site}" OR description ~ "${site}")`;
      } else if (rootCause && rootCause !== 'Not specified') {
        jql += ` AND (text ~ "${rootCause}" OR description ~ "${rootCause}")`;
      }
      const rawSimilar = await searchAll(jql + ' ORDER BY created DESC', ['summary', 'status', 'created'], 5, { as: 'user', max: 5 });
      similar = rawSimilar.map(iss => ({
        key: iss.key,
        summary: iss.fields?.summary || '',
        status: iss.fields?.status?.name || '',
      }));
    } catch (ignore) {
      // Best-effort lookup
    }

    // Optional enrichment via Atlassian Teamwork Graph API (if enabled on site)
    let teamworkGraphData = null;
    try {
      teamworkGraphData = await fetchTeamworkGraphContext(issueKey);
    } catch (ignore) {
      // Fallback
    }

    return {
      deviation: {
        key: deviation.key,
        summary: deviation.summary,
        site: deviation.site,
        category: deviation.category,
        rootCause: deviation.rootCause,
        subjectId: deviation.subjectId,
        protocolVersion: deviation.protocolVersion,
        reportStatus: deviation.reportStatus,
        dateDetected: deviation.dateDetected,
        status: deviation.status,
      },
      linkedCapa: deviation.capa ? {
        key: deviation.capa.key,
        summary: deviation.capa.summary,
        status: deviation.capa.status,
        dueDate: deviation.capa.dueDate,
        isOverdue: deviation.capa.isOverdue,
      } : null,
      similarDeviations: similar,
      similarCount: similar.length,
      teamworkGraph: teamworkGraphData,
    };
  } catch (error) {
    return { error: `Trace deviation failed: ${error.message}` };
  }
}

/**
 * Action: site-amendment-status (GET)
 * Queries Jira tasks generated from protocol amendments to summarize training/rollout status across sites.
 * Truncated to at most 20 sites.
 */
export async function siteAmendmentStatus(payload) {
  try {
    const jql = 'labels in (protocol-amendment) ORDER BY created DESC';
    const tasks = await searchAll(jql, ['summary', 'status', 'labels', 'duedate'], 100, { as: 'user', max: 100 });

    const siteMap = {};
    for (const t of tasks) {
      const summary = t.fields?.summary || '';
      const match = /^\[([^\]]+)\]\s*(.*)$/.exec(summary);
      const site = match ? match[1].trim() : 'General';
      const taskTitle = match ? match[2].trim() : summary;
      const statusCategory = t.fields?.status?.statusCategory?.key || '';
      const isDone = statusCategory === 'done';

      if (!siteMap[site]) {
        siteMap[site] = { site, totalTasks: 0, completedTasks: 0, pendingTasks: 0, tasks: [] };
      }
      siteMap[site].totalTasks++;
      if (isDone) siteMap[site].completedTasks++;
      else siteMap[site].pendingTasks++;

      if (siteMap[site].tasks.length < 5) {
        siteMap[site].tasks.push({
          key: t.key,
          title: taskTitle,
          status: t.fields?.status?.name || 'Open',
          dueDate: t.fields?.duedate || null,
          isDone,
        });
      }
    }

    const allSites = Object.values(siteMap);
    const limit = 20;
    const truncated = allSites.length > limit;
    const sites = allSites.slice(0, limit);

    return {
      sites,
      siteCount: sites.length,
      totalSites: allSites.length,
      totalAmendmentTasks: tasks.length,
      truncated,
    };
  } catch (error) {
    return {
      error: `Failed to query site amendment status: ${error.message}`,
      sites: [],
      siteCount: 0,
      totalSites: 0,
      totalAmendmentTasks: 0,
      truncated: false,
    };
  }
}
