import { Icon } from './Pill.jsx';

/** Sticky bar at the bottom: the explicit human approval step before anything is written to Jira. */
export default function ApprovalBar({ count, projectKey, dueDate, disabled, onApprove }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-[1400px] mx-auto px-4 pb-4 flex justify-end">
        <div className="pointer-events-auto bg-surface-container-lowest border border-outline-variant shadow-xl rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 max-w-3xl">
          <div className="w-9 h-9 rounded bg-primary-container text-on-primary flex items-center justify-center shrink-0">
            <Icon name="bolt" className="text-[20px]" />
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            <strong className="text-on-surface">
              {count} {count === 1 ? 'task' : 'tasks'}
            </strong>{' '}
            will be created in Jira
            {projectKey ? (
              <>
                {' '}project <code className="font-code bg-surface-container px-1 rounded">{projectKey}</code>
              </>
            ) : null}
            {dueDate ? `, due ${new Date(`${dueDate}T00:00:00`).toLocaleDateString()}` : ''}. Nothing is created until you
            approve.
          </p>
          <button
            type="button"
            disabled={disabled || count === 0}
            onClick={onApprove}
            className="h-9 px-4 bg-primary-container hover:bg-primary text-on-primary rounded font-body-bold text-body-md inline-flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="done_all" className="text-[18px]" />
            Approve and create {count} {count === 1 ? 'task' : 'tasks'}
          </button>
        </div>
      </div>
    </div>
  );
}
