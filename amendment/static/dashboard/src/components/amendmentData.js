// Mock data for the Protocol Amendment impact page (synthetic, per project data policy).
// Replace with resolver calls (diffAmendment / Rovo task plan) once those are wired.

export const amendment = {
  title: 'Amendment 3 (v2.1 to v2.2)',
  status: 'Pending Operational Rollout',
  protocol: 'ONC-101 Monotherapy',
  effectiveDate: 'Nov 15, 2024',
  sponsor: 'BioPharma Therapeutics',
  diffId: 'DIFF-v2.2',
  fromVersion: 'v2.1',
  toVersion: 'v2.2',
  jiraProject: 'DEV (Clinical Operations)',
  tmfLink: 'TMF-ROLLOUT-ONC',
};

export const metrics = [
  { label: 'Trial Spread', value: '5 Active Sites', sub: '100% oncology network coverage', icon: 'domain' },
  { label: 'Subject Governance', value: '38 Patients', sub: 'Requiring protocol re-consent', icon: 'groups' },
  { label: 'Operational Burden', value: '12 Jira Action Items', sub: 'Distribution ready across CRAs', icon: 'checklist' },
];

// tone: info | danger | warning | purple (see TONES in Pill.jsx)
export const changes = [
  {
    id: '01',
    area: 'Criteria',
    section: 'Section 4.2',
    tone: 'info',
    title: 'Inclusion criteria: age limit raised to 75',
    body: 'Expands eligible subject cohort from age 65 to 75. Allows immediate screening of backlogged candidates across all active oncology centers.',
    impact: 'Requires screening form update',
    icon: 'swap_horiz',
  },
  {
    id: '02',
    area: 'Safety',
    section: 'Section 6.5',
    tone: 'danger',
    title: 'Safety monitoring: mandatory 48h ECG post-infusion',
    body: 'Replaces optional telemetry with mandatory 12-lead ECG at 48 hours post-Cycle 1 dose 1. Telemetry checklist revised.',
    impact: 'Requires nurse & CRA retraining',
    icon: 'school',
  },
  {
    id: '03',
    area: 'Pharmacokinetics',
    section: 'Section 8.1',
    tone: 'warning',
    title: 'Dose escalation cohort 3 PK sampling window extended',
    body: 'Window for blood draw widened from ±15 minutes to ±45 minutes to reduce sampling protocol deviations during infusion peaks.',
    impact: 'eCRF schedule adjustment',
    icon: 'event_note',
  },
  {
    id: '04',
    area: 'Regulatory',
    section: 'Appendix B',
    tone: 'purple',
    title: 'Patient Informed Consent Form updated to v2.2',
    body: 'Clarified risks for secondary hepatic enzymes. All active on-study participants must be re-consented at their next scheduled clinic visit.',
    impact: 'IRB approval & re-consent mandatory',
    icon: 'assignment_turned_in',
  },
];

// Each cell: { tone, icon, label }
export const sites = [
  {
    name: 'Site 01 - St. Jude Medical',
    pi: 'Dr. A. Morales',
    reconsent: { tone: 'warning', icon: 'person_check', label: 'Required (8 subjects)' },
    irb: { tone: 'success', icon: 'verified', label: 'Approved (IRB-2024-88)' },
    retraining: { tone: 'info', icon: 'calendar_today', label: 'Scheduled Oct 26' },
    forms: { tone: 'success', icon: 'check', label: 'eCRF Ready' },
  },
  {
    name: 'Site 02 - Memorial Oncology',
    pi: 'Dr. C. Henderson',
    reconsent: { tone: 'danger', icon: 'warning', label: 'Required (14 subjects)' },
    irb: { tone: 'warning', icon: 'hourglass_top', label: 'In Review (Expedited)' },
    retraining: { tone: 'warning', icon: 'group_add', label: 'Required (5 staff)' },
    forms: { tone: 'neutral', icon: 'draft', label: 'Template Prepared' },
  },
  {
    name: 'Site 03 - Johns Hopkins',
    pi: 'Dr. S. Patel',
    reconsent: { tone: 'warning', icon: 'person_check', label: 'Required (6 subjects)' },
    irb: { tone: 'success', icon: 'verified', label: 'Approved (IRB-2024-91)' },
    retraining: { tone: 'success', icon: 'task_alt', label: 'Completed' },
    forms: { tone: 'success', icon: 'check', label: 'eCRF Ready' },
  },
  {
    name: 'Site 04 - MD Anderson',
    pi: 'Dr. F. Evans',
    reconsent: { tone: 'warning', icon: 'person_check', label: 'Required (10 subjects)' },
    irb: { tone: 'warning', icon: 'hourglass_empty', label: 'In Review' },
    retraining: { tone: 'info', icon: 'calendar_today', label: 'Scheduled Oct 29' },
    forms: { tone: 'warning', icon: 'sync_problem', label: 'Action Needed' },
  },
  {
    name: 'Site 05 - Mayo Clinic',
    pi: 'Dr. G. Lawson',
    reconsent: { tone: 'neutral', icon: 'check_circle', label: 'Required (0 active - in screening)' },
    irb: { tone: 'success', icon: 'verified', label: 'Approved' },
    retraining: { tone: 'success', icon: 'task_alt', label: 'Completed' },
    forms: { tone: 'success', icon: 'check', label: 'eCRF Ready' },
  },
];

export const taskCount = 12;
