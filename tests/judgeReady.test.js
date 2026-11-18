import assert from 'node:assert/strict';
import test from 'node:test';
import {
  STANDARD_FIELD_ALIASES,
  matchCustomField,
  normalizeFieldName,
} from '../src/backend/lib/fields.js';
import {
  deviationsInWindow,
  deviationsInProject,
} from '../src/backend/lib/jql.js';
import { textToAdf } from '../src/backend/agent.js';
import { getSampleDashboardData, SAMPLE_DEVIATIONS } from '../src/backend/services/sampleData.js';

test('normalizeFieldName handles case, trim, whitespace collapse and punctuation', () => {
  assert.equal(normalizeFieldName('Site'), 'site');
  assert.equal(normalizeFieldName('  site  '), 'site');
  assert.equal(normalizeFieldName('Date Detected'), 'date detected');
  assert.equal(normalizeFieldName('date_detected'), 'date detected');
  assert.equal(normalizeFieldName('Root-Cause'), 'root cause');
  assert.equal(normalizeFieldName('Subject ID'), 'subject id');
});

test('matchCustomField accurately finds fields by alias across various casing styles', () => {
  const fields = [
    { id: 'customfield_1001', name: 'site' },
    { id: 'customfield_1002', name: 'Category' },
    { id: 'customfield_1003', name: 'Root cause' },
    { id: 'customfield_1004', name: 'Subject ID' },
    { id: 'customfield_1005', name: 'date detected' },
    { id: 'customfield_1006', name: 'Report status' },
    { id: 'customfield_1007', name: 'Protocol version' },
  ];

  assert.equal(matchCustomField(fields, STANDARD_FIELD_ALIASES.site), 'customfield_1001');
  assert.equal(matchCustomField(fields, STANDARD_FIELD_ALIASES.category), 'customfield_1002');
  assert.equal(matchCustomField(fields, STANDARD_FIELD_ALIASES.rootCause), 'customfield_1003');
  assert.equal(matchCustomField(fields, STANDARD_FIELD_ALIASES.subjectId), 'customfield_1004');
  assert.equal(matchCustomField(fields, STANDARD_FIELD_ALIASES.dateDetected), 'customfield_1005');
  assert.equal(matchCustomField(fields, STANDARD_FIELD_ALIASES.reportStatus), 'customfield_1006');
  assert.equal(matchCustomField(fields, STANDARD_FIELD_ALIASES.protocolVersion), 'customfield_1007');
});

test('matchCustomField gracefully returns null for missing fields without throwing', () => {
  const fields = [
    { id: 'customfield_1001', name: 'Summary' },
  ];
  assert.equal(matchCustomField(fields, STANDARD_FIELD_ALIASES.site), null);
  assert.equal(matchCustomField(fields, STANDARD_FIELD_ALIASES.reportStatus), null);
});

test('JQL queries support dynamic project keys, arrays of keys, and ALL', () => {
  const single = deviationsInProject('DEMO', 'Protocol Deviation');
  assert.equal(single, 'project = DEMO AND issuetype = "Protocol Deviation"');

  const multi = deviationsInProject(['DEMO', 'TRIAL'], 'Protocol Deviation');
  assert.equal(multi, 'project in (DEMO, TRIAL) AND issuetype = "Protocol Deviation"');

  const all = deviationsInProject('ALL', 'Protocol Deviation');
  assert.equal(all, 'project is not null AND issuetype = "Protocol Deviation"');
});

test('Sample data contains realistic clinical trial records and pattern clusters', () => {
  const sample = getSampleDashboardData();
  assert.equal(sample.isSampleData, true);
  assert.equal(sample.kpis.totalCount, 12);
  assert.equal(sample.kpis.open, 11);
  assert.equal(sample.kpis.overdueCapas, 2);
  assert.ok(sample.insight && sample.insight.site.includes('Site 4'));
  assert.ok(sample.alerts.length >= 2);

  // Validate repeat visit window deviations at Site 4
  const site4Deviations = SAMPLE_DEVIATIONS.filter(d => d.site === 'Site 4');
  assert.ok(site4Deviations.length >= 3);
  const trainingSite4 = site4Deviations.filter(d => d.rootCause === 'Training');
  assert.ok(trainingSite4.length >= 2);
});

test('textToAdf accurately converts markdown headings, bold text, and bullet lists', () => {
  const markdown = `# Clinical Deviation Report
**Summary:** Late visit window.
* Issue Key: CLIN-101
* Root Cause: Scheduling conflict`;

  const adf = textToAdf(markdown);
  assert.equal(adf.type, 'doc');
  assert.equal(adf.version, 1);
  assert.equal(adf.content[0].type, 'heading');
  assert.equal(adf.content[0].attrs.level, 3);
  assert.equal(adf.content[0].content[0].text, 'Clinical Deviation Report');

  assert.equal(adf.content[1].type, 'paragraph');
  assert.equal(adf.content[1].content[0].marks[0].type, 'strong');
  assert.equal(adf.content[1].content[0].text, 'Summary:');

  assert.equal(adf.content[2].type, 'bulletList');
  assert.equal(adf.content[2].content.length, 2);
  assert.equal(adf.content[2].content[0].type, 'listItem');
});
