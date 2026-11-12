import { useState } from 'react';

const studies = [
  { value: 'ONC-101', label: 'Study: ONC-101 (Non-Small Cell Lung)' },
  { value: 'CRD-204', label: 'Study: CRD-204 (Cardio-Renal Phase II)' },
  { value: 'IMM-405', label: 'Study: IMM-405 (Targeted Biologics)' },
];
const ranges = [
  { value: '90', label: 'Last 90 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Protocol to date (YTD)' },
];

const selectCls =
  'appearance-none bg-white border border-[#DFE1E6] rounded-[3px] h-[36px] pr-8 font-body-md text-body-md text-[#172B4D] hover:bg-[#F4F5F7] focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent cursor-pointer transition-colors shadow-sm';
const btnCls =
  'inline-flex items-center gap-1.5 h-[36px] px-3 bg-[#F4F5F7] hover:bg-[#EBECF0] active:bg-[#DFE1E6] border border-[#DFE1E6] rounded-[3px] text-[#172B4D] font-headline-sm text-headline-sm transition-colors shadow-sm';

const Icon = ({ name, className }) => <span className={`material-symbols-outlined ${className}`}>{name}</span>;

export default function DashboardHeader({ onStudyChange, onRangeChange }) {
  const [study, setStudy] = useState('ONC-101');
  const [range, setRange] = useState('90');

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md py-space-md">
      <div className="flex flex-col">
        <div className="flex items-center gap-space-xs">
          <h1 className="font-headline-lg text-headline-lg text-[#172B4D] tracking-tight">TrialDeck</h1>
          <span className="text-outline text-body-md">/</span>
          <span className="font-headline-sm text-headline-sm text-[#172B4D]">ONC-101 Protocol Dashboard</span>
        </div>
        <p className="font-body-md text-body-md text-[#6B778C] mt-0.5">
          Clinical Trial Protocol Compliance &amp; Monitoring Governance
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-space-sm">
        <div className="relative inline-flex items-center">
          <select
            className={`${selectCls} pl-3`}
            value={study}
            onChange={(e) => { setStudy(e.target.value); onStudyChange?.(e.target.value); }}
          >
            {studies.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <Icon name="expand_more" className="absolute right-2 pointer-events-none text-[#6B778C] text-[18px]" />
        </div>

        <div className="relative inline-flex items-center">
          <Icon name="calendar_today" className="absolute left-2.5 pointer-events-none text-[#6B778C] text-[18px]" />
          <select
            className={`${selectCls} pl-8`}
            value={range}
            onChange={(e) => { setRange(e.target.value); onRangeChange?.(e.target.value); }}
          >
            {ranges.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <Icon name="expand_more" className="absolute right-2 pointer-events-none text-[#6B778C] text-[18px]" />
        </div>

        <button type="button" className={btnCls}>
          <Icon name="tune" className="text-[18px] text-[#5E6C84]" />
          <span>Filter</span>
        </button>
        <button type="button" className={btnCls}>
          <Icon name="file_download" className="text-[18px] text-[#5E6C84]" />
          <span>Export Report</span>
        </button>
      </div>
    </div>
  );
}