import { useState } from 'react';
import Pill, { Icon } from '../components/Pill.jsx';
import ChangeCards from '../components/ChangeCards.jsx';
import SiteActionsTable from '../components/SiteActionsTable.jsx';
import ApprovalBar from '../components/ApprovalBar.jsx';
import { amendment, metrics } from '../data/amendmentData.js';

export default function AmendmentPage() {
  const [status, setStatus] = useState('idle'); // idle | saving | approved

  // TODO: call a resolver (e.g. invoke('createAmendmentTasks')) once it exists.
  // Until then approval only updates local UI state; no Jira issues are created.
  const approve = () => {
    setStatus('saving');
    setTimeout(() => setStatus('approved'), 400);
  };

  return (
    <div className="flex flex-col w-full pb-24">
      <div className="flex flex-col gap-space-xs mb-space-md">
        <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-on-surface-variant font-body-md text-body-md">
          <a className="hover:text-on-surface transition-colors" href="#/">Projects</a>
          <span className="text-outline-variant font-code text-[11px]">/</span>
          <a className="hover:text-on-surface transition-colors" href="#/">TrialDeck (Clinical Operations)</a>
          <span className="text-outline-variant font-code text-[11px]">/</span>
          <a className="hover:text-on-surface transition-colors" href="#/amendment">Protocol Amendments</a>
          <span className="text-outline-variant font-code text-[11px]">/</span>
          <span className="text-on-surface font-body-bold text-body-bold">Amendment 3</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pt-space-xs">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">{amendment.title}</h1>
              <Pill tone="warning">{amendment.status}</Pill>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Protocol: <span className="font-code text-code text-on-surface">{amendment.protocol}</span> • Effective
              Date: {amendment.effectiveDate} • Sponsor: {amendment.sponsor}
            </p>
          </div>
          <div className="flex items-center gap-space-sm self-start md:self-auto shrink-0">
            <button
              type="button"
              className="h-8 px-3 rounded-[3px] bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant font-body-bold text-body-md flex items-center gap-1.5 transition-colors"
            >
              <Icon name="picture_as_pdf" className="text-[16px] text-on-surface-variant" />
              Compare Redline (PDF)
            </button>
            <button
              type="button"
              className="h-8 px-3 rounded-[3px] bg-primary-container hover:bg-tertiary-container active:bg-primary text-on-primary font-body-bold text-body-md flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Icon name="auto_awesome" className="text-[16px]" />
              Analyze changes
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-lg">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-surface-container-lowest border border-outline-variant rounded-[4px] p-space-md flex items-center justify-between shadow-sm"
          >
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1">{m.label}</span>
              <span className="font-headline-md text-headline-md text-on-surface">{m.value}</span>
              <span className="font-body-md text-body-md text-on-surface-variant mt-0.5">{m.sub}</span>
            </div>
            <div className="w-10 h-10 rounded-[3px] bg-surface-container-low flex items-center justify-center text-primary">
              <Icon name={m.icon} className="text-[20px]" />
            </div>
          </div>
        ))}
      </div>

      <ChangeCards />
      <SiteActionsTable />
      <ApprovalBar status={status} onApprove={approve} onEdit={() => {}} />
    </div>
  );
}
