import { Icon } from './Pill.jsx';
import { amendment, taskCount } from '../data/amendmentData.js';

// Sticky human-approval step: nothing is created in Jira until a reviewer approves.
export default function ApprovalBar({ onApprove, onEdit, status = 'idle' }) {
  const done = status === 'approved';
  return (
    <aside className="fixed bottom-0 left-64 right-0 z-40 bg-surface-container-lowest border-t border-outline-variant px-margin py-3 shadow-[0_-4px_12px_rgba(9,30,66,0.08)] flex flex-col sm:flex-row items-center justify-between gap-space-md">
      <div className="flex items-center gap-space-sm">
        <div className="w-6 h-6 rounded bg-primary-container text-on-primary flex items-center justify-center shrink-0">
          <Icon name="bolt" className="text-[16px]" />
        </div>
        <p className="font-body-md text-body-md text-on-surface" role="status">
          {done ? (
            <>
              <span className="font-body-bold text-body-bold">{taskCount} tasks approved.</span> They are queued for
              creation in Jira project <span className="font-code text-code bg-surface-container px-1 py-0.5 rounded">{amendment.jiraProject}</span>.
            </>
          ) : (
            <>
              <span className="font-body-bold text-body-bold">{taskCount} operational tasks</span> will be created in Jira
              project{' '}
              <span className="font-code text-code bg-surface-container px-1 py-0.5 rounded">
                {amendment.jiraProject}
              </span>{' '}
              assigned to respective Site CRAs and Data Managers.
            </>
          )}
        </p>
      </div>
      <div className="flex items-center gap-space-sm shrink-0">
        <button
          type="button"
          onClick={onEdit}
          disabled={done}
          className="h-8 px-3 rounded-[3px] bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant font-body-bold text-body-md transition-colors disabled:opacity-50"
        >
          Edit plan
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={done || status === 'saving'}
          className="h-8 px-4 rounded-[3px] bg-primary-container hover:bg-tertiary-container active:bg-primary text-on-primary font-body-bold text-body-md shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
        >
          <Icon name="done_all" className="text-[16px]" />
          {done ? 'Approved' : `Approve and create ${taskCount} tasks`}
        </button>
      </div>
    </aside>
  );
}
