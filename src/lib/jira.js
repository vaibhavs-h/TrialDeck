import api, { route } from '@forge/api';
import { DEFAULT_MAX_RESULTS } from './config';

/** Escape a value for use inside a double-quoted JQL string literal. */
export function escapeJql(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/[\r\n]+/g, ' ');
}

export async function getIssue(issueKey) {
  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`);
  if (!res.ok) throw new Error(`Jira error ${res.status}`);
  return res.json();
}

export async function searchIssues(jql, fields = ['summary', 'status'], max = DEFAULT_MAX_RESULTS) {
  const res = await api
    .asUser()
    .requestJira(
      route`/rest/api/3/search/jql?jql=${jql}&maxResults=${max}&fields=${fields.join(',')}`,
    );
  if (!res.ok) throw new Error(`Jira search error ${res.status}`);
  const body = await res.json();
  return body.issues ?? [];
}

// TODO (week 1-2): getFieldIdsByName() using GET /rest/api/3/field, cached per invocation.
