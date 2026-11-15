import { getFeatureConfig } from '../services/deviationData.js';
import { getIssue } from '../lib/jira.js';
import { reconcileProject } from '../engine/reconcile.js';

function eventIssue(event) {
  return event?.issue || event?.body?.issue || event?.data?.issue || null;
}

function safeErrorCode(error) {
  if (Number.isInteger(error?.status)) return `jira_${error.status}`;
  if (error?.name === 'ProjectLockError') return 'project_lock_busy';
  return 'reconciliation_failed';
}

export async function handler(event) {
  try {
    let issue = eventIssue(event);
    const issueKey = issue?.key || event?.issueKey || event?.issue?.key;
    if (!issueKey) {
      return { ok: false, error: { code: 'missing_issue_key', message: 'The Jira event did not include an issue key.' } };
    }
    if (!issue?.fields?.project?.key || !issue?.fields?.issuetype?.name) {
      issue = await getIssue(issueKey, ['project', 'issuetype'], { as: 'app' });
    }
    const projectKey = issue?.fields?.project?.key;
    const issueType = issue?.fields?.issuetype?.name;
    if (!projectKey || !issueType) {
      return { ok: false, error: { code: 'missing_issue_context', message: 'The Jira event is missing project or issue type information.' } };
    }

    const config = await getFeatureConfig('app');
    const isRelevant = [config.deviationIssueType, config.capaIssueType]
      .some(name => name.toLowerCase() === issueType.toLowerCase());
    if (!isRelevant) return { ok: true, data: { ignored: true } };
    const result = await reconcileProject(projectKey, { issueKey });
    return { ok: true, data: result };
  } catch (error) {
    console.error('Deviation pattern event handler failed', { code: safeErrorCode(error) });
    return {
      ok: false,
      error: {
        code: safeErrorCode(error),
        message: 'Pattern reconciliation could not be completed.',
      },
    };
  }
}
