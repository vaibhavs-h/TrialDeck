import { useState } from 'react';

const Icon = ({ name, className }) => <span className={`material-symbols-outlined ${className}`}>{name}</span>;

const statusTones = {
  red:    { pill: 'text-[#DE350B] bg-[#FFEBE6] border-[#FFBDAD]', dot: 'bg-[#DE350B]' },
  yellow: { pill: 'text-[#172B4D] bg-[#FFF0B3] border-[#FFE380]', dot: 'bg-[#FFAB00]' },
  blue:   { pill: 'text-[#0747A6] bg-[#DEEBFF] border-[#B3D4FF]', dot: 'bg-[#0052CC]' },
  grey:   { pill: 'text-[#172B4D] bg-[#EBECF0] border-[#DFE1E6]', dot: 'bg-[#5E6C84]' },
  green:  { pill: 'text-[#006644] bg-[#E3FCEF] border-[#ABF5D1]', dot: 'bg-[#00875A]' },
};

const severityTones = {
  Major:    'bg-[#FFEBE6] text-[#DE350B] border-[#FFBDAD]',
  major:    'bg-[#FFEBE6] text-[#DE350B] border-[#FFBDAD]',
  Minor:    'bg-[#FFF0B3] text-[#172B4D] border-[#FFE380]',
  minor:    'bg-[#FFF0B3] text-[#172B4D] border-[#FFE380]',
  Resolved: 'bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]',
};

const dueTones = {
  overdue: 'font-bold text-[#DE350B]',
  soon:    'font-semibold text-[#FFAB00]',
  normal:  'font-normal text-[#172B4D]',
  closed:  'font-normal text-[#006644]',
};

const headers = ['ID', 'Site', 'Category / Severity', 'Status', 'CAPA Due', 'Owner', 'Age'];

export default function OverdueCapaTable({ data = [], totalOpen = 0 }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const rows = q
    ? data.filter((r) => Object.values(r).join(' ').toLowerCase().includes(q))
    : data;

  return (
    <div id="table-section" className="jira-card mt-4 overflow-hidden">
      <div className="p-4 border-b border-[#DFE1E6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="font-headline-md text-headline-md text-[#172B4D]">Needs attention</h3>
          <span className="inline-flex items-center justify-center bg-[#EBECF0] text-[#42526E] text-[11px] font-bold px-2 py-0.5 rounded-[10px]">
            {rows.length} items
          </span>
          <span className="hidden md:inline text-[12px] text-[#6B778C]">| Critical protocol &amp; GCP governance priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Icon name="search" className="absolute left-2 text-[#6B778C] text-[16px]" />
            <input
              type="text"
              placeholder="Filter issues..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 pl-7 pr-3 w-44 sm:w-56 bg-white border border-[#DFE1E6] rounded-[3px] font-body-md text-body-md text-[#172B4D] placeholder:text-[#6B778C] focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAFBFC] border-b-2 border-[#DFE1E6]">
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 font-label-sm text-label-sm uppercase tracking-wider text-[#6B778C]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DFE1E6]">
            {rows.map((r) => {
              const tone = statusTones[r.statusTone] || statusTones.blue;
              return (
                <tr key={r.id || r.key} className="hover:bg-[#F4F5F7] transition-colors group">
                  <td className="px-4 py-3 whitespace-nowrap font-code text-[12px]">
                    <a href={`#/deviation/${r.key || r.id}`} className="text-[#0052CC] font-semibold hover:underline flex items-center gap-1">
                      {r.key || r.id}
                    </a>
                    <span className="text-[10px] text-[#6B778C] block">{r.subject}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-headline-sm text-headline-sm text-[#172B4D] block">{r.site}</span>
                    <span className="text-[11px] text-[#6B778C]">PI: {r.pi || 'Investigator'}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[3px] text-[11px] font-bold uppercase tracking-wider border ${severityTones[r.severity] || severityTones.Minor}`}>
                      {r.severity}
                    </span>
                    <span className="text-[11px] text-[#6B778C] block mt-0.5 capitalize">{r.category}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-[3px] uppercase border ${tone.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} /> {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[12px] ${dueTones[r.dueTone] || dueTones.normal}`}>{r.dueLabel}</span>
                    <span className="block text-[11px] text-[#6B778C]">{r.dueNote}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[10px]" style={{ background: r.avatar || '#0052CC' }}>
                        {r.initials || 'U'}
                      </div>
                      <span className="font-headline-sm text-headline-sm text-[#172B4D]">{r.owner || 'Assigned Staff'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[#172B4D] font-code text-[12px]">{r.age}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#6B778C]">
                  {query ? `No deviations match “${query}”.` : 'No protocol deviations requiring attention.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 bg-[#FAFBFC] border-t border-[#DFE1E6] flex flex-col sm:flex-row items-center justify-between gap-3 text-[#6B778C]">
        <span className="font-body-md text-body-md">
          Showing <strong>{rows.length}</strong> of <strong>{totalOpen || rows.length}</strong> open deviations
        </span>
      </div>
    </div>
  );
}
