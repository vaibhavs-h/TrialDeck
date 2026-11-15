import Resolver from '@forge/resolver';
import {
  getDeviation,
  getRelatedDeviations,
  getSiteHistory,
  getDeviations,
  getSites,
  getCapas,
  getSiteTasks,
  getReports
} from './resolvers/deviations';
import { getDashboard } from './resolvers/dashboard';
import {
  getProtocolPages,
  getAmendmentVersions,
  analyzeAmendment,
  createAmendmentTasks
} from './resolvers/amendments';
import {
  getCreateMeta,
  getAssignableUsers,
  createDeviation,
  createCapaTask,
  createSiteTask,
  escalateCapa,
  updateReportStatus,
  transitionIssue,
  updateDeviation,
  getSettings,
  saveSettings
} from './resolvers/writes';

const resolver = new Resolver();

resolver.define('ping', () => ({ ok: true, message: 'Clinical Trial Hub Resolver Active' }));
resolver.define('getDeviation', ({ payload }) => getDeviation(payload.issueKey || payload.key));
resolver.define('getSiteHistory', ({ payload }) => getSiteHistory(payload.site));
resolver.define('getRelatedDeviations', ({ payload }) =>
  getRelatedDeviations(payload.site, payload.issueKey || payload.key),
);
resolver.define('getDashboard', () => getDashboard());
resolver.define('getDeviations', ({ payload }) => getDeviations(payload));
resolver.define('getSites', () => getSites());
resolver.define('getCapas', () => getCapas());
resolver.define('getSiteTasks', ({ payload }) => getSiteTasks(payload?.site));
resolver.define('getReports', () => getReports());

// Protocol amendment analysis (analyze is read-only; create writes to Jira and needs approval)
resolver.define('getProtocolPages', () => getProtocolPages());
resolver.define('getAmendmentVersions', ({ payload }) => getAmendmentVersions(payload));
resolver.define('analyzeAmendment', ({ payload }) => analyzeAmendment(payload));
resolver.define('createAmendmentTasks', ({ payload }) => createAmendmentTasks(payload));

// Write & Metadata Resolvers
resolver.define('getCreateMeta', () => getCreateMeta());
resolver.define('getAssignableUsers', ({ payload }) => getAssignableUsers(payload?.query));
resolver.define('createDeviation', ({ payload }) => createDeviation(payload));
resolver.define('createCapaTask', ({ payload }) => createCapaTask(payload));
resolver.define('createSiteTask', ({ payload }) => createSiteTask(payload));
resolver.define('escalateCapa', ({ payload }) => escalateCapa(payload));
resolver.define('updateReportStatus', ({ payload }) => updateReportStatus(payload));
resolver.define('transitionIssue', ({ payload }) => transitionIssue(payload));
resolver.define('updateDeviation', ({ payload }) => updateDeviation(payload));
resolver.define('getSettings', () => getSettings());
resolver.define('saveSettings', ({ payload }) => saveSettings(payload));

export const handler = resolver.getDefinitions();
