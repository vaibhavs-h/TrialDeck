import { useMemo, useState } from 'react';
import { router } from '@forge/bridge';
import Pill, { Icon } from '../components/Pill.jsx';
import SourcePicker from '../components/SourcePicker.jsx';
import ChangeCards from '../components/ChangeCards.jsx';
import SiteActionsMatrix from '../components/SiteActionsMatrix.jsx';
import ApprovalBar from '../components/ApprovalBar.jsx';
import CreatedTasks from '../components/CreatedTasks.jsx';
import ConfirmModal from '../../../components/common/ConfirmModal.jsx';
import { useMutation } from '../../../hooks/useDeviations.js';

const EMPTY_SOURCE = { pageId: '', fromVersion: '', toVersion: '', effectiveDate: '' };

// When "Create the rest" runs a second time, keep what the first run already created.
function mergeResults(prev, next) {
  if (!prev) return next;
  const createdTitles = new Set(prev.created.map((c) => c.title));
  return {
    ...next,
    created: [...prev.created, ...next.created],
    skipped: next.skipped.filter((s) => !createdTitles.has(s.title)),
    notes: [...new Set([...prev.notes, ...next.notes])],
  };
}

function Tile({ icon, label, value, hint }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-space-md shadow-sm flex items-start justify-between gap-3">
      <div>
        <div className="font-label-sm text-label-sm uppercase tracking-wider text-outline">{label}</div>
        <div className="font-headline-lg text-headline-lg text-on-surface">{value}</div>
        <div className="font-body-md text-[12px] text-on-surface-variant">{hint}</div>
      </div>
      <div className="w-9 h-9 rounded bg-surface-container-low text-primary flex items-center justify-center">
        <Icon name={icon} className="text-[20px]" />
      </div>
    </div>
  );
}

export default function AmendmentPage() {
  const [source, setSource] = useState(EMPTY_SOURCE);
  const [analysis, setAnalysis] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [result, setResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const analyze = useMutation('analyzeAmendment');
  const create = useMutation('createAmendmentTasks');

  const allKeys = useMemo(
    () => (analysis ? analysis.plan.sites.flatMap((s) => s.tasks.map((t) => t.key)) : []),
    [analysis],
  );

  // Changing the inputs invalidates any analysis, so a stale plan can never be approved.
  const updateSource = (patch) => {
    setSource((s) => ({ ...s, ...patch }));
    setAnalysis(null);
    setResult(null);
    analyze.reset();
    create.reset();
  };

  const runAnalyze = async () => {
    setResult(null);
    create.reset();
    try {
      const a = await analyze.mutate({ ...source });
      setAnalysis(a);
      setSelected(new Set(a.plan.sites.flatMap((s) => s.tasks.map((t) => t.key))));
    } catch {
      // error is shown from analyze.error
    }
  };

  const toggle = (key) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const submit = async () => {
    try {
      const res = await create.mutate({
        approved: true,
        pageId: analysis.page.id,
        fromVersion: analysis.fromVersion,
        toVersion: analysis.toVersion,
        effectiveDate: source.effectiveDate,
        selected: [...selected],
      });
      setResult((prev) => mergeResults(prev, res));
      setConfirmOpen(false);
    } catch {
      // error is shown inside the confirm dialog
    }
  };

  const reset = () => {
    setSource(EMPTY_SOURCE);
    setAnalysis(null);
    setResult(null);
    analyze.reset();
    create.reset();
  };

  const siteCount = analysis?.plan.sites.length ?? 0;
  const done = Boolean(result);

  return (
    <div className="flex flex-col w-full pb-28 gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-on-surface-variant font-body-md text-body-md">
          <a className="hover:text-on-surface transition-colors" href="#/">Projects</a>
          <span className="text-outline-variant font-code text-[11px]">/</span>
          <a className="hover:text-on-surface transition-colors" href="#/">Clinical Operations (CLIN)</a>
          <span className="text-outline-variant font-code text-[11px]">/</span>
          <span className="text-on-surface font-body-bold text-body-bold">Protocol Amendments</span>
        </nav>
        <div className="flex flex-col gap-0.5 pt-space-xs">
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Protocol Amendments</h1>
            <Pill tone="info">Confluence Sync</Pill>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Compare two protocol versions, review what changed, and create per-site Jira tasks once you approve.
          </p>
        </div>
      </div>

      <SourcePicker
        value={source}
        onChange={updateSource}
        onAnalyze={runAnalyze}
        analyzing={analyze.loading}
        analyzeError={analyze.error}
      />

      {analyze.loading && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-8 text-center text-outline">
          Reading both versions from Confluence and comparing them...
        </div>
      )}

      {analysis && !analyze.loading && (
        <>
          {analysis.warnings.map((w) => (
            <div key={w} role="status" className="p-3 bg-[#FFF0B3] border border-[#FFE380] text-[#172B4D] rounded text-[12px] flex gap-2">
              <Icon name="info" className="text-[16px]" />
              <span>{w}</span>
            </div>
          ))}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="font-body-md text-body-md text-on-surface-variant">
              Analyzing <strong className="text-on-surface">{analysis.page.title}</strong>: v{analysis.fromVersion} to v
              {analysis.toVersion}
            </div>
            {analysis.page.url && (
              <button
                type="button"
                onClick={() => router.open(analysis.page.url).catch(() => {})}
                className="text-primary-container hover:underline font-body-md text-[12px] inline-flex items-center gap-1"
              >
                <Icon name="open_in_new" className="text-[14px]" />
                Open protocol in Confluence
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            <Tile icon="difference" label="Changes detected" value={analysis.changes.length} hint={`v${analysis.fromVersion} to v${analysis.toVersion}`} />
            <Tile icon="apartment" label="Sites affected" value={siteCount} hint={analysis.sitesSource === 'site-field' ? 'From the Jira Site field' : 'From logged deviations'} />
            <Tile icon="checklist" label="Jira tasks to create" value={selected.size} hint={`of ${allKeys.length} planned`} />
          </div>

          <ChangeCards changes={analysis.changes} fromVersion={analysis.fromVersion} toVersion={analysis.toVersion} />

          <SiteActionsMatrix
            plan={analysis.plan}
            selected={selected}
            disabled={done}
            onToggle={toggle}
            onSelectAll={() => setSelected(new Set(allKeys))}
            onClear={() => setSelected(new Set())}
          />
        </>
      )}

      {result && (
        <CreatedTasks
          result={result}
          creating={create.loading}
          onCreateRemaining={submit}
          onReset={reset}
        />
      )}

      {analysis && !result && !analyze.loading && (
        <ApprovalBar
          count={selected.size}
          projectKey={analysis.projectKey}
          dueDate={analysis.dueDate}
          disabled={create.loading}
          onApprove={() => {
            create.reset();
            setConfirmOpen(true);
          }}
        />
      )}

      <ConfirmModal
        open={confirmOpen}
        title={`Create ${selected.size} Jira ${selected.size === 1 ? 'task' : 'tasks'}?`}
        message="You are approving this plan. The tasks will be created in Jira now, one per site for each action you left ticked."
        details={
          analysis
            ? [
                { label: 'Amendment', value: analysis.label },
                { label: 'Jira project', value: analysis.projectKey || 'CLIN' },
                { label: 'Sites', value: String(siteCount) },
                { label: 'Tasks', value: String(selected.size) },
                { label: 'Due date', value: new Date(`${analysis.dueDate}T00:00:00`).toLocaleDateString() },
              ]
            : []
        }
        confirmLabel="Approve and create"
        loading={create.loading}
        error={create.error}
        errorDetails={create.errorDetails}
        onConfirm={submit}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
