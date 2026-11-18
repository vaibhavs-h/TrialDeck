const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9_]+$/;

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function escapeJql(value) {
  return String(value).replace(/(["\\])/g, '\\$1');
}

export function validateProjectKey(projectKey) {
  if (typeof projectKey !== 'string' || !PROJECT_KEY_PATTERN.test(projectKey)) {
    throw new ValidationError('Invalid Jira project key.');
  }
  return projectKey;
}

function quote(value) {
  return `"${escapeJql(value)}"`;
}

function customFieldReference(fieldId) {
  if (typeof fieldId !== 'string' || !/^customfield_\d+$/.test(fieldId)) {
    throw new ValidationError('A valid stored custom field mapping is required.');
  }
  return `cf[${fieldId.slice('customfield_'.length)}]`;
}

function baseProjectQuery(projectKey) {
  if (Array.isArray(projectKey)) {
    const validKeys = projectKey.map(validateProjectKey);
    if (validKeys.length === 1) return `project = ${validKeys[0]}`;
    if (validKeys.length > 1) return `project in (${validKeys.join(', ')})`;
    return 'project is not null';
  }
  if (!projectKey || projectKey === 'ALL') {
    return 'project is not null';
  }
  return `project = ${validateProjectKey(projectKey)}`;
}

export function deviationsInWindow(projectKey, issueTypeName, days, filters = {}, fieldMap = {}) {
  if (!Number.isInteger(days) || days < 1) {
    throw new ValidationError('The window must be a positive number of days.');
  }
  return deviationsQuery(projectKey, issueTypeName, filters, fieldMap, `created >= -${days}d`);
}

export function deviationsInProject(projectKey, issueTypeName, filters = {}, fieldMap = {}) {
  return deviationsQuery(projectKey, issueTypeName, filters, fieldMap);
}

function deviationsQuery(projectKey, issueTypeName, filters, fieldMap, dateClause) {
  const clauses = [baseProjectQuery(projectKey), `issuetype = ${quote(issueTypeName)}`];
  if (dateClause) clauses.push(dateClause);
  for (const [filterName, fieldName] of [['site', 'site'], ['category', 'category'], ['rootCause', 'rootCause']]) {
    const filterValue = filters[filterName];
    if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
      clauses.push(`${customFieldReference(fieldMap[fieldName])} = ${quote(filterValue)}`);
    }
  }
  return clauses.join(' AND ');
}

export function overdueCapas(projectKey, capaTypeName) {
  return `${baseProjectQuery(projectKey)} AND issuetype = ${quote(capaTypeName)} AND duedate < now() AND statusCategory != Done`;
}

export function openCapas(projectKey, capaTypeName) {
  return `${baseProjectQuery(projectKey)} AND issuetype = ${quote(capaTypeName)} AND statusCategory != Done`;
}
