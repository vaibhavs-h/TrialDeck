import { useEffect } from 'react';
import { Icon } from './Pill.jsx';
import { hub, plannedTasks } from './executionData.js';

// Confirmation step before tasks are created in Jira. A human must confirm.
// status: idle | saving | done
export default function CreateTasksModal({ open, status = 'idle', onCancel, onConfirm }) {
  const total = plannedTasks.reduce((n, t) => n + t.count, 0);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && status !== 'saving' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, status, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-space-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-tasks-title"
        className="w-full max-w-xl bg-surface-container-lowest rounded-[4px] shadow-xl border border-outline-variant flex flex-col max-h-full overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-space-md px-space-lg pt-space-lg">
          <div className="flex flex-col gap-1">
            <h2 id="create-tasks-title" className="font-headline-md text-headline-md text-on-surface">
              Create {total} Jira tasks?
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              These tasks will be created for <span className="font-body-bold text-body-bold">{plannedTasks.length} sites</span>.
              Review the scheduled allocations before confirming.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            disabled={status === 'saving'}
            className="text-on-surface-variant hover:text-on-surface disabled:opacity-50"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="px-space-lg mt-space-md flex flex-col gap-space-md">
          <div className="flex items-center gap-space-sm bg-surface-container-low border border-outline-variant rounded-[4px] p-space-sm">
            <div className="w-6 h-6 rounded bg-primary-container text-on-primary flex items-center justify-center shrink-0">
              <Icon name="developer_board" className="text-[16px]" />
            </div>
            <div className="flex flex-wrap items-center gap-x-space-sm gap-y-1 font-body-md text-body-md text-on-surface-variant">
              <span className="font-body-bold text-body-bold text-on-surface">Project:</span>
              <span className="font-code text-code bg-surface-container px-1.5 rounded text-primary">{hub.jiraProject}</span>
              <span aria-hidden="true">•</span>
              <span>Issue type:</span>
              <span className="font-body-bold text-body-bold text-on-surface">{hub.issueType}</span>
            </div>
          </div>

          <div className="border border-outline-variant rounded-[4px] overflow-hidden">
            <div className="flex items-center justify-between bg-surface-container px-space-sm py-1.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              <span>Clinical Site &amp; Scope</span>
              <span>Generated Tasks</span>
            </div>
            <ul className="divide-y divide-outline-variant">
              {plannedTasks.map((t) => (
                <li key={t.site} className="flex items-start justify-between gap-space-md px-space-sm py-2">
                  <div className="flex flex-col">
                    <span className="font-body-bold text-body-bold text-on-surface">{t.site}</span>
                    <span className="font-body-md text-body-md text-on-surface-variant">{t.scope}</span>
                  </div>
                  <span className="shrink-0 font-label-sm text-label-sm bg-[#DEEBFF] text-[#0747A6] px-2 py-0.5 rounded-[3px]">
                    {t.count} {t.count === 1 ? 'task' : 'tasks'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="flex items-center gap-1.5 font-body-md text-body-md text-on-surface-variant">
            <Icon name="verified_user" className="text-[16px]" />
            Synchronized with 21 CFR Part 11 electronic records log.
          </p>
        </div>

        <div className="flex items-center justify-end gap-space-sm px-space-lg py-space-md">
          <button
            type="button"
            onClick={onCancel}
            disabled={status === 'saving'}
            className="h-8 px-3 rounded-[3px] hover:bg-surface-container text-on-surface font-body-bold text-body-md transition-colors disabled:opacity-50"
          >
            {status === 'done' ? 'Close' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={status !== 'idle'}
            className="h-8 px-4 rounded-[3px] bg-primary-container hover:bg-tertiary-container active:bg-primary text-on-primary font-body-bold text-body-md shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            {status === 'saving' && <Icon name="progress_activity" className="text-[16px] animate-spin" />}
            {status === 'done' ? 'Tasks queued' : 'Create tasks'}
          </button>
        </div>
      </div>
    </div>
  );
}
