import assert from 'node:assert/strict';
import test from 'node:test';

// Import the REAL backend entry points and modules without mocks
import * as indexModule from '../src/backend/index.js';
import * as agentModule from '../src/backend/agent.js';
import * as agentAmendmentModule from '../src/backend/agentAmendment.js';
import * as agentInsightsModule from '../src/backend/agentInsights.js';
import * as amendmentsResolvers from '../src/backend/resolvers/amendments.js';
import * as deviationsResolvers from '../src/backend/resolvers/deviations.js';
import * as dashboardResolvers from '../src/backend/resolvers/dashboard.js';
import * as writesResolvers from '../src/backend/resolvers/writes.js';

test('src/backend/index.js exports expected handler', () => {
  assert.equal(typeof indexModule.handler, 'function');
});

test('src/backend/agent.js exports all action handlers', () => {
  assert.equal(typeof agentModule.getDeviation, 'function');
  assert.equal(typeof agentModule.saveReportDraft, 'function');
  assert.equal(typeof agentModule.findSimilarDeviations, 'function');
  assert.equal(typeof agentModule.textToAdf, 'function');
});

test('src/backend/agentAmendment.js exports all amendment action handlers and imports real dependencies', () => {
  assert.equal(typeof agentAmendmentModule.listProtocolPages, 'function');
  assert.equal(typeof agentAmendmentModule.analyzeAmendmentAction, 'function');
  assert.equal(typeof agentAmendmentModule.previewSiteTasks, 'function');
  assert.equal(typeof agentAmendmentModule.createSiteTasks, 'function');
});

test('src/backend/agentInsights.js exports all insight action handlers', () => {
  assert.equal(typeof agentInsightsModule.listDeviations, 'function');
  assert.equal(typeof agentInsightsModule.findCrossSiteSignals, 'function');
  assert.equal(typeof agentInsightsModule.traceDeviation, 'function');
  assert.equal(typeof agentInsightsModule.siteAmendmentStatus, 'function');
});

test('src/backend/resolvers/amendments.js exports expected functions', () => {
  assert.equal(typeof amendmentsResolvers.getProtocolPages, 'function');
  assert.equal(typeof amendmentsResolvers.getAmendmentVersions, 'function');
  assert.equal(typeof amendmentsResolvers.analyzeAmendment, 'function');
  assert.equal(typeof amendmentsResolvers.createAmendmentTasks, 'function');
});

test('src/backend/resolvers/deviations.js exports expected functions including getSites', () => {
  assert.equal(typeof deviationsResolvers.getSites, 'function');
  assert.equal(typeof deviationsResolvers.getDeviations, 'function');
  assert.equal(typeof deviationsResolvers.getDeviation, 'function');
  assert.equal(typeof deviationsResolvers.getRelatedDeviations, 'function');
  assert.equal(typeof deviationsResolvers.getCapas, 'function');
});

test('src/backend/resolvers/writes.js exports expected functions', () => {
  assert.equal(typeof writesResolvers.getCreateMeta, 'function');
  assert.equal(typeof writesResolvers.createDeviation, 'function');
  assert.equal(typeof writesResolvers.createCapaTask, 'function');
  assert.equal(typeof writesResolvers.createSiteTask, 'function');
  assert.equal(typeof writesResolvers.updateReportStatus, 'function');
  assert.equal(typeof writesResolvers.saveSettings, 'function');
  assert.equal(typeof writesResolvers.getSettings, 'function');
});
