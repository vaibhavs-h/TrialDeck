// Mock data for the Amendment Execution Hub and the "Create tasks" confirmation (synthetic).
// Replace with resolver data once task generation is wired.

export const hub = {
  protocolId: 'PH3-ONC-702',
  title: 'Amendment 04 Execution Hub',
  status: 'Pending Sync',
  tableTitle: 'Amendment Protocol Implementation Workstreams',
  version: 'AMEND-v4.1.9',
  jiraProject: 'DEV (Clinical Operations)',
  issueType: 'Sub-task / Operational Task',
};

export const kpis = [
  { label: 'Target Sites', value: '05 / 12', sub: 'Sites pending re-authorization', icon: 'domain' },
  { label: 'Identified Workload', value: '12 Tasks', sub: 'Auto-generated via GCP-Audit', icon: 'task' },
  { label: 'Affected Cohort', value: '38 Subjects', sub: 'Active dosage escalation wing', icon: 'group' },
  { label: 'IRB Approval Delta', value: '94.2%', sub: 'Expedited review threshold', icon: 'fact_check' },
];

// irbTone: success | info (see TONES in Pill.jsx)
export const workstreams = [
  { site: 'Site 01 - St. Jude Medical Center', pi: 'Dr. Helena Vance', planned: '2 actions pending creation', load: '8 active patients', irb: 'Approved', irbTone: 'success' },
  { site: 'Site 02 - Memorial Health Sciences', pi: 'Dr. Rajiv Patel', planned: '3 actions pending creation', load: '14 active patients', irb: 'Reviewed', irbTone: 'info' },
  { site: 'Site 03 - Johns Hopkins Research Institute', pi: 'Dr. Sarah Sterling', planned: '1 action pending creation', load: '6 active patients', irb: 'Approved', irbTone: 'success' },
];

export const plannedTasks = [
  { site: 'Site 01 (St. Jude)', scope: 'Re-consent 8 subjects, CRA Retraining', count: 2 },
  { site: 'Site 02 (Memorial)', scope: 'Re-consent 14 subjects, Staff Retraining, eCRF revision', count: 3 },
  { site: 'Site 03 (Johns Hopkins)', scope: 'Re-consent 6 subjects', count: 1 },
  { site: 'Site 04 (MD Anderson)', scope: 'Re-consent 10 subjects, IRB submission, Staff Retraining, eCRF update', count: 4 },
  { site: 'Site 05 (Mayo Clinic)', scope: 'Monitoring check, Protocol filing', count: 2 },
];
