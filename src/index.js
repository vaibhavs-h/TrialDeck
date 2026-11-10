import Resolver from '@forge/resolver';
import { getDeviation, getRelatedDeviations, getSiteHistory } from './resolvers/deviations';
import { getDashboard } from './resolvers/dashboard';
import { diffAmendment } from './resolvers/amendments';

const resolver = new Resolver();

resolver.define('ping', () => ({ ok: true, message: 'Hello from the Clinical Trial Hub resolver' }));
resolver.define('getDeviation', ({ payload }) => getDeviation(payload.issueKey));
resolver.define('getSiteHistory', ({ payload }) => getSiteHistory(payload.site));
resolver.define('getRelatedDeviations', ({ payload }) =>
  getRelatedDeviations(payload.site, payload.issueKey),
);
resolver.define('getDashboard', () => getDashboard());
resolver.define('diffAmendment', ({ payload }) =>
  diffAmendment(payload.pageId, payload.fromVersion, payload.toVersion),
);

export const handler = resolver.getDefinitions();
