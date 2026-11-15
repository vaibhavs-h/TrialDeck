import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deviationsInWindow,
  overdueCapas,
  ValidationError,
} from '../src/backend/lib/jql.js';
import { detectPatterns } from '../src/backend/engine/detectPatterns.js';
import { isCapaOverdue, normalizeDeviation } from '../src/backend/lib/mapper.js';

const rules = {
  siteCluster: { threshold: 3, windowDays: 30 },
  crossSiteRootCause: { threshold: 2, highAlertSites: 3, windowDays: 30 },
  siteOutlier: { meanMultiplier: 2, minimumSites: 3, minimumCount: 3, windowDays: 30 },
  majorSpike: { threshold: 2, windowDays: 14 },
  repeatAfterCapa: { windowDays: 90 },
};

function deviation(key, options = {}) {
  return {
    key,
    site: options.site || 'Site A',
    category: options.category || 'minor',
    rootCause: options.rootCause || 'Training',
    created: options.created || new Date().toISOString(),
    capa: options.capa || null,
  };
}

test('JQL builders escape field values and use stored custom field mappings', () => {
  const jql = deviationsInWindow(
    'CLIN',
    'Protocol "Deviation"\\Type',
    30,
    { site: 'Site "A"\\B' },
    { site: 'customfield_12345' },
  );
  assert.equal(
    jql,
    'project = CLIN AND issuetype = "Protocol \\"Deviation\\"\\\\Type" AND created >= -30d AND cf[12345] = "Site \\"A\\"\\\\B"',
  );
});

test('JQL builder rejects malformed project keys with ValidationError', () => {
  assert.throws(() => overdueCapas('bad-key', 'CAPA'), ValidationError);
});

test('overdue CAPA JQL excludes done status and uses the CAPA issue type', () => {
  assert.equal(
    overdueCapas('CLIN', 'CAPA'),
    'project = CLIN AND issuetype = "CAPA" AND duedate < now() AND statusCategory != Done',
  );
});

test('CAPA is overdue only before today while not done', () => {
  assert.equal(isCapaOverdue('2025-01-09', 'In Progress', '2025-01-10'), true);
  assert.equal(isCapaOverdue('2025-01-10', 'In Progress', '2025-01-10'), false);
  assert.equal(isCapaOverdue('2025-01-09', 'done', '2025-01-10'), false);
  assert.equal(isCapaOverdue(null, 'In Progress', '2025-01-10'), false);
});

test('normalization handles select and text fields without inventing a missing subject ID', () => {
  const mapping = {
    site: 'customfield_1',
    category: 'customfield_2',
    subjectId: 'customfield_3',
    protocolVersion: 'customfield_4',
    rootCause: 'customfield_5',
  };
  const issue = {
    key: 'CLIN-1',
    fields: {
      summary: 'Deviation',
      status: { name: 'Open', statusCategory: { key: 'new' } },
      created: '2025-01-01T00:00:00.000Z',
      customfield_1: { value: 'Site 12' },
      customfield_2: { value: 'Major' },
      customfield_4: 'Protocol 3.1',
      customfield_5: { value: 'Other', child: { value: 'Equipment' } },
    },
  };
  const normalized = normalizeDeviation(issue, mapping);
  assert.equal(normalized.site, 'Site 12');
  assert.equal(normalized.category, 'major');
  assert.equal(normalized.protocolVersion, 'Protocol 3.1');
  assert.equal(normalized.rootCause, 'Other / Equipment');
  assert.equal(normalized.subjectId, null);
  assert.equal(normalized.subjectIdPresent, false);

  const nonPseudonym = normalizeDeviation({
    ...issue,
    fields: { ...issue.fields, customfield_3: 'Patient Name' },
  }, mapping);
  assert.equal(nonPseudonym.subjectId, null);
  assert.equal(nonPseudonym.subjectIdPresent, false);
});

test('detectPatterns covers site clusters, cross-site causes, spikes, outliers, and post-CAPA repeats', () => {
  const now = Date.now();
  const recent = days => new Date(now - days * 86_400_000).toISOString();
  const issues = [
    deviation('CLIN-1', { site: 'Cluster', created: recent(2) }),
    deviation('CLIN-2', { site: 'Cluster', created: recent(3) }),
    deviation('CLIN-3', { site: 'Cluster', created: recent(4) }),
    deviation('CLIN-4', { site: 'Cause A', rootCause: 'Equipment', created: recent(1) }),
    deviation('CLIN-5', { site: 'Cause B', rootCause: 'Equipment', created: recent(2) }),
    deviation('CLIN-6', { site: 'Cause C', rootCause: 'Equipment', created: recent(3) }),
    deviation('CLIN-7', { site: 'Spike', category: 'major', created: recent(1) }),
    deviation('CLIN-8', { site: 'Spike', category: 'major', created: recent(2) }),
    ...Array.from({ length: 6 }, (_, index) =>
      deviation(`CLIN-${10 + index}`, { site: 'Outlier', created: recent(5) })
    ),
    deviation('CLIN-30', {
      site: 'Repeat',
      rootCause: 'Documentation',
      created: recent(30),
      capa: { key: 'CLIN-40', resolvedAt: recent(10) },
    }),
    deviation('CLIN-31', {
      site: 'Repeat',
      rootCause: 'Documentation',
      created: recent(9),
    }),
  ];

  const alerts = detectPatterns(issues, rules, now);
  const ruleNames = new Set(alerts.map(item => item.rule));
  assert.deepEqual(
    [...ruleNames].sort(),
    ['CROSS_SITE_ROOT_CAUSE', 'MAJOR_SPIKE', 'REPEAT_AFTER_CAPA', 'SITE_CLUSTER', 'SITE_OUTLIER'].sort(),
  );
  assert.equal(
    alerts.find(item => item.rule === 'CROSS_SITE_ROOT_CAUSE').severity,
    'High',
  );
});
