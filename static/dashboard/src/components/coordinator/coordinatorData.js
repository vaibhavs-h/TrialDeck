export const site = {
  title: 'Site 02 — Pune',
  institution: 'Tata Memorial Ext.',
  protocolBadge: 'PHASE III PROTOCOL • ONC-101',
  lockedSiteLabel: 'Site 02 - Memorial Oncology (Pune)',
  piName: 'Dr. V. Sen',
};

export const banner = {
  title: 'Amendment 3 Protocol Release:',
  message: 'Requires re-consent and retraining at your site. 3 tasks pending coordinator sign-off.',
};

export const kpis = {
  openAtSite: { value: 6, delta: '+1 this week', note: 'Across 4 subject cohorts' },
  major: { value: 1, note: 'GCP consent deviation' },
  overdueCapas: { value: 1, badge: 'CAPA-021 (9d)', note: 'Action plan overdue' },
};

// Weekly open count, W1..W12
export const weeklyOpen = [1, 1, 2, 2, 3, 3, 4, 4, 5, 4, 6, 6];
export const trendConfig = { target: 2, spikeWeek: 11 };

export const initialTasks = [
  { id: 'task1', title: 'Re-consent patients (14 subjects)', priority: 'High',
    detail: 'ICF v2.2 Amendment 3 re-documentation required',
    due: 'Oct 28, 2024', status: 'In Progress', ref: 'DEV-118', done: false },
  { id: 'task2', title: 'IRB approval upload', priority: 'Medium',
    detail: 'Attach local institutional ethics committee signed letter',
    due: 'Oct 24, 2024', status: 'Pending Review', ref: 'DEV-119', done: false },
  { id: 'task3', title: 'Staff retraining (5 staff members)', priority: 'Routine',
    detail: 'GCP dosing and administration SOP signoff log',
    due: 'Nov 02, 2024', status: 'Scheduled', ref: 'DEV-120', done: false },
];

export const initialDeviations = [
  { id: 'DEV-112', subject: 'SUBJ-0042', severity: 'MAJOR', category: 'Informed Consent', status: 'CAPA Overdue', statusTone: 'amber', age: '9d' },
  { id: 'DEV-099', subject: 'SUBJ-0094', severity: 'MAJOR', category: 'Missing Safety Lab', status: 'Under Review', statusTone: 'blue', age: '14d' },
  { id: 'DEV-084', subject: 'SUBJ-0021', severity: 'MINOR', category: 'Consent Addendum', status: 'Pending CRA', statusTone: 'grey', age: '22d' },
  { id: 'DEV-072', subject: 'SUBJ-0015', severity: 'MINOR', category: 'Window Exceeded', status: 'Investigating', statusTone: 'neutral', age: '31d' },
];

export const TOTAL_SITE_DEVIATIONS = 6; // 4 shown + 2 older ones