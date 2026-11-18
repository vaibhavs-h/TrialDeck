import api, { route } from '@forge/api';
import { getConfig, saveConfig } from './feature2Storage.js';
import {
  escapeJql,
  findCustomFieldId,
  getIssue,
  JiraRequestError,
  searchAll,
} from '../lib/jira.js';
import { getResolvedFieldMapping } from '../lib/fields.js';
import {
  deviationsInProject,
  deviationsInWindow,
  validateProjectKey,
} from '../lib/jql.js';
import { normalizeDeviation } from '../lib/mapper.js';

const FIELD_LABELS = {
  site: 'site',
  category: 'category',
  subjectId: 'Subject ID',
  protocolVersion: 'Protocol version',
  rootCause: 'Root cause',
  dateDetected: 'date detected',
  reportStatus: 'Report status',
};

const DEVIATION_FIELDS = [
  'key', 'project', 'issuetype', 'summary', 'status', 'created',
  'resolutiondate', 'duedate', 'assignee', 'reporter', 'issuelinks',
];

const CAPA_FIELDS = [
  'key', 'project', 'issuetype', 'summary', 'status',
  'created', 'resolutiondate', 'duedate', 'assignee',
];

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clientFor(as) {
  return as === 'app' ? api.asApp() : api.asUser();
}

async function fetchFieldMetadata(as) {
  const response = await clientFor(as).requestJira(
    route`/rest/api/3/field`,
    { headers: { Accept: 'application/json' } },
  );
  if (!response.ok) {
    throw new JiraRequestError(`Jira field metadata request failed with status ${response.status}.`, response.status);
  }
  const fields = await response.json();
  if (!Array.isArray(fields)) throw new JiraRequestError('Jira returned invalid field metadata.', response.status);
  return fields;
}

export async function getFeatureConfig(as = 'user') {
  const config = await getConfig();
  const resolved = await getResolvedFieldMapping({ as });
  const mergedMap = {
    ...(config.fieldMap || {}),
    ...(resolved.mapping || {}),
  };

  return {
    ...config,
    fieldMap: mergedMap,
    missingFields: resolved.missing || [],
    missingRequired: resolved.missingRequired || [],
    hasRequiredFields: resolved.hasRequired,
  };
}

function customFieldIds(fieldMap) {
  return Object.values(fieldMap)
    .filter(value => typeof value === 'string' && /^customfield_\d+$/.test(value));
}

function linkedIssueKeys(issues) {
  const keys = new Set();
  for (const issue of issues) {
    for (const link of issue?.fields?.issuelinks || []) {
      for (const linked of [link?.inwardIssue, link?.outwardIssue]) {
        if (typeof linked?.key === 'string') keys.add(linked.key);
      }
    }
  }
  return [...keys];
}

export async function fetchLinkedCapas(issues, capaIssueType, as = 'user') {
  const keys = linkedIssueKeys(issues);
  const capaByKey = {};
  for (let index = 0; index < keys.length; index += 100) {
    const group = keys.slice(index, index + 100);
    const keyList = group.map(key => `"${escapeJql(key)}"`).join(', ');
    const linkedIssues = await searchAll(
      `key in (${keyList})`,
      CAPA_FIELDS,
      100,
      { as, max: group.length },
    );
    for (const linkedIssue of linkedIssues) {
      if (linkedIssue?.fields?.issuetype?.name?.toLowerCase() === capaIssueType.toLowerCase()) {
        capaByKey[linkedIssue.key] = linkedIssue;
      }
    }
  }
  return capaByKey;
}

import { getActiveProjectScope } from '../lib/projects.js';

export async function loadDeviationData(projectKey = null, options = {}) {
  const as = options.as === 'app' ? 'app' : 'user';
  let targetProject = projectKey;
  let activeScope = null;

  if (!targetProject || targetProject === 'CLIN') {
    activeScope = await getActiveProjectScope(as);
    if (activeScope.targetProjectKeys && activeScope.targetProjectKeys.length > 0) {
      targetProject = activeScope.isAllProjects ? activeScope.targetProjectKeys : activeScope.targetProjectKeys[0];
    } else {
      targetProject = 'ALL';
    }
  }

  const config = await getFeatureConfig(as);
  const fieldMap = config.fieldMap;
  const fields = [...new Set([...DEVIATION_FIELDS, ...customFieldIds(fieldMap)])];
  const query = options.days === null
    ? deviationsInProject(targetProject, config.deviationIssueType, options.filters || {}, fieldMap)
    : deviationsInWindow(
      targetProject,
      config.deviationIssueType,
      options.days ?? 90,
      options.filters || {},
      fieldMap,
    );
  const jql = `${query} ORDER BY created DESC`;
  const rawIssues = await searchAll(jql, fields, 100, { as, max: options.max || 5000 });
  const capaByKey = options.includeCapas === false
    ? {}
    : await fetchLinkedCapas(rawIssues, config.capaIssueType, as);
  const mapping = { ...fieldMap, capaLinkType: config.capaLinkType };
  const deviations = rawIssues.map(issue =>
    normalizeDeviation(issue, mapping, capaByKey, config)
  );
  return { config, fieldMap, rawIssues, capaByKey, deviations, projectScope: activeScope };
}

export async function loadIssueWithCapa(issueKey, as = 'user') {
  const config = await getFeatureConfig(as);
  const fieldMap = config.fieldMap;
  const fields = [...new Set([...DEVIATION_FIELDS, ...customFieldIds(fieldMap)])];
  const issue = await getIssue(issueKey, fields, { as });
  const capaByKey = await fetchLinkedCapas([issue], config.capaIssueType, as);
  return {
    config,
    fieldMap,
    issue,
    deviation: normalizeDeviation(
      issue,
      { ...fieldMap, capaLinkType: config.capaLinkType },
      capaByKey,
      config,
    ),
  };
}
