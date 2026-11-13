import { useState } from 'react';
import Icon from '../../../components/common/Icon.jsx';
import CreateCapaModal from '../../../components/common/CreateCapaModal.jsx';
import ConfirmModal from '../../../components/common/ConfirmModal.jsx';
import { useMutation } from '../../../hooks/useDeviations.js';

function SimilarItem({ item }) {
  return (
    <a href={`#/deviation/${item.key}`} className="group p-2 rounded bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/60 transition-all flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 truncate">
          <span className="font-code text-code text-primary font-semibold group-hover:underline">{item.key}</span>
          <span className="font-body-md text-body-md text-on-surface truncate">{item.summary}</span>
        </div>
        <span className={`shrink-0 px-1.5 py-px rounded font-label-sm text-[10px] font-bold uppercase ${
          item.category === 'major' ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-secondary'
        }`}>
          {item.category}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-secondary">
        <span>{item.created ? new Date(item.created).toLocaleDateString() : ''}</span>
        <span className="font-code text-[10px]">{item.status}</span>
      </div>
    </a>
  );
}

export default function TrialDeckGlancePanel({ d, onUpdated }) {
  const [showCapaModal, setShowCapaModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  const { execute: doUpdateReportStatus, loading: updatingStatus, error: statusError } = useMutation('updateReportStatus');

  if (!d) return null;

  const similar = d.similar || d.related || [];
  const capa = d.capa;

  const handleApproveReport = async () => {
    try {
      await doUpdateReportStatus({ issueKey: d.key, status: 'Approved' });
      setShowApproveModal(false);
      onUpdated?.();
    } catch (err) {
      console.error('Failed to approve regulatory report', err);
    }
  };

  return (
    <aside aria-label="TrialDeck Extension Glance" className="bg-surface-container-lowest rounded shadow-sm overflow-hidden flex flex-col w-full max-w-[360px] mx-auto xl:max-w-none">
      <div className="px-space-md py-space-sm bg-surface-container-lowest border-b border-outline-variant/70 flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <div className="w-5 h-5 rounded bg-primary-container flex items-center justify-center text-on-primary">
            <Icon name="biotech" className="text-[14px]" />
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">TrialDeck</span>
          <span className="font-label-sm text-[10px] px-1.5 py-px rounded bg-surface-container text-secondary uppercase font-bold">Live</span>
        </div>
      </div>

      <div className="p-space-md flex flex-col gap-space-md">
        {/* Severity */}
        <div className="flex items-center justify-between gap-space-xs">
          <span className={`inline-flex items-center px-2 py-0.5 rounded font-label-sm text-label-sm font-bold uppercase tracking-wider ${
            d.category === 'major' ? 'bg-error-container text-on-error-container border border-error/30' : 'bg-[#FFF0B3] text-[#172B4D] border border-[#FFE380]'
          }`}>
            {d.category}
          </span>
          <span className="font-code text-[11px] text-secondary">STATUS: {d.status}</span>
        </div>

        {/* Metadata */}
        <div className="p-space-sm rounded bg-surface-container-low flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-body-md text-body-md text-secondary">Protocol &amp; Site</span>
            <span className="font-body-bold text-body-bold text-on-surface">{d.protocolVersion} | {d.site}</span>
          </div>
          <div className="flex items-center justify-between border-t border-outline-variant/40 pt-1 mt-0.5">
            <span className="font-body-md text-body-md text-secondary">Subject Identifier</span>
            <span className="font-code text-code font-bold text-primary">{d.subjectId}</span>
          </div>
        </div>

        {/* Similar deviations */}
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-headline-sm text-[13px] text-on-surface font-semibold">Similar deviations at {d.site}</span>
            <span className="w-4 h-4 rounded-full bg-surface-container-high text-secondary flex items-center justify-center font-code text-[10px] font-bold">
              {similar.length}
            </span>
          </div>
          {similar.length === 0 ? (
            <div className="text-[12px] text-[#6B778C] py-2">No other deviations logged at this site.</div>
          ) : (
            <div className="flex flex-col gap-1.5 mt-1">
              {similar.map((s) => <SimilarItem key={s.key} item={s} />)}
            </div>
          )}
        </div>

        <div className="h-px w-full bg-outline-variant/60" />

        {/* CAPA */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-secondary">CAPA Status</span>
            <button
              type="button"
              onClick={() => setShowCapaModal(true)}
              className="text-[11px] text-[#0052CC] font-semibold hover:underline"
            >
              + Create Task
            </button>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
            <div className="flex items-center gap-1.5">
              <Icon name="assignment_turned_in" className="text-[16px] text-primary" />
              <span className="font-code text-code font-bold text-on-surface">
                {capa ? capa.id : (d.dueDate ? 'CAPA Scheduled' : 'No CAPA Linked')}
              </span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded font-label-sm text-[11px] font-bold uppercase tracking-wider bg-[#FFF0B3] text-[#172B4D] border border-[#FFE380]">
              {capa ? capa.badge : (d.category === 'major' ? 'REQUIRED' : 'MONITOR')}
            </span>
          </div>
        </div>

        {/* Report status */}
        <div className="flex items-center justify-between py-1">
          <span className="font-body-md text-body-md text-secondary">Report status:</span>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-secondary font-label-sm text-[11px] uppercase font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-outline" />
            {d.reportStatus}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowApproveModal(true)}
          className="w-full h-8 px-space-md rounded text-white font-headline-sm text-headline-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm bg-[#0052CC] hover:bg-[#0065FF]"
        >
          <Icon name="verified" className="text-[16px]" />
          <span>Approve Regulatory Report</span>
        </button>
      </div>

      <div className="px-space-md py-space-xs bg-surface-container border-t border-outline-variant/60 flex items-center justify-between text-outline font-code text-[10px]">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Live Jira Sync
        </span>
        <span>TrialDeck CLIN</span>
      </div>

      <CreateCapaModal
        isOpen={showCapaModal}
        deviationKey={d.key}
        onClose={() => setShowCapaModal(false)}
        onCreated={() => {
          setShowCapaModal(false);
          onUpdated?.();
        }}
      />

      <ConfirmModal
        isOpen={showApproveModal}
        title={`Approve Report for ${d.key}`}
        confirmLabel="Approve Report"
        isLoading={updatingStatus}
        error={statusError}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleApproveReport}
      >
        <p className="text-body-md text-[#172B4D]">
          This will set Report status to <strong>Approved</strong> on Jira deviation <strong>{d.key}</strong> and add a permanent GCP compliance audit record comment to the issue.
        </p>
      </ConfirmModal>
    </aside>
  );
}
