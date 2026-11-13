import { useState } from 'react';

const selectCls =
  'appearance-none bg-white border border-[#DFE1E6] rounded-[3px] h-[36px] pr-8 font-body-md text-body-md text-[#172B4D] hover:bg-[#F4F5F7] focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent cursor-pointer transition-colors shadow-sm';
const btnCls =
  'inline-flex items-center gap-1.5 h-[36px] px-3 bg-[#F4F5F7] hover:bg-[#EBECF0] active:bg-[#DFE1E6] border border-[#DFE1E6] rounded-[3px] text-[#172B4D] font-headline-sm text-headline-sm transition-colors shadow-sm cursor-pointer';

const Icon = ({ name, className }) => <span className={`material-symbols-outlined ${className}`}>{name}</span>;

const ranges = [
  { value: '90', label: 'Last 90 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Protocol to date (YTD)' },
];

export default function DashboardHeader({
  sites = [],
  selectedSite,
  onSiteChange,
  selectedRange = '90',
  onRangeChange,
  exportData = [],
}) {
  const [range, setRange] = useState(selectedRange);

  const handleExportCsv = () => {
    if (!exportData || exportData.length === 0) {
      alert('No deviation records available to export.');
      return;
    }
    const headers = ['Key', 'Summary', 'Site', 'Category', 'Severity', 'Subject ID', 'Status', 'CAPA Due', 'Date Detected', 'Root Cause'];
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = exportData.map(d => [
      escapeCsv(d.key || d.id),
      escapeCsv(d.summary || ''),
      escapeCsv(d.site || ''),
      escapeCsv(d.category || ''),
      escapeCsv(d.severity || ''),
      escapeCsv(d.subject || d.subjectId || ''),
      escapeCsv(d.status || ''),
      escapeCsv(d.dueLabel || d.duedate || ''),
      escapeCsv(d.dateDetected || ''),
      escapeCsv(d.rootCause || '')
    ].join(','));

    const metadataHeader = [
      `# TrialDeck Clinical Trial Operations Hub - Protocol Deviations Live Export`,
      `# Export Date: ${new Date().toISOString()}`,
      `# Total Records: ${exportData.length}`,
      `# Site Filter: ${selectedSite || 'All Sites'}`,
      `# Range: Last ${range} days`,
      ''
    ].join('\r\n');

    const csvContent = metadataHeader + headers.join(',') + '\r\n' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trialdeck-deviations-${selectedSite || 'all'}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md py-space-md print:hidden">
      <div className="flex flex-col">
        <div className="flex items-center gap-space-xs">
          <h1 className="font-headline-lg text-headline-lg text-[#172B4D] tracking-tight">TrialDeck</h1>
          <span className="text-outline text-body-md">/</span>
          <span className="font-headline-sm text-headline-sm text-[#172B4D]">Clinical Trial Operations Hub</span>
        </div>
        <p className="font-body-md text-body-md text-[#6B778C] mt-0.5">
          Clinical Trial Protocol Compliance &amp; Monitoring Governance (Live Jira Data)
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-space-sm">
        {sites.length > 0 && (
          <div className="relative inline-flex items-center">
            <select
              className={`${selectCls} pl-3`}
              value={selectedSite || 'all'}
              onChange={(e) => onSiteChange?.(e.target.value === 'all' ? null : e.target.value)}
            >
              <option value="all">All Sites</option>
              {sites.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Icon name="expand_more" className="absolute right-2 pointer-events-none text-[#6B778C] text-[18px]" />
          </div>
        )}

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

        <button
          type="button"
          onClick={handleExportCsv}
          className={btnCls}
          title="Export live filtered deviations to CSV"
        >
          <Icon name="download" className="text-[18px] text-[#5E6C84]" />
          <span>Export CSV</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className={btnCls}
          title="Print or save as PDF"
        >
          <Icon name="print" className="text-[18px] text-[#5E6C84]" />
          <span>Print</span>
        </button>
      </div>
    </div>
  );
}
