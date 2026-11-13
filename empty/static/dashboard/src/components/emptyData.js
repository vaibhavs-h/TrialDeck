// Static copy for the zero-state Deviations dashboard (synthetic).
export const filters = { protocol: 'ONC-101 (Solid Tumors)', timeframe: 'Last 90 days', cohort: 'Cohort Active: B-2' };

export const kpis = [
  { label: 'Open Deviations', value: '0', note: 'Pristine Protocol', sub: 'No active non-conformances', icon: 'verified', subIcon: 'check_circle' },
  { label: 'Major Deviations', value: '0', note: 'Zero Critical', sub: 'GCP safety thresholds clear', icon: 'warning_amber', subIcon: 'safety_check' },
  { label: 'Overdue CAPAs', value: '0', note: 'On Schedule', sub: '100% resolution velocity', icon: 'task_alt', subIcon: 'schedule' },
  { label: 'Sites w/ Repeat Issues', value: '0', note: 'Across 14 Sites', sub: 'No recurrent root causes', icon: 'domain', subIcon: 'insights' },
];

export const readouts = [
  { label: 'Consent Compliance', value: '100.0%', icon: 'verified_user' },
  { label: 'IP Accountability', value: 'Reconciled', icon: 'inventory_2' },
  { label: 'Safety Reporting Window', value: '0 Alerts', icon: 'health_and_safety' },
];
