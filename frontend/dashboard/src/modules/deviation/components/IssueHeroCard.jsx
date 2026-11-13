import Icon from '../../../components/common/Icon.jsx';

export default function IssueHeroCard({ d }) {
  if (!d) return null;

  return (
    <div className="bg-surface-container-lowest rounded p-space-lg shadow-sm">
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <Icon name="error" className="text-error text-[18px]" />
            <span className="font-code text-code text-secondary font-bold">{d.key}</span>
            <span className="text-outline-variant font-code text-code">·</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Protocol Deviation</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="font-code text-code text-outline text-[12px]">
              Logged: {d.created ? new Date(d.created).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
          {d.summary}
        </h1>

        <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold uppercase tracking-wider">
            <span className={`w-1.5 h-1.5 rounded-full ${d.isDone ? 'bg-green-600' : 'bg-primary'}`} />
            {d.status}
          </div>
          <div className="h-4 w-px bg-outline-variant" />
          <div className="flex items-center gap-1.5 text-secondary font-body-md text-body-md">
            <Icon name="priority_high" className="text-[16px]" />
            <span>Severity:</span>
            <span className="font-body-bold text-body-bold text-on-surface uppercase">{d.category}</span>
          </div>
          <div className="h-4 w-px bg-outline-variant" />
          <div className="flex items-center gap-1.5 text-secondary font-body-md text-body-md">
            <Icon name="verified_user" className="text-[16px]" />
            <span>Subject ID:</span>
            <span className="font-code text-code font-bold text-primary">{d.subjectId}</span>
          </div>
        </div>
      </div>

      <div className="mt-space-lg pt-space-md border-t border-outline-variant/60">
        <h2 className="font-label-sm text-label-sm uppercase tracking-wider text-secondary mb-space-xs">Deviation Summary &amp; Protocol Context</h2>
        <div className="font-body-lg text-body-lg text-on-surface space-y-space-sm leading-relaxed">
          <p>
            Protocol deviation recorded for participant{' '}
            <span className="font-code text-code px-1.5 py-0.5 rounded bg-surface-container text-primary font-bold">{d.subjectId}</span>{' '}
            at trial site{' '}
            <span className="font-body-bold text-body-bold text-on-surface">{d.site}</span> under protocol version{' '}
            <span className="font-code text-code px-1.5 py-0.5 rounded bg-surface-container font-semibold">{d.protocolVersion}</span>.
          </p>
          <p className="text-secondary font-body-md text-body-md">
            Root Cause / Clinical Note: <strong>{d.rootCause}</strong>. Date detected: {d.dateDetected ? new Date(d.dateDetected).toLocaleDateString() : 'Recorded on intake'}.
          </p>
        </div>
      </div>

      <div className="mt-space-md p-space-sm rounded bg-surface-container-low flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-md flex-wrap">
          <div className="flex items-center gap-1 text-secondary font-body-md text-body-md">
            <Icon name="location_city" className="text-[16px] text-primary" />
            <span>Site:</span>
            <span className="font-body-bold text-body-bold text-on-surface">{d.site}</span>
          </div>
          <div className="flex items-center gap-1 text-secondary font-body-md text-body-md">
            <Icon name="event" className="text-[16px] text-primary" />
            <span>Target Due Date:</span>
            <span className="font-body-bold text-body-bold text-on-surface">
              {d.dueDate ? new Date(d.dueDate).toLocaleDateString() : 'Not set'}
            </span>
          </div>
        </div>
        <span className="font-code text-[11px] text-outline">GCP REF: ICH-E6(R2)</span>
      </div>
    </div>
  );
}
