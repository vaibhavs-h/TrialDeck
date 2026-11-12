import { useEffect, useRef, useState } from 'react';
import Icon from '../../../components/common/Icon.jsx';
import { glance } from '../data/deviationData.js';

const tagTones = {
  resolved: 'bg-surface-container-high text-secondary',
  major: 'bg-error-container text-on-error-container',
};

function SimilarItem({ item }) {
  return (
    <a href={`#/deviation/${item.id}`} className="group p-2 rounded bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/60 transition-all flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 truncate">
          <span className="font-code text-code text-primary font-semibold group-hover:underline">{item.id}</span>
          <span className="font-body-md text-body-md text-on-surface truncate">{item.title}</span>
        </div>
        <span className={`shrink-0 px-1.5 py-px rounded font-label-sm text-[10px] font-bold uppercase ${tagTones[item.tone]}`}>
          {item.tag}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-secondary">
        <span>{item.date}</span>
        <span className="font-code">{item.cohort}</span>
      </div>
    </a>
  );
}

// idle -> loading -> done -> idle
function DraftReportButton() {
  const [state, setState] = useState('idle');
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = () => {
    if (state !== 'idle') return;
    setState('loading');
    timers.current.push(
      setTimeout(() => {
        setState('done');
        timers.current.push(setTimeout(() => setState('idle'), 3000));
      }, 1200)
    );
  };

  const content = {
    idle:    { icon: 'auto_awesome', label: 'Draft report with AI', cls: 'bg-[#0052CC] hover:bg-[#0065FF] active:bg-[#0747A6]' },
    loading: { icon: 'refresh', label: 'Compiling protocol context...', cls: 'bg-[#0052CC] opacity-90' },
    done:    { icon: 'check_circle', label: 'Report draft created', cls: 'bg-[#006644]' },
  }[state];

  return (
    <div className="pt-space-xs">
      <button
        type="button"
        onClick={start}
        className={`w-full h-8 px-space-md rounded text-white font-headline-sm text-headline-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm ${content.cls}`}
      >
        <Icon name={content.icon} className={`text-[16px] ${state === 'loading' ? 'animate-spin' : ''}`} />
        <span>{content.label}</span>
      </button>
      <p className="font-body-md text-[11px] text-secondary text-center mt-1.5">
        Generates FDA 1572 / IRB incident audit template
      </p>
    </div>
  );
}

export default function TrialDeckGlancePanel() {
  const g = glance;
  return (
    <aside aria-label="TrialDeck Extension Glance" className="bg-surface-container-lowest rounded shadow-sm overflow-hidden flex flex-col w-full max-w-[360px] mx-auto xl:max-w-none">
      {/* Header */}
      <div className="px-space-md py-space-sm bg-surface-container-lowest border-b border-outline-variant/70 flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <div className="w-5 h-5 rounded bg-primary-container flex items-center justify-center text-on-primary">
            <Icon name="biotech" className="text-[14px]" />
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">TrialDeck</span>
          <span className="font-label-sm text-[10px] px-1.5 py-px rounded bg-surface-container text-secondary uppercase font-bold">App</span>
        </div>
        <div className="flex items-center gap-0.5 text-secondary">
          <button type="button" aria-label="Open full glance" className="p-1 rounded hover:bg-surface-container-high hover:text-on-surface transition-colors flex items-center">
            <Icon name="open_in_new" className="text-[16px]" />
          </button>
          <button type="button" aria-label="Panel options" className="p-1 rounded hover:bg-surface-container-high hover:text-on-surface transition-colors flex items-center">
            <Icon name="more_vert" className="text-[16px]" />
          </button>
        </div>
      </div>

      <div className="p-space-md flex flex-col gap-space-md">
        {/* Severity */}
        <div className="flex items-center justify-between gap-space-xs">
          <span className="inline-flex items-center px-2 py-0.5 rounded font-label-sm text-label-sm font-bold uppercase tracking-wider bg-error-container text-on-error-container border border-error/30">
            {g.severity}
          </span>
          <span className="font-code text-[11px] text-secondary">{g.category}</span>
        </div>

        {/* Metadata */}
        <div className="p-space-sm rounded bg-surface-container-low flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-body-md text-body-md text-secondary">Protocol &amp; Site</span>
            <span className="font-body-bold text-body-bold text-on-surface">{g.protocolSite}</span>
          </div>
          <div className="flex items-center justify-between border-t border-outline-variant/40 pt-1 mt-0.5">
            <span className="font-body-md text-body-md text-secondary">Subject Identifier</span>
            <span className="font-code text-code font-bold text-primary">SUBJ-0042</span>
          </div>
        </div>

        {/* Similar deviations */}
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-headline-sm text-[13px] text-on-surface font-semibold">Similar deviations at this site</span>
            <span className="w-4 h-4 rounded-full bg-surface-container-high text-secondary flex items-center justify-center font-code text-[10px] font-bold">
              {g.similarCount}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 mt-1">
            {g.similar.map((s) => <SimilarItem key={s.id} item={s} />)}
          </div>
          <div className="pt-0.5">
            <a href="#/sites" className="font-body-bold text-body-bold text-primary hover:underline flex items-center gap-1">
              View all {g.similarCount} →
            </a>
          </div>
        </div>

        <div className="h-px w-full bg-outline-variant/60" />

        {/* CAPA */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-secondary">CAPA Status</span>
            <span className="font-body-md text-[11px] text-secondary">{g.capa.owner}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
            <div className="flex items-center gap-1.5">
              <Icon name="assignment_turned_in" className="text-[16px] text-primary" />
              <span className="font-code text-code font-bold text-on-surface">{g.capa.id}</span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded font-label-sm text-[11px] font-bold uppercase tracking-wider bg-[#FFF0B3] text-[#172B4D] border border-[#FFE380]">
              {g.capa.badge}
            </span>
          </div>
        </div>

        {/* Report status */}
        <div className="flex items-center justify-between py-1">
          <span className="font-body-md text-body-md text-secondary">Report status:</span>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-secondary font-label-sm text-[11px] uppercase font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-outline" />
            {g.reportStatus}
          </div>
        </div>

        <DraftReportButton />
      </div>

      <div className="px-space-md py-space-xs bg-surface-container border-t border-outline-variant/60 flex items-center justify-between text-outline font-code text-[10px]">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Sync active
        </span>
        <span>TrialDeck v2.4</span>
      </div>
    </aside>
  );
}