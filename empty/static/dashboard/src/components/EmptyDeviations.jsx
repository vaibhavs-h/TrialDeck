import { Icon } from './Pill.jsx';
import { filters, kpis, readouts } from './emptyData.js';

// Zero-state for the Deviations dashboard: shown when no Protocol Deviation issues exist yet.
export default function EmptyDeviations({ onCreate, onImport, onLearnMore, onConfigure }) {
  const ghost =
    'h-8 px-3 rounded-[3px] bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant font-body-bold text-body-md flex items-center gap-1.5 transition-colors';

  return (
    <div className="flex flex-col w-full pb-12 gap-space-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-space-md font-body-md text-body-md text-on-surface-variant">
          <span>Protocol: <span className="font-body-bold text-body-bold text-on-surface">{filters.protocol}</span></span>
          <span>Timeframe: <span className="font-body-bold text-body-bold text-on-surface">{filters.timeframe}</span></span>
          <span className="inline-flex items-center gap-1 font-code text-[11px] bg-surface-container px-2 py-0.5 rounded">
            <Icon name="calendar_today" className="text-[13px]" />
            {filters.cohort}
          </span>
        </div>
        <div className="flex items-center gap-space-sm">
          <button type="button" className={ghost}><Icon name="tune" className="text-[16px]" />Filters</button>
          <button type="button" className={ghost}><Icon name="file_download" className="text-[16px]" />Export EDC Log</button>
          <button
            type="button"
            onClick={onCreate}
            className="h-8 px-3 rounded-[3px] bg-primary-container hover:bg-tertiary-container active:bg-primary text-on-primary font-body-bold text-body-md flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Icon name="add" className="text-[16px]" />
            Create Issue
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface-container-lowest border border-outline-variant rounded-[4px] p-space-md shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">{k.label}</span>
              <Icon name={k.icon} className="text-[18px] text-primary" />
            </div>
            <div className="flex items-baseline gap-space-sm">
              <span className="font-headline-lg text-headline-lg text-on-surface">{k.value}</span>
              <span className="font-body-bold text-body-bold text-on-surface-variant">{k.note}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 font-code text-[11px] text-on-surface-variant">
              <Icon name={k.subIcon} className="text-[14px] text-primary" />
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      <section className="bg-surface-container-lowest border border-outline-variant rounded-[4px] shadow-sm flex flex-col items-center text-center px-space-lg py-space-xl">
        <div className="w-24 h-24 rounded-[8px] bg-surface-container-low border border-outline-variant flex items-center justify-center text-primary mb-space-md">
          <Icon name="assignment_turned_in" className="text-[48px]" />
        </div>
        <h2 className="font-headline-md text-headline-md text-on-surface">No deviations yet</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-1">
          Create a Protocol Deviation issue in Jira to get started tracking regulatory variations, consent
          irregularities, or site variance.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-space-md h-9 px-4 rounded-[3px] bg-primary-container hover:bg-tertiary-container active:bg-primary text-on-primary font-body-bold text-body-md flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Icon name="add" className="text-[18px]" />
          Create Protocol Deviation
        </button>
        <div className="mt-space-md flex flex-wrap items-center justify-center gap-space-md">
          <button type="button" onClick={onLearnMore} className="flex items-center gap-1.5 font-body-md text-body-md text-primary hover:underline">
            <Icon name="auto_awesome" className="text-[16px]" />
            Learn more about automated detection
          </button>
          <span className="text-outline-variant" aria-hidden="true">•</span>
          <button type="button" onClick={onImport} className="flex items-center gap-1.5 font-body-md text-body-md text-primary hover:underline">
            <Icon name="sync_alt" className="text-[16px]" />
            Import historical records from EDC
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
        <section className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-[4px] shadow-sm p-space-md">
          <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant mb-space-md">
            <h3 className="flex items-center gap-space-sm font-headline-sm text-headline-sm text-on-surface">
              <Icon name="table_chart" className="text-on-surface-variant" />
              Recent Non-Conformance Log
            </h3>
            <span className="font-code text-[11px] text-on-surface-variant">0 entries logged</span>
          </div>
          <div className="bg-surface-container-low rounded-[4px] flex flex-col items-center text-center py-space-lg px-space-md">
            <Icon name="view_stream" className="text-[28px] text-outline mb-1" />
            <div className="font-body-bold text-body-bold text-on-surface">Audit log is clear</div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
              Active clinical monitoring visits have yielded no adverse deviations during this reporting window.
            </p>
          </div>
        </section>

        <section className="bg-surface-container-lowest border border-outline-variant rounded-[4px] shadow-sm p-space-md flex flex-col">
          <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant mb-space-md">
            <h3 className="flex items-center gap-space-sm font-headline-sm text-headline-sm text-on-surface">
              <Icon name="hub" className="text-on-surface-variant" />
              Monitoring Readouts
            </h3>
            <span className="font-label-sm text-label-sm uppercase bg-[#DEEBFF] text-[#0747A6] px-1.5 py-0.5 rounded-[3px]">Live</span>
          </div>
          <ul className="flex flex-col gap-space-sm">
            {readouts.map((r) => (
              <li key={r.label} className="flex items-center justify-between bg-surface-container-low rounded-[4px] px-space-sm py-2">
                <span className="flex items-center gap-space-sm font-body-bold text-body-bold text-on-surface">
                  <Icon name={r.icon} className="text-[18px] text-primary" />
                  {r.label}
                </span>
                <span className="font-code text-code text-on-surface">{r.value}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={onConfigure} className="mt-space-md self-end flex items-center gap-1 font-body-bold text-body-md text-primary hover:underline">
            Configure threshold alerts
            <Icon name="arrow_forward" className="text-[16px]" />
          </button>
        </section>
      </div>
    </div>
  );
}
