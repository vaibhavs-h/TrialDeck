import { ISSUE_TYPE } from '../lib/config';
import { escapeJql, getIssue, searchIssues } from '../lib/jira';

export async function getDeviation(issueKey) {
  return getIssue(issueKey);
}

export async function getSiteHistory(site) {
  const jql = `issuetype = "${ISSUE_TYPE}" AND "Site" = "${escapeJql(site)}" ORDER BY created DESC`;
  return searchIssues(jql);
}

export async function getRelatedDeviations(site, excludeKey) {
  const jql = `issuetype = "${ISSUE_TYPE}" AND "Site" = "${escapeJql(site)}" AND key != "${escapeJql(excludeKey)}" ORDER BY created DESC`;
  return searchIssues(jql, ['summary', 'status'], 10);
}
