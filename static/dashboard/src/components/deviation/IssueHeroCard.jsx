import Icon from '../Icon.jsx';

const smallBtn =
  'h-7 px-2.5 rounded bg-surface-container-high hover:bg-surface-variant font-label-md text-label-md text-on-surface transition-colors flex items-center gap-1';

export default function IssueHeroCard({ d }) {
  return (
    <div className="bg-surface-container-lowest rounded p-space-lg shadow-sm">
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <Icon name="error" className="text-error text-[18px]" />
            <span className="font-code text-code text-secondary">{d.id}</span>
            <span className="text-outline-variant font-code text-code">·</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">{d.type}</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <button type="button" className={smallBtn}><Icon name="attach_file" className="text-[14px]" /> Attach</button>
            <button type="button" className={smallBtn}><Icon name="link" className="text-[14px]" /> Link issue</button>
            <button type="button" className={smallBtn}><Icon name="add_task" className="text-[14px]" /> Subtask</button>
          </div>
        </div>

        <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">{d.title}</h1>

        <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {d.status}
          </div>
          <div className="h-4 w-px bg-outline-variant" />
          <div className="flex items-center gap-1.5 text-secondary font-body-md text-body-md">
            <Icon name="priority_high" className="text-[16px]" />
            <span>Priority:</span>
            <span className="font-body-bold text-body-bold text-on-surface">{d.priority}</span>
          </div>
          <div className="h-4 w-px bg-outline-variant" />
          <div className="flex items-center gap-1.5 text-secondary font-body-md text-body-md">
            <Icon name="verified_user" className="text-[16px]" />
            <span>Resolution:</span>
            <span className="font-body-bold text-body-bold text-on-surface">{d.resolution}</span>
          </div>
        </div>
      </div>

      <div className="mt-space-lg pt-space-md border-t border-outline-variant/60">
        <h2 className="font-label-sm text-label-sm uppercase tracking-wider text-secondary mb-space-xs">Description</h2>
        <div className="font-body-lg text-body-lg text-on-surface space-y-space-sm leading-relaxed">
          <p>
            During the Cycle 2 Day 1 clinical visit, participant{' '}
            <span className="font-code text-code px-1.5 py-0.5 rounded bg-surface-container text-primary font-bold">{d.subject}</span>{' '}
            was re-consented using protocol informed consent documentation{' '}
            <span className="font-code text-code">{d.consentUsed}</span> instead of the institutional review board approved{' '}
            <span className="font-code text-code">{d.consentRequired}</span> (amendment effective {d.amendmentDate}).
          </p>
          <p className="text-secondary font-body-md text-body-md">
            The participant proceeded with escalated cohort dosing (60mg BID). Site CRA flagged the discrepancy during routine
            source data verification (SDV). An expedited notification was submitted to the principal investigator and the trial
            safety review committee.
          </p>
        </div>
      </div>

      <div className="mt-space-md p-space-sm rounded bg-surface-container-low flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-1 text-secondary font-body-md text-body-md">
            <Icon name="clinical_notes" className="text-[16px] text-primary" />
            <span>Therapeutic Area:</span>
            <span className="font-body-bold text-body-bold text-on-surface">{d.therapeuticArea}</span>
          </div>
          <div className="flex items-center gap-1 text-secondary font-body-md text-body-md">
            <Icon name="location_city" className="text-[16px] text-primary" />
            <span>Site:</span>
            <span className="font-body-bold text-body-bold text-on-surface">{d.siteName}</span>
          </div>
        </div>
        <span className="font-code text-[11px] text-outline">GCP REF: {d.gcpRef}</span>
      </div>
    </div>
  );
}