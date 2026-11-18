import assert from 'node:assert/strict';
import test from 'node:test';
import {
  htmlToBlocks,
  analyzeBlocks,
  buildPlan,
} from '../src/backend/lib/amendmentAnalysis.js';

test('htmlToBlocks converts storage XHTML and preserves section headings', () => {
  const html = `
    <h2>Inclusion Criteria</h2>
    <p>Patients aged 18 to 65 with confirmed diagnosis.</p>
    <h2>Schedule of Activities</h2>
    <p>Visit 2 window changed to within 3 days.</p>
  `;
  const blocks = htmlToBlocks(html);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].section, 'Inclusion Criteria');
  assert.ok(blocks[0].text.includes('Patients aged 18 to 65'));
  assert.equal(blocks[1].section, 'Schedule of Activities');
  assert.ok(blocks[1].text.includes('Visit 2 window'));
});

test('analyzeBlocks groups diffs into classified clinical change categories', () => {
  const v1 = [
    { section: 'Inclusion Criteria', text: 'Patients aged 18 to 65 with confirmed diagnosis.' },
    { section: 'Schedule of Activities', text: 'Visit 2 window is within 7 days.' },
  ];
  const v2 = [
    { section: 'Inclusion Criteria', text: 'Patients aged 18 to 75 with confirmed diagnosis.' },
    { section: 'Schedule of Activities', text: 'Visit 2 window is within 3 days.' },
  ];

  const changes = analyzeBlocks(v1, v2);
  assert.ok(changes.length >= 2);
  const criteriaChange = changes.find(c => c.area === 'Criteria');
  const procedureChange = changes.find(c => c.area === 'Procedures');

  assert.ok(criteriaChange, 'Criteria change should be identified');
  assert.ok(procedureChange, 'Procedure change should be identified');
  assert.equal(criteriaChange.section, 'Inclusion Criteria');
  assert.ok(criteriaChange.after.includes('18 to 75'));
});

test('buildPlan produces per-site rollout tasks with deduplicated task types', () => {
  const v1 = [{ section: 'Protocol', text: 'Initial study design without specific dosing rules.' }];
  const v2 = [{ section: 'Protocol', text: 'Ethics committee and IRB approved revised dosing and consent guidelines.' }];
  const changes = analyzeBlocks(v1, v2);
  assert.ok(changes.length > 0);

  const sites = [
    { id: '1001', name: 'Site 1' },
    { id: '1002', name: 'Site 2' },
  ];

  const plan = buildPlan(changes, sites, {
    label: 'Protocol v2.1',
    dueDate: '2026-12-15',
  });

  assert.equal(plan.sites.length, 2);
  assert.ok(plan.taskCount > 0);
  const site1 = plan.sites.find(s => s.site === 'Site 1');
  assert.ok(site1 && site1.tasks.length > 0);
});
