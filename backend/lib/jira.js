import api, { route } from '@forge/api';

/**
 * Escapes characters for JQL strings
 */
export function escapeJql(str) {
  if (!str) return '';
  return String(str).replace(/(["\\])/g, '\\$1');
}

/**
 * Helper to extract text from Jira field values.
 * Handles strings, objects (select/status), and arrays.
 */
export const fieldText = (v) => {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map(fieldText).filter(Boolean).join(', ');
  if (typeof v === 'string') return v;
  return v.value ?? v.name ?? v.displayName ?? '';
};

/**
 * Finds a custom field ID by field name from Jira's /rest/api/3/field endpoint.
 * Performs case-insensitive, whitespace-trimmed matching.
 */
export function findCustomFieldId(fields, fieldName) {
  const normalizedSearch = fieldName.trim().toLowerCase();
  const field = fields.find(f => f.name && f.name.trim().toLowerCase() === normalizedSearch);
  return field?.id || null;
}

/**
 * Validates that a required field ID exists; throws a clear error if not.
 */
export function validateRequiredField(fieldId, fieldName, availableFields) {
  if (!fieldId) {
    const fieldNames = availableFields.map(f => f.name).join(', ');
    throw new Error(`Missing required Jira custom field: "${fieldName}". Available fields: ${fieldNames}`);
  }
}

/**
 * Fetches a single Jira issue by its key.
 * @param {string} issueKey - The key of the issue (e.g. "CLIN-1").
 * @returns {Promise<Object>} - The issue object from Jira API.
 */
export async function getIssue(issueKey) {
  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch issue ${issueKey} (status ${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * Performs a paginated search against Jira's /rest/api/3/search/jql endpoint.
 * Always uses POST and collects all results by following nextPageToken.
 * @param {string} jql - The JQL query string.
 * @param {string[]} fields - Array of fields to request (e.g., ['summary', 'status']).
 * @param {number} maxResults - Maximum results per page (default 100).
 * @returns {Promise<Object[]>} - A promise that resolves to an array of all collected issues.
 * @throws {Error} - If the Jira API request fails.
 */
export async function searchAll(jql, fields, maxResults = 100) {
  const collectedIssues = [];
  let nextPageToken = null;
  let isLast = false;

  do {
    const body = { jql, fields, maxResults };
    if (nextPageToken) body.nextPageToken = nextPageToken;

    const res = await api.asUser().requestJira(
      route`/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to search Jira (status ${res.status}): ${errorText}`);
    }

    const data = await res.json();
    collectedIssues.push(...(data.issues ?? []));
    nextPageToken = data.nextPageToken;
    isLast = data.isLast ?? (!data.nextPageToken);
  } while (!isLast);

  return collectedIssues;
}
