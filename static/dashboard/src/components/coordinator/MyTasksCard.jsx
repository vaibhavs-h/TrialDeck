import Icon from '../Icon.jsx';

const priorityCls = {
  High: 'bg-error-container text-on-error-container',
  Medium: 'bg-amber-100 text-amber-900',
  Routine: 'bg-surface-container text-on-surface-variant',
};
const statusCls = {
  'In Progress': 'bg-surface-container-highest text-tertiary',
  'Pending Review': 'bg-amber-50 text-amber-900',
  Scheduled: 'bg-surface-container text-outline',
};

export default function MyTasksCard({ tasks, onToggle }) {
  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <div className="lg:col-span-6 bg-surface-container-lowest rounded-lg shadow-sm p-space-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-space-sm mb-space-sm">
          <div className="flex items-center gap-space-xs">
            <Icon name="checklist" className="text-primary text-[20px]" />
            <h3 className="font-headline-sm text-headline-sm text-on-surface">My tasks — Site 02</h3>
          </div>
          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
            {remaining} remaining
          </span>
        </div>
        <p className="font-body-md text-body-md text-outline mb-space-md">Required compliance and protocol execution checkpoints</p>

        <div className="flex flex-col gap-space-sm">
          {tasks.map((t) => (
            <div key={t.id} className="p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-colors flex items-start gap-space-sm">
              <input
                id={t.id}
                type="checkbox"
                checked={t.done}
                onChange={() => onToggle(t.id)}
                className="mt-1 w-4 h-4 rounded bg-surface-container-lowest text-primary cursor-pointer accent-primary"
              />
              <div className={`flex-1 min-w-0 ${t.done ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between gap-space-xs">
                  <label htmlFor={t.id} className={`font-body-bold text-body-bold text-on-surface cursor-pointer ${t.done ? 'line-through' : ''}`}>
                    {t.title}
                  </label>
                  <span className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded font-bold uppercase ${priorityCls[t.priority]}`}>{t.priority}</span>
                </div>
                <p className="font-body-md text-body-md text-outline mt-0.5">{t.detail}</p>
                <div className="flex items-center gap-space-md mt-2 text-outline font-body-md text-body-md">
                  <span className="flex items-center gap-1">
                    <Icon name="event" className="text-[14px]" /> Due: {t.due}
                  </span>
                  <span className={`font-label-sm text-label-sm px-1.5 py-px rounded ${statusCls[t.status]}`}>{t.status}</span>
                  <a href={`#/deviation/${t.ref}`} className="font-code text-code text-primary hover:underline">{t.ref}</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-space-md mt-space-md">
        <a href="#" className="font-body-bold text-body-bold text-primary hover:text-primary-container inline-flex items-center gap-1 transition-colors">
          View all site tasks in Jira
          <Icon name="open_in_new" className="text-[16px]" />
        </a>
      </div>
    </div>
  );
}