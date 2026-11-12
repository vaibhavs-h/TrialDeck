export const kpis = {
  openDeviations: { value: 24, weekDelta: '+2 this week', threshold: '≤ 15', label: 'Elevated' },
  majorDeviations: { value: 5, share: '20.8% of total' },
  overdueCapas: { value: 3, longestBreachDays: 9 },
  repeatSites: { value: 2, sites: 'Site 02, Site 04', activeSites: 18 },
};

export const insight = {
  site: 'Site 02 (Memorial Oncology)',
  message:
    'has logged 5 consent-form deviations in the last 30 days. Automated audit flags indicate a training re-qualification is required.',
};

// total / major per site. flagged = exceeds GCP threshold (>5)
export const deviationsBySite = [
  { id: 'Site 01', name: 'St. Jude', total: 4, major: 1 },
  { id: 'Site 02', name: 'Memorial', total: 11, major: 3, flagged: true },
  { id: 'Site 03', name: 'Johns Hop.', total: 3, major: 0 },
  { id: 'Site 04', name: 'MD And.', total: 6, major: 1 },
  { id: 'Site 05', name: 'Mayo Clinic', total: 2, major: 0 },
];

export const weeklyTrend = [2, 3, 1, 4, 2, 3, 5, 4, 6, 5, 7, 4]; // W1..W12

export const trendSummary = {
  average: '3.4 / wk',
  movingAvg: '5.3 items/wk',
  stability: 'Trending Downward',
};

export const needsAttention = [
  { id: 'DEV-112', subject: 'SUBJ-0042 dosage', site: 'Site 02 - Memorial Oncology', pi: 'Dr. C. Henderson',
    severity: 'Major', category: 'Informed Consent', status: 'CAPA Overdue', statusTone: 'red',
    dueLabel: 'Overdue by 3d', dueNote: 'Target: Oct 18, 2024', dueTone: 'overdue',
    owner: 'Priya Sharma', initials: 'PS', avatar: '#0052CC', age: '9 days' },
  { id: 'DEV-108', subject: 'SUBJ-0089 window', site: 'Site 04 - MD Anderson', pi: 'Dr. F. Thorne',
    severity: 'Major', category: 'Visit Window Exceeded', status: 'Under Review', statusTone: 'yellow',
    dueLabel: 'Tomorrow', dueNote: 'Target: Oct 22, 2024', dueTone: 'soon',
    owner: 'Marcus Vance', initials: 'MV', avatar: '#00875A', age: '14 days' },
  { id: 'DEV-104', subject: 'SUBJ-0012 storage', site: 'Site 01 - St. Jude Medical', pi: 'Dr. A. Morales',
    severity: 'Minor', category: 'Temp Excursion <2h', status: 'Investigating', statusTone: 'blue',
    dueLabel: 'Oct 24, 2024', dueNote: 'Target: +3 days', dueTone: 'normal',
    owner: 'Elena Rostova', initials: 'ER', avatar: '#6554C0', age: '4 days' },
  { id: 'DEV-099', subject: 'SUBJ-0094 labs', site: 'Site 02 - Memorial Oncology', pi: 'Dr. C. Henderson',
    severity: 'Major', category: 'Missing Safety Lab', status: 'CAPA Overdue', statusTone: 'red',
    dueLabel: 'Overdue by 9d', dueNote: 'Target: Oct 12, 2024', dueTone: 'overdue',
    owner: 'David Kim', initials: 'DK', avatar: '#FF5630', age: '22 days' },
  { id: 'DEV-095', subject: 'SUBJ-0051 eCRF', site: 'Site 03 - Johns Hopkins', pi: 'Dr. S. Patel',
    severity: 'Minor', category: 'Late Entry (>5 days)', status: 'Pending Sign-off', statusTone: 'grey',
    dueLabel: 'Oct 28, 2024', dueNote: 'Target: +7 days', dueTone: 'normal',
    owner: 'Sarah Jenkins', initials: 'SJ', avatar: '#36B37E', age: '2 days' },
  { id: 'DEV-091', subject: 'SUBJ-0028 kit', site: 'Site 05 - Mayo Clinic', pi: 'Dr. G. Lawson',
    severity: 'Resolved', category: 'Dispensation Reconciled', status: 'Action Plan Drafted', statusTone: 'green',
    dueLabel: 'Closed (Oct 16)', dueNote: 'Audit QA Signed', dueTone: 'closed',
    owner: 'Tariq Al-Mansoor', initials: 'TA', avatar: '#403294', age: '31 days' },
];