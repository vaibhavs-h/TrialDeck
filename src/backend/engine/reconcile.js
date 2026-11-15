import { loadDeviationData } from '../services/deviationData.js';
import {
  appendAudit,
  saveProjectStateUnlocked,
  withProjectLock,
} from '../services/feature2Storage.js';
import { detectPatterns, summarizeAggregates } from './detectPatterns.js';

export async function reconcileProject(projectKey, options = {}) {
  let result;
  await withProjectLock(projectKey, async () => {
    const { config, deviations, capaByKey } = await loadDeviationData(projectKey, { as: 'app' });
    const alerts = detectPatterns(deviations, config.patternRules);
    const aggregates = summarizeAggregates(deviations, alerts);
    aggregates.linkedCapaCount = Object.keys(capaByKey).length;
    await saveProjectStateUnlocked(projectKey, aggregates, alerts);
    result = { totalDeviations: deviations.length, alertCount: alerts.length };
  });
  await appendAudit(projectKey, {
    actorAccountId: options.actorAccountId || 'system',
    action: 'pattern_reconciliation',
    targetId: options.issueKey || projectKey,
    details: result,
  });
  return result;
}
