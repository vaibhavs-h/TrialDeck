import Icon from '../../../components/common/Icon.jsx';

const priorityCls = {
  High: 'bg-error-container text-on-error-container',
  Medium: 'bg-amber-100 text-amber-900',
  Routine: 'bg-surface-container text-on-surface-variant',
  Low: 'bg-surface-container text-on-surface-variant',
};
const statusCls = {
  'In Progress': 'bg-surface-container-highest text-tertiary',
  'Pending Review': 'bg-amber-50 text-amber-900 border border-amber-200/50',
  'Scheduled': 'bg-surface-container text-outline',
  'Done': 'bg-green-100 text-green-800',
  'Closed': 'bg-green-100 text-green-800',
};

export default function MyTasksCard({ tasks = [], onToggle, siteName }) {
  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <div className="lg:col-span-6 bg-surface-container-lowest rounded-lg shadow-sm p-space-md flex flex-col justify-between border border-outline-variant/40">
      <div>
        <div className="flex items-center justify-between pb-space-sm mb-space-sm">
          <div className="flex items-center gap-space-xs">
            <Icon name="checklist" className="text-primary text-[20px]" />
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Tasks {siteName ? `— ${siteName}` : ''}
            </h3>
          </div>
          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold">
            {remaining} remaining
          </span>
        </div>
        <p className="font-body-md text-body-md text-outline mb-space-md">Required compliance and protocol execution checkpoints</p>

        {tasks.length === 0 ? (
          <div className="py-8 text-center text-[#6B778C] font-body-md text-body-md">
            No pending tasks for this site.
          </div>
        ) : (
          <div className="flex flex-col gap-space-sm">
            {tasks.map((t) => (
              <div key={t.id} className="p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-colors flex items-start gap-space-sm border border-outline-variant/30">
                <input
                  id={t.id}
                  type="checkbox"
                  checked={t.done}
                  onChange={() => onToggle?.(t.id)}
                  className="mt-1 w-4 h-4 rounded bg-surface-container-lowest text-primary cursor-pointer accent-primary"
                />
                <div className={`flex-1 min-w-0 ${t.done ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between gap-space-xs">
                    <label htmlFor={t.id} className={`font-body-bold text-body-bold text-on-surface cursor-pointer ${t.done ? 'line-through' : ''}`}>
                      {t.title}
                    </label>
                    <span className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded font-bold uppercase ${priorityCls[t.priority] || priorityCls.Routine}`}>
                      {t.priority}
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-outline mt-0.5">{t.detail}</p>
                  <div className="flex items-center gap-space-md mt-2 text-outline font-body-md text-body-md flex-wrap">
                    <span className="flex items-center gap-1">
                      <Icon name="event" className="text-[14px]" /> Due: {t.due}
                    </span>
                    <span className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded font-semibold ${statusCls[t.status] || 'bg-surface-container text-outline'}`}>
                      {t.status}
                    </span>
                    {t.ref && (
                      <a href={`#/deviation/${t.ref}`} className="font-code text-code text-primary font-medium hover:underline">
                        {t.ref}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-space-md mt-space-md border-t border-outline-variant/40">
        <a href="#/tasks" className="font-body-bold text-body-bold text-primary hover:text-primary-container inline-flex items-center gap-1 transition-colors">
          View all site tasks
          <Icon name="open_in_new" className="text-[16px]" />
        </a>
      </div>
    </div>
  );
}
