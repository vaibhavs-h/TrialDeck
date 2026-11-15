import Pill, { Icon } from './Pill.jsx';

const fmtDate = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString() : '');

/**
 * Per-site task matrix. Each cell is one Jira task that will be created if it stays ticked.
 * The plan is a draft: the reviewer can untick anything before approving.
 */
export default function SiteActionsMatrix({ plan, selected, onToggle, onSelectAll, onClear, disabled }) {
  const { taskTypes, sites } = plan;

  return (
    <section className="flex flex-col gap-space-sm">
      <div className="flex items-center gap-space-sm flex-wrap">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Actions per site</h2>
        <Pill tone="purple">Draft - requires human review</Pill>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant">
        One task per site for each action the changes call for. Untick anything that does not apply.
      </p>

      {!sites.length || !taskTypes.length ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-8 text-center text-outline">
          No site actions to plan.
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-outline-variant flex items-center justify-end gap-3 text-[12px]">
            <button type="button" disabled={disabled} onClick={onSelectAll} className="text-primary-container hover:underline disabled:opacity-50">
              Select all
            </button>
            <button type="button" disabled={disabled} onClick={onClear} className="text-primary-container hover:underline disabled:opacity-50">
              Clear
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-4 py-3 font-label-sm text-label-sm uppercase tracking-wider text-outline">Site</th>
                  {taskTypes.map((t) => (
                    <th key={t.type} className="px-4 py-3 font-label-sm text-label-sm uppercase tracking-wider text-outline">
                      {t.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {sites.map((s) => (
                  <tr key={s.site} className="hover:bg-surface-container-low/50">
                    <td className="px-4 py-3 font-headline-sm text-headline-sm text-on-surface whitespace-nowrap">{s.site}</td>
                    {taskTypes.map((t) => {
                      const task = s.tasks.find((x) => x.type === t.type);
                      if (!task) return <td key={t.type} className="px-4 py-3 text-outline">-</td>;
                      const on = selected.has(task.key);
                      return (
                        <td key={t.type} className="px-4 py-3">
                          <label className={`inline-flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-60' : ''}`}>
                            <input
                              type="checkbox"
                              checked={on}
                              disabled={disabled}
                              onChange={() => onToggle(task.key)}
                              aria-label={`${t.label} for ${s.site}`}
                            />
                            <span className="flex flex-col">
                              <span className={`font-body-bold text-[12px] ${on ? 'text-on-surface' : 'text-outline line-through'}`}>
                                {on ? 'Create task' : 'Skip'}
                              </span>
                              <span className="text-[11px] text-outline inline-flex items-center gap-0.5">
                                <Icon name="event" className="text-[12px]" />
                                due {fmtDate(task.dueDate)}
                              </span>
                            </span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
