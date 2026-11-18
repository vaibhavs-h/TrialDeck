import assert from 'node:assert/strict';
import test from 'node:test';
import { detectPatterns } from '../src/backend/engine/detectPatterns.js';
import { SAMPLE_DEVIATIONS } from '../src/backend/services/sampleData.js';

test('detectPatterns runs across deviations to surface repeat site clusters and anomalies', () => {
  const rules = {
    siteCluster: { threshold: 3, windowDays: 30 },
    crossSiteRootCause: { threshold: 2, highAlertSites: 3, windowDays: 30 },
    siteOutlier: { meanMultiplier: 2, minimumSites: 3, minimumCount: 3, windowDays: 30 },
    majorSpike: { threshold: 2, windowDays: 14 },
    repeatAfterCapa: { windowDays: 90 },
  };

  const alerts = detectPatterns(SAMPLE_DEVIATIONS, rules);
  assert.ok(alerts.length >= 2, 'Should detect pattern clusters in sample deviations');

  const siteCluster = alerts.find(a => a.rule === 'SITE_CLUSTER');
  assert.ok(siteCluster, 'Should detect site cluster');
  assert.equal(siteCluster.dimensions?.site, 'Site 4');
});

test('detectPatterns returns empty array when given zero deviations', () => {
  const rules = {
    siteCluster: { threshold: 3, windowDays: 30 },
    crossSiteRootCause: { threshold: 2, highAlertSites: 3, windowDays: 30 },
    siteOutlier: { meanMultiplier: 2, minimumSites: 3, minimumCount: 3, windowDays: 30 },
    majorSpike: { threshold: 2, windowDays: 14 },
    repeatAfterCapa: { windowDays: 90 },
  };

  const alerts = detectPatterns([], rules);
  assert.deepEqual(alerts, []);
});
