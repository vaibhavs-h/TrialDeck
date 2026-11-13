import { useState } from 'react';
import { useSites, useCapas, useReports, useMutation } from '../../../hooks/useDeviations.js';
import CreateSiteTaskModal from '../../../components/common/CreateSiteTaskModal.jsx';
import CreateCapaModal from '../../../components/common/CreateCapaModal.jsx';
import ConfirmModal from '../../../components/common/ConfirmModal.jsx';

export function SitesPage() {
  const { data: sites, loading, error, refetch } = useSites();
  const [selectedSiteForTask, setSelectedSiteForTask] = useState(null);

  if (loading) return <div className="p-8 text-center text-[#6B778C]">Loading trial sites...</div>;
  if (error) return <div className="p-8 text-center text-[#DE350B]">Error: {error}</div>;

  return (
    <div className="flex flex-col w-full pb-12">
      <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-[#172B4D]">Trial Sites Directory</h1>
          <p className="text-body-md text-[#6B778C]">Active trial investigator sites from live Jira records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {(sites || []).map(s => (
          <div key={s.id || s.name} className="jira-card p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-headline-sm font-bold text-[#172B4D]">{s.name}</span>
                {s.flagged && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-[#FFEBE6] text-[#DE350B]">
                    Flagged (&gt;5)
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-[28px] font-bold text-[#172B4D]">{s.total}</span>
                <span className="text-[12px] text-[#6B778C]">deviations total</span>
              </div>
              <div className="mt-2 text-[12px] text-[#6B778C]">
                Major: <strong className="text-[#DE350B]">{s.major}</strong> | Minor: <strong>{s.minor}</strong>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F4F5F7] flex items-center justify-between gap-2">
              <a href={`#/coordinator`} className="text-[#0052CC] font-body-bold text-[12px] hover:underline">
                View Deviations →
              </a>
              <button
                type="button"
                onClick={() => setSelectedSiteForTask(s.name)}
                className="px-2.5 py-1 text-[12px] font-medium bg-[#0052CC] text-white rounded hover:bg-[#0065FF] transition-colors"
              >
                + Checkpoint Task
              </button>
            </div>
          </div>
        ))}
        {(!sites || sites.length === 0) && (
          <div className="col-span-3 py-12 text-center text-[#6B778C]">No trial sites recorded in Jira.</div>
        )}
      </div>

      <CreateSiteTaskModal
        isOpen={Boolean(selectedSiteForTask)}
        siteName={selectedSiteForTask}
        onClose={() => setSelectedSiteForTask(null)}
        onCreated={() => {
          setSelectedSiteForTask(null);
          refetch();
        }}
      />
    </div>
  );
}

export function CapaPage() {
  const { data: capas, loading, error, refetch } = useCapas();
  const [selectedDeviationForCapa, setSelectedDeviationForCapa] = useState(null);
  const [confirmDoneTarget, setConfirmDoneTarget] = useState(null);
  const [confirmEscalateTarget, setConfirmEscalateTarget] = useState(null);

  const { execute: doTransition, loading: transitioning, error: transitionError } = useMutation('transitionIssue');
  const { execute: doEscalate, loading: escalating, error: escalateError } = useMutation('escalateCapa');

  if (loading) return <div className="p-8 text-center text-[#6B778C]">Loading CAPA register...</div>;
  if (error) return <div className="p-8 text-center text-[#DE350B]">Error: {error}</div>;

  const handleMarkDone = async () => {
    if (!confirmDoneTarget) return;
    try {
      await doTransition({ issueKey: confirmDoneTarget.key, targetStatus: 'Done' });
      setConfirmDoneTarget(null);
      refetch();
    } catch (err) {
      console.error('Failed to transition to Done', err);
    }
  };

  const handleEscalate = async () => {
    if (!confirmEscalateTarget) return;
    try {
      await doEscalate({ issueKey: confirmEscalateTarget.key, reason: 'Manual operational escalation from CAPA Register' });
      setConfirmEscalateTarget(null);
      refetch();
    } catch (err) {
      console.error('Failed to escalate', err);
    }
  };

  return (
    <div className="flex flex-col w-full pb-12">
      <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-[#172B4D]">CAPA Register &amp; Tracker</h1>
          <p className="text-body-md text-[#6B778C]">Corrective and Preventive Actions tracked from Jira issues</p>
        </div>
      </div>

      <div className="jira-card mt-4 overflow-hidden">
        <table className="w-full text-left border-collapse font-body-md text-body-md">
          <thead>
            <tr className="bg-[#FAFBFC] border-b-2 border-[#DFE1E6] font-label-sm text-label-sm uppercase text-[#6B778C]">
              <th className="px-4 py-3">Issue Key</th>
              <th className="px-4 py-3">Site</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DFE1E6]">
            {(capas || []).map(c => (
              <tr key={c.id || c.key} className="hover:bg-[#F4F5F7] transition-colors">
                <td className="px-4 py-3 font-code text-[12px]">
                  <a href={`#/deviation/${c.key || c.id}`} className="text-[#0052CC] font-semibold hover:underline">
                    {c.key || c.id}
                  </a>
                </td>
                <td className="px-4 py-3 font-headline-sm">{c.site}</td>
                <td className="px-4 py-3 font-code text-[11px]">{c.subject}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${c.severity === 'Major' ? 'bg-[#FFEBE6] text-[#DE350B]' : 'bg-[#FFF0B3] text-[#172B4D]'}`}>
                    {c.severity}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">{c.status}</td>
                <td className="px-4 py-3">
                  <span className={c.dueTone === 'overdue' ? 'text-[#DE350B] font-bold' : ''}>
                    {c.dueLabel}
                  </span>
                </td>
                <td className="px-4 py-3">{c.owner}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDeviationForCapa(c.key || c.id)}
                      className="px-2 py-1 text-[11px] font-medium bg-[#F4F5F7] hover:bg-[#EBECF0] border border-[#DFE1E6] rounded text-[#172B4D]"
                      title="Link new Jira Task"
                    >
                      + CAPA Task
                    </button>
                    {c.status !== 'Done' && (
                      <button
                        type="button"
                        onClick={() => setConfirmDoneTarget(c)}
                        className="px-2 py-1 text-[11px] font-medium bg-[#E3FCEF] hover:bg-[#ABF5D1] border border-[#ABF5D1] rounded text-[#006644]"
                      >
                        Mark Done
                      </button>
                    )}
                    {c.dueTone === 'overdue' && (
                      <button
                        type="button"
                        onClick={() => setConfirmEscalateTarget(c)}
                        className="px-2 py-1 text-[11px] font-bold bg-[#FFEBE6] hover:bg-[#FFBDAD] border border-[#FFBDAD] rounded text-[#DE350B]"
                      >
                        Escalate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {(!capas || capas.length === 0) && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[#6B778C]">No CAPA actions currently registered.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CreateCapaModal
        isOpen={Boolean(selectedDeviationForCapa)}
        deviationKey={selectedDeviationForCapa}
        onClose={() => setSelectedDeviationForCapa(null)}
        onCreated={() => {
          setSelectedDeviationForCapa(null);
          refetch();
        }}
      />

      <ConfirmModal
        isOpen={Boolean(confirmDoneTarget)}
        title={`Mark CAPA Done: ${confirmDoneTarget?.key}`}
        confirmLabel="Transition Issue"
        isLoading={transitioning}
        error={transitionError}
        onClose={() => setConfirmDoneTarget(null)}
        onConfirm={handleMarkDone}
      >
        <p className="text-body-md text-[#172B4D]">
          This will execute a live Jira transition on issue <strong>{confirmDoneTarget?.key}</strong> to status <strong>Done</strong>.
        </p>
      </ConfirmModal>

      <ConfirmModal
        isOpen={Boolean(confirmEscalateTarget)}
        title={`Escalate Overdue CAPA: ${confirmEscalateTarget?.key}`}
        confirmLabel="Escalate to High Priority"
        isLoading={escalating}
        error={escalateError}
        onClose={() => setConfirmEscalateTarget(null)}
        onConfirm={handleEscalate}
      >
        <p className="text-body-md text-[#172B4D]">
          This will raise the priority of <strong>{confirmEscalateTarget?.key}</strong> to <strong>High</strong> in Jira and append an operational escalation comment to the issue.
        </p>
      </ConfirmModal>
    </div>
  );
}

export function ReportsPage() {
  const { data: report, loading, error } = useReports();

  if (loading) return <div className="p-8 text-center text-[#6B778C]">Loading compliance reports...</div>;
  if (error) return <div className="p-8 text-center text-[#DE350B]">Error: {error}</div>;

  return (
    <div className="flex flex-col w-full pb-12">
      <div className="py-4">
        <h1 className="font-headline-lg text-headline-lg text-[#172B4D]">Compliance &amp; Safety Reports</h1>
        <p className="text-body-md text-[#6B778C]">Aggregated metrics across all logged Jira deviations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="jira-card p-4">
          <h2 className="font-headline-sm text-headline-sm text-[#172B4D] mb-3">Deviations by Category</h2>
          <div className="flex flex-col gap-2">
            {Object.entries(report?.byCategory || {}).map(([cat, count]) => (
              <div key={cat} className="flex justify-between py-1 border-b border-[#F4F5F7]">
                <span className="capitalize">{cat}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="jira-card p-4">
          <h2 className="font-headline-sm text-headline-sm text-[#172B4D] mb-3">Deviations by Root Cause</h2>
          <div className="flex flex-col gap-2">
            {Object.entries(report?.byRootCause || {}).map(([rc, count]) => (
              <div key={rc} className="flex justify-between py-1 border-b border-[#F4F5F7]">
                <span>{rc}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
