import { router } from '@forge/bridge';
import Pill, { Icon } from './Pill.jsx';

const openIssue = (key) => router.open(`/browse/${key}`).catch(() => {});

/** Outcome of an approval: what was created, skipped as duplicate, failed, or is still pending. */
export default function CreatedTasks({ result, onCreateRemaining, creating, onReset }) {
  const { created, skipped, failed, pending, notes, projectKey } = result;

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-space-lg shadow-sm flex flex-col gap-space-md">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-space-sm">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${failed.length ? 'bg-[#FFF0B3] text-[#172B4D]' : 'bg-[#E3FCEF] text-[#006644]'}`}>
            <Icon name={failed.length ? 'warning' : 'check_circle'} className="text-[22px]" />
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              {created.length} {created.length === 1 ? 'task' : 'tasks'} created in {projectKey}
            </h2>
            <p className="font-body-md text-[12px] text-outline">
              {skipped.length ? `${skipped.length} already existed and were skipped. ` : ''}
              {failed.length ? `${failed.length} failed. ` : ''}
              {pending.length ? `${pending.length} still to create.` : ''}
            </p>
          </div>
        </div>
        <button type="button" onClick={onReset} className="h-9 px-3 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-body-bold text-body-md">
          Analyze another amendment
        </button>
      </div>

      {notes.map((n) => (
        <div key={n} className="p-3 bg-[#FFF0B3] border border-[#FFE380] text-[#172B4D] rounded text-[12px] flex gap-2">
          <Icon name="info" className="text-[16px]" />
          <span>{n}</span>
        </div>
      ))}

      {created.length > 0 && (
        <ul className="divide-y divide-outline-variant border border-outline-variant rounded">
          {created.map((t) => (
            <li key={t.key} className="px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <button type="button" onClick={() => openIssue(t.key)} className="font-code text-code text-primary-container font-semibold hover:underline">
                  {t.key}
                </button>
                <span className="font-body-md text-body-md text-on-surface truncate">{t.title}</span>
              </div>
              <Pill tone="success">Created</Pill>
            </li>
          ))}
        </ul>
      )}

      {failed.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="font-headline-sm text-headline-sm text-[#DE350B]">Could not create</h3>
          {failed.map((t) => (
            <div key={`${t.site}|${t.type}`} role="alert" className="p-3 bg-[#FFEBE6] border border-[#FFBDAD] text-[#DE350B] rounded text-[12px]">
              <strong>
                {t.site} - {t.typeLabel}:
              </strong>{' '}
              {t.error}
            </div>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="p-3 bg-[#DEEBFF] border border-[#B3D4FF] text-[#0747A6] rounded text-[12px] flex items-center justify-between gap-3 flex-wrap">
          <span>
            {pending.length} {pending.length === 1 ? 'task was' : 'tasks were'} not created before the time limit. Creating the
            rest will not duplicate the ones above.
          </span>
          <button
            type="button"
            disabled={creating}
            onClick={onCreateRemaining}
            className="h-8 px-3 rounded bg-primary-container text-on-primary font-body-bold text-[12px] disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create the rest'}
          </button>
        </div>
      )}
    </section>
  );
}
