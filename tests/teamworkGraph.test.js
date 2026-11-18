import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchTeamworkGraphContext } from '../src/backend/services/teamworkGraph.js';

test('fetchTeamworkGraphContext returns null gracefully without throwing when unauthenticated or graph is not mock-intercepted', async () => {
  const result = await fetchTeamworkGraphContext('TEST-101');
  assert.equal(result, null);
});

test('fetchTeamworkGraphContext handles invalid or empty issue keys safely', async () => {
  assert.equal(await fetchTeamworkGraphContext(null), null);
  assert.equal(await fetchTeamworkGraphContext(''), null);
});
