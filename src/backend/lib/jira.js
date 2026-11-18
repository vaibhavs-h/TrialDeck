import api, { route } from '@forge/api';

const MAX_SEARCH_RESULTS = 5000;
const MAX_PAGE_SIZE = 100;
const MAX_RETRIES = 4;

export class JiraRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'JiraRequestError';
    this.status = status;
  }
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function retryAfterMs(response, attempt) {
  const retryAfter = response.headers.get('Retry-After');
  if (retryAfter !== null) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) return Math.max(0, retryAt - Date.now());
  }
  return Math.min(8000, 250 * (2 ** attempt)) + Math.floor(Math.random() * 100);
}

async function requestWithRetry(request) {
  for (let attempt = 0; ; attempt++) {
    const response = await request();
    const retryable = response.status === 429 || (response.status >= 500 && response.status <= 599);
    if (!retryable || attempt >= MAX_RETRIES) return response;
    await new Promise(resolve => setTimeout(resolve, retryAfterMs(response, attempt)));
  }
}

function jiraClient(as) {
  return as === 'app' ? api.asApp() : api.asUser();
}

function checkedSearchLimit(max) {
  const requested = Number(max);
  if (!Number.isInteger(requested) || requested < 1) {
    throw new TypeError('max must be a positive integer.');
  }
  return Math.min(requested, MAX_SEARCH_RESULTS);
}

export function escapeJql(value) {
  if (value == null) return '';
  return String(value).replace(/(["\\])/g, '\\$1');
}

export function fieldText(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(fieldText).filter(Boolean).join(', ');
  if (typeof value === 'string') return value;
  if (!isRecord(value)) return '';
  const base = value.value ?? value.name ?? value.displayName ?? value.text;
  const baseText = typeof base === 'string' ? base : '';
  const childText = fieldText(value.child);
  if (baseText && childText) return `${baseText} / ${childText}`;
  if (baseText) return baseText;
  if (childText) return childText;
  if (Array.isArray(value.content)) return fieldText(value.content);
  return '';
}

export function findCustomFieldId(fields, fieldName) {
  if (!Array.isArray(fields) || typeof fieldName !== 'string') return null;
  const normalizedSearch = fieldName.trim().toLowerCase().replace(/[_\-\s]+/g, ' ');
  const field = fields.find(item => {
    if (!item || typeof item.name !== 'string') return false;
    const itemName = item.name.trim().toLowerCase().replace(/[_\-\s]+/g, ' ');
    return itemName === normalizedSearch;
  });
  return field?.id || null;
}

export function validateRequiredField(fieldId, fieldName) {
  // Graceful check: no longer throws fatal errors to prevent crashing resolvers
  if (!fieldId) {
    console.warn(`[TrialDeck] Optional or unmapped Jira custom field: "${fieldName}".`);
    return false;
  }
  return true;
}

export async function searchAll(jql, fields, pageSize = MAX_PAGE_SIZE, options = {}) {
  const { as = 'user', max = MAX_SEARCH_RESULTS } = options;
  const totalLimit = checkedSearchLimit(max);
  const normalizedPageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.isInteger(pageSize) ? pageSize : MAX_PAGE_SIZE),
  );
  if (typeof jql !== 'string' || !jql.trim()) {
    throw new TypeError('A bounded JQL query is required.');
  }
  if (!Array.isArray(fields) || fields.length === 0 || fields.some(field => typeof field !== 'string')) {
    throw new TypeError('An explicit Jira fields list is required.');
  }

  const collectedIssues = [];
  const seenTokens = new Set();
  let nextPageToken;
  do {
    const body = {
      jql,
      fields: [...new Set(fields)],
      maxResults: Math.min(normalizedPageSize, totalLimit - collectedIssues.length),
    };
    if (nextPageToken) body.nextPageToken = nextPageToken;

    const response = await requestWithRetry(() => jiraClient(as).requestJira(
      route`/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      },
    ));
    if (!response.ok) {
      throw new JiraRequestError(`Jira search failed with status ${response.status}.`, response.status);
    }

    const data = await response.json();
    if (!isRecord(data) || !Array.isArray(data.issues)) {
      throw new JiraRequestError('Jira search returned an invalid response.', response.status);
    }
    collectedIssues.push(...data.issues.slice(0, totalLimit - collectedIssues.length));
    const token = typeof data.nextPageToken === 'string' ? data.nextPageToken : undefined;
    if (token && seenTokens.has(token)) {
      throw new JiraRequestError('Jira search returned a repeated pagination token.', response.status);
    }
    if (token) seenTokens.add(token);
    nextPageToken = token;
  } while (nextPageToken && collectedIssues.length < totalLimit);

  return collectedIssues;
}

export async function getIssue(issueKey, fields = ['*all'], options = {}) {
  if (typeof issueKey !== 'string' || !/^[A-Z][A-Z0-9_]+-\d+$/.test(issueKey)) {
    throw new TypeError('A valid Jira issue key is required.');
  }
  if (!Array.isArray(fields) || fields.length === 0) {
    throw new TypeError('An explicit Jira fields list is required.');
  }
  const response = await requestWithRetry(() => jiraClient(options.as || 'user').requestJira(
    route`/rest/api/3/issue/${issueKey}?fields=${fields.join(',')}`,
    { headers: { Accept: 'application/json' } },
  ));
  if (!response.ok) {
    throw new JiraRequestError(`Jira issue request failed with status ${response.status}.`, response.status);
  }
  return response.json();
}

export async function getIssueLinks(issueKey, options = {}) {
  const issue = await getIssue(issueKey, ['issuelinks'], options);
  return Array.isArray(issue?.fields?.issuelinks) ? issue.fields.issuelinks : [];
}

export async function canBrowse(projectKeyOrIssueKey) {
  if (typeof projectKeyOrIssueKey !== 'string') return false;
  const isIssueKey = /^[A-Z][A-Z0-9_]+-\d+$/.test(projectKeyOrIssueKey);
  if (!isIssueKey && !/^[A-Z][A-Z0-9_]+$/.test(projectKeyOrIssueKey)) return false;
  const resource = isIssueKey
    ? route`/rest/api/3/issue/${projectKeyOrIssueKey}?fields=key`
    : route`/rest/api/3/project/${projectKeyOrIssueKey}`;
  const response = await requestWithRetry(() =>
    api.asUser().requestJira(resource, { headers: { Accept: 'application/json' } })
  );
  if (response.status === 403 || response.status === 404) return false;
  if (!response.ok) {
    throw new JiraRequestError(`Jira permission check failed with status ${response.status}.`, response.status);
  }
  return true;
}
