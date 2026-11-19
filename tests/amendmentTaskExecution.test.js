import assert from 'node:assert/strict';
import test from 'node:test';
import { previewSiteTasks, createSiteTasks } from '../src/backend/agentAmendment.js';

test('amendment task execution suite', async (t) => {
  // Track created Jira issues
  let createdIssues = [];
  let existingJiraIssues = [];
  let userSites = ['Site A', 'Site B'];

  const originalForgeFetch = global.__forge_fetch__;

  function mockHeaders(obj = {}) {
    return {
      get: (headerName) => {
        const lower = headerName.toLowerCase();
        if (lower === 'forge-proxy-error') return null;
        if (lower === 'content-type') return 'application/json';
        return obj[lower] || null;
      },
    };
  }

  global.__forge_fetch__ = async (auth, path, init = {}) => {
    const url = String(path);

    // 1. Confluence endpoints
    if (url.includes('/versions')) {
      return {
        status: 200,
        ok: true,
        headers: mockHeaders(),
        json: async () => ({
          results: [
            { number: 2, createdAt: '2026-11-02' },
            { number: 1, createdAt: '2026-11-01' },
          ],
        }),
        text: async () => '',
      };
    }
    if (url.includes('version=1')) {
      return {
        status: 200,
        ok: true,
        headers: mockHeaders(),
        json: async () => ({
          id: '1001',
          title: 'Study Protocol',
          version: { number: 1 },
          body: {
            storage: {
              value: '<h2>Protocol</h2><p>Initial study design without specific dosing rules.</p>',
            },
          },
          _links: { base: 'https://test.atlassian.net/wiki', webui: '/pages/1001' },
        }),
        text: async () => '',
      };
    }
    if (url.includes('version=2')) {
      return {
        status: 200,
        ok: true,
        headers: mockHeaders(),
        json: async () => ({
          id: '1001',
          title: 'Study Protocol',
          version: { number: 2 },
          body: {
            storage: {
              value: '<h2>Protocol</h2><p>Ethics committee and IRB approved revised dosing and consent guidelines.</p>',
            },
          },
          _links: { base: 'https://test.atlassian.net/wiki', webui: '/pages/1001' },
        }),
        text: async () => '',
      };
    }
    if (url.includes('/wiki/api/v2/pages/1001')) {
      return {
        status: 200,
        ok: true,
        headers: mockHeaders(),
        json: async () => ({
          id: '1001',
          title: 'Study Protocol',
          version: { number: 2 },
          _links: { base: 'https://test.atlassian.net/wiki', webui: '/pages/1001' },
        }),
        text: async () => '',
      };
    }
    if (url.includes('/wiki/api/v2/pages') && url.includes('limit=')) {
      return {
        status: 200,
        ok: true,
        headers: mockHeaders(),
        json: async () => ({
          results: [{ id: '1001', title: 'Study Protocol', version: { number: 2 } }],
        }),
        text: async () => '',
      };
    }

    // 2. Jira endpoints
    if (url.includes('/rest/api/3/myself')) {
      return {
        status: 200,
        ok: true,
        headers: mockHeaders(),
        json: async () => ({ displayName: 'Lead Monitor' }),
        text: async () => JSON.stringify({ displayName: 'Lead Monitor' }),
      };
    }
    if (url.includes('/rest/api/3/project/search')) {
      return {
        status: 200,
        ok: true,
        headers: mockHeaders(),
        json: async () => ({
          values: [
            {
              id: '10000',
              key: 'CLIN',
              name: 'Clinical Trial Hub',
              issueTypes: [
                { id: '10001', name: 'Protocol Deviation', subtask: false },
                { id: '10002', name: 'Task', subtask: false },
              ],
            },
          ],
        }),
        text: async () => '',
      };
    }
    if (url.includes('/rest/api/3/project/CLIN')) {
      return {
        status: 200,
        ok: true,
        headers: mockHeaders(),
        json: async () => ({
          id: '10000',
          key: 'CLIN',
          name: 'Clinical Trial Hub',
          issueTypes: [
            { id: '10001', name: 'Protocol Deviation', subtask: false },
            { id: '10002', name: 'Task', subtask: false },
          ],
        }),
        text: async () => '',
      };
    }
    if (url.includes('/rest/api/3/field')) {
      return {
        status: 200,
        ok: true,
        headers: mockHeaders(),
        json: async () => [
          { id: 'customfield_10010', name: 'Site', schema: { custom: 'com.atlassian.jira.plugin.system.customfieldtypes:select' } },
          { id: 'customfield_10011', name: 'Category', schema: { custom: 'com.atlassian.jira.plugin.system.customfieldtypes:select' } },
        ],
        text: async () => '',
      };
    }
    if (url.includes('/createmeta/10000/issuetypes/10001')) {
      return {
        status: 200,
        ok: true,
        headers: mockHeaders(),
        json: async () => ({
          total: 1,
          isLast: true,
          values: [
            {
              fieldId: 'customfield_10010',
              name: 'Site',
              allowedValues: userSites.map((s, idx) => ({ id: `opt-${idx}`, value: s })),
            },
          ],
        }),
        text: async () => '',
      };
    }
    if (url.includes('/rest/api/3/search')) {
      return {
        status: 200,
        ok: true,
        headers: mockHeaders(),
        json: async () => ({
          total: existingJiraIssues.length,
          issues: existingJiraIssues,
        }),
        text: async () => '',
      };
    }
    if (url.includes('/rest/api/3/issue') && init.method === 'POST') {
      const body = JSON.parse(init.body || '{}');
      const key = `CLIN-${createdIssues.length + 100}`;
      createdIssues.push({ key, fields: body.fields });
      return {
        status: 201,
        ok: true,
        headers: mockHeaders(),
        json: async () => ({ id: '20000', key }),
        text: async () => JSON.stringify({ id: '20000', key }),
      };
    }

    return {
      status: 200,
      ok: true,
      headers: mockHeaders(),
      json: async () => ({}),
      text: async () => '{}',
    };
  };

  t.after(() => {
    global.__forge_fetch__ = originalForgeFetch;
  });

  await t.test('previewSiteTasks returns parsed tasks without writing to Jira', async () => {
    createdIssues = [];
    existingJiraIssues = [];
    userSites = ['Site A', 'Site B'];

    const preview = await previewSiteTasks({
      pageId: '1001',
      fromVersion: 1,
      toVersion: 2,
      effectiveDate: '2026-12-01',
    });

    assert.ok(!preview.error, `Preview error: ${preview.error}`);
    assert.ok(preview.count > 0, `Expected count > 0, got ${preview.count}`);
    assert.equal(preview.siteCount, 2);
    assert.equal(createdIssues.length, 0, 'Preview must NOT write to Jira');
  });

  await t.test('createSiteTasks creates tasks and respects duplicate protection', async () => {
    createdIssues = [];
    existingJiraIssues = [];
    userSites = ['Site A', 'Site B'];

    // First run creates tasks
    const res1 = await createSiteTasks({
      pageId: '1001',
      fromVersion: 1,
      toVersion: 2,
      effectiveDate: '2026-12-01',
    });

    assert.ok(!res1.error, `Create error: ${res1.error}`);
    assert.ok(res1.createdCount > 0, `Expected createdCount > 0, got ${res1.createdCount}`);
    assert.equal(res1.skippedCount, 0);

    // Now populate existing issues with the created summaries
    existingJiraIssues = createdIssues.map(c => ({
      key: c.key,
      fields: { summary: c.fields.summary },
    }));

    // Second run should recognize duplicates and skip them
    const res2 = await createSiteTasks({
      pageId: '1001',
      fromVersion: 1,
      toVersion: 2,
      effectiveDate: '2026-12-01',
    });

    assert.ok(!res2.error);
    assert.equal(res2.createdCount, 0);
    assert.ok(res2.skippedCount > 0, 'Duplicate tasks must be skipped');
  });

  await t.test('createSiteTasks respects chunking and reports remaining count', async () => {
    createdIssues = [];
    existingJiraIssues = [];
    userSites = ['Site 1', 'Site 2', 'Site 3', 'Site 4'];

    const res = await createSiteTasks({
      pageId: '1001',
      fromVersion: 1,
      toVersion: 2,
      effectiveDate: '2026-12-01',
    });

    assert.ok(!res.error);
    assert.ok(res.createdCount > 0);
    assert.equal(typeof res.remaining, 'number');
  });
});
