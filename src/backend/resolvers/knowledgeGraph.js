import { escapeJql, JiraRequestError, searchAll } from '../lib/jira.js';
import { getAmendmentTrainingAnswer, buildKnowledgeGraph, parseKnowledgeQuestion } from '../engine/knowledgeGraph.js';
import { loadDeviationData } from '../services/deviationData.js';
import { getCreateMeta } from './writes.js';

const PROJECT_KEY = 'CLIN';
const MAX_GRAPH_RECORDS = 500;
const TASK_FIELDS = [
  'key', 'summary', 'description', 'labels', 'status', 'duedate', 'assignee',
];

function taskSearchFields(siteFieldId) {
  return [...new Set([...TASK_FIELDS, ...(siteFieldId ? [siteFieldId] : [])])];
}

async function loadKnownSites() {
  try {
    const metadata = await getCreateMeta();
    return {
      sites: (metadata.options?.site || [])
        .map(option => String(option.value || option.label || '').trim())
        .filter(Boolean),
      warning: null,
    };
  } catch {
    return {
      sites: [],
      warning: 'The Jira Site field option list could not be loaded; sites without visible Jira records may be omitted.',
    };
  }
}

function failure(error) {
  if (error instanceof JiraRequestError) {
    return {
      ok: false,
      error: { code: 'JIRA_REQUEST_FAILED', message: error.message },
    };
  }
  return {
    ok: false,
    error: {
      code: 'KNOWLEDGE_GRAPH_FAILED',
      message: 'Could not load the Jira records needed for this query. Check your project access and try again.',
    },
  };
}

export async function queryKnowledgeGraph(question) {
  const parsed = parseKnowledgeQuestion(question);
  if (!parsed) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_QUERY',
        message: 'Supported query: which sites have not completed retraining for Amendment N?',
      },
    };
  }

  try {
    const deviationData = await loadDeviationData(PROJECT_KEY, {
      as: 'user',
      days: null,
      max: MAX_GRAPH_RECORDS,
      includeCapas: false,
    });
    const siteFieldId = deviationData.config.fieldMap.site;
    const jql = `project = ${PROJECT_KEY} AND labels = "${escapeJql('protocol-amendment')}"`;
    const [amendmentTasks, siteInfo] = await Promise.all([
      searchAll(jql, taskSearchFields(siteFieldId), 100, {
        as: 'user',
        max: MAX_GRAPH_RECORDS,
      }),
      loadKnownSites(),
    ]);

    const deviations = deviationData.rawIssues.map((raw, index) => ({
      raw,
      normalized: deviationData.deviations[index],
    }));
    const sites = new Set(siteInfo.sites);
    for (const deviation of deviationData.deviations) {
      if (deviation.site && deviation.site !== 'Unassigned') sites.add(deviation.site);
    }

    const answer = getAmendmentTrainingAnswer(
      question,
      amendmentTasks,
      siteFieldId,
      [...sites],
      deviations,
    );
    const graph = buildKnowledgeGraph({
      deviations,
      amendmentTasks,
      siteFieldId,
      knownSites: [...sites],
    });
    const warnings = [
      siteInfo.warning,
      amendmentTasks.length === MAX_GRAPH_RECORDS
        ? `Only the first ${MAX_GRAPH_RECORDS} amendment tasks were included.`
        : null,
      deviationData.rawIssues.length === MAX_GRAPH_RECORDS
        ? `Only the first ${MAX_GRAPH_RECORDS} deviations were included.`
        : null,
      answer.unassignedTaskCount
        ? `${answer.unassignedTaskCount} matching retraining task(s) had no resolvable site and were not attributed to a site.`
        : null,
    ].filter(Boolean);

    return {
      ok: true,
      data: {
        query: String(question).trim(),
        ...answer,
        graph,
        source: {
          projectKey: PROJECT_KEY,
          tasksScanned: amendmentTasks.length,
          deviationsScanned: deviationData.rawIssues.length,
          access: 'current-user',
        },
        warnings,
      },
    };
  } catch (error) {
    return failure(error);
  }
}
