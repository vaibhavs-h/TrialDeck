import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildKnowledgeGraph,
  getAmendmentTrainingAnswer,
  parseKnowledgeQuestion,
} from '../src/backend/engine/knowledgeGraph.js';

const question = "Which sites haven't completed Amendment 3 retraining?";

function amendmentTask(key, site, status, labels = ['protocol-amendment', 'amendment-42-v2-v3']) {
  return {
    key,
    fields: {
      summary: `[${site}] Retrain site staff on protocol changes - Protocol (v2 to v3)`,
      description: {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: `Protocol amendment task for ${site}: Protocol (v2 to v3). Needed because: Procedure changed.` }],
        }],
      },
      labels,
      status: {
        name: status,
        statusCategory: { key: status === 'Done' ? 'done' : 'indeterminate' },
      },
      assignee: { accountId: 'account-1', displayName: 'Study Coordinator' },
      duedate: '2026-12-01',
    },
  };
}

test('parses the supported natural-language Amendment retraining query', () => {
  assert.deepEqual(parseKnowledgeQuestion(question), {
    intent: 'incomplete-amendment-training',
    amendmentVersion: 3,
  });
  assert.deepEqual(
    parseKnowledgeQuestion('Which sites have not completed retraining for Amendment 3?'),
    { intent: 'incomplete-amendment-training', amendmentVersion: 3 },
  );
  assert.equal(parseKnowledgeQuestion('Show me all sites'), null);
});

test('reports tasks not marked Done and sites with no task as incomplete', () => {
  const tasks = [
    amendmentTask('CLIN-10', 'Site A', 'In Progress'),
    amendmentTask('CLIN-11', 'Site C', 'Done'),
  ];
  const result = getAmendmentTrainingAnswer(question, tasks, null, ['Site A', 'Site B', 'Site C']);

  assert.deepEqual(result.incompleteSites.map(item => [item.site, item.reason]), [
    ['Site A', 'NOT_MARKED_DONE'],
    ['Site B', 'NO_TASK_FOUND'],
  ]);
  assert.equal(result.matchingTaskCount, 2);
  assert.match(result.answer, /Site A, Site B/);
});

test('links protocols, deviations, sites, and people without returning subject identifiers', () => {
  const graph = buildKnowledgeGraph({
    knownSites: ['Site A'],
    deviations: [{
      raw: {
        key: 'CLIN-1',
        fields: {
          summary: 'Deviation for SUBJ-1234',
          assignee: { accountId: 'account-1', displayName: 'Study Coordinator' },
          reporter: { accountId: 'account-2', displayName: 'Clinical Monitor' },
        },
      },
      normalized: {
        site: 'Site A',
        protocolVersion: 'Protocol 3.1',
        status: 'Open',
        category: 'major',
      },
    }],
    amendmentTasks: [amendmentTask('CLIN-10', 'Site A', 'In Progress')],
  });

  const nodeTypes = new Set(graph.nodes.map(node => node.type));
  const edgeTypes = new Set(graph.edges.map(edge => edge.type));
  assert.deepEqual([...nodeTypes].sort(), ['amendment-task', 'deviation', 'person', 'protocol', 'site']);
  assert.ok(edgeTypes.has('RECORDED_AT'));
  assert.ok(edgeTypes.has('RECORDED_UNDER'));
  assert.ok(edgeTypes.has('REPORTED_BY'));
  assert.ok(edgeTypes.has('IMPLEMENTS_AMENDMENT'));
  assert.ok(!JSON.stringify(graph).includes('SUBJ-1234'));
});
