export const deviation = {
  id: 'DEV-112',
  type: 'Protocol Deviation',
  title: '[ONC-101] Informed consent version mismatch - dosage escalation cohort 2',
  status: 'IN PROGRESS',
  priority: 'P1 - High',
  resolution: 'Unresolved',
  subject: 'SUBJ-0042',
  consentUsed: 'v1.8',
  consentRequired: 'v2.1',
  amendmentDate: 'October 01, 2024',
  therapeuticArea: 'Solid Tumor Oncology',
  siteName: 'Memorial Cancer Center (02)',
  gcpRef: 'ICH-E6(R2)-4.8',
  watchers: 3,
  assignee: { name: 'Jane Doe', initials: 'JD' },
  reporter: 'Dr. Elena Lindqvist',
  product: 'ONC-101 Monotherapy',
};

export const comments = [
  { initials: 'EL', avatar: 'bg-secondary text-on-secondary', name: 'Dr. Elena Lindqvist', role: 'Clinical Research Associate',
    time: '2 hours ago',
    text: 'Confirmed re-consent visit scheduled for tomorrow morning 08:30 AM with participant SUBJ-0042. CRC has pre-printed informed consent form v2.1 with redline addendum.' },
  { initials: 'MK', avatar: 'bg-primary-container text-on-primary', name: 'Marcus Keller', role: 'Lead Data Manager',
    time: 'Yesterday at 16:42',
    text: 'CAPA-021 has been flagged for expedited safety review. Audit trail locked pending submission receipt.' },
];

export const glance = {
  severity: 'MAJOR',
  category: 'DEV-CATEGORY: PROTOCOL-DEV',
  protocolSite: 'Protocol v2.1 | Site 02',
  similarCount: 4,
  similar: [
    { id: 'DEV-099', title: 'Missing Safety Lab', tag: 'RESOLVED', tone: 'resolved', date: 'Oct 12, 2024', cohort: 'Cohort 2' },
    { id: 'DEV-084', title: 'Consent addendum unrecorded', tag: 'MAJOR', tone: 'major', date: 'Sep 28, 2024', cohort: 'Cohort 1' },
  ],
  capa: { id: 'CAPA-021', owner: 'Safety Committee', badge: 'OVERDUE 9 DAYS' },
  reportStatus: 'Not started',
};

export const siteHealth = {
  title: 'Site 02 Health Metrics',
  score: 91.4,
  openQueries: 7,
  lastVisit: '3d ago',
};