import Pill, { Icon } from '../components/Pill.jsx';

export default function AmendmentPage() {
  return (
    <div className="flex flex-col w-full pb-24">
      <div className="flex flex-col gap-space-xs mb-space-md">
        <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-on-surface-variant font-body-md text-body-md">
          <a className="hover:text-on-surface transition-colors" href="#/">Projects</a>
          <span className="text-outline-variant font-code text-[11px]">/</span>
          <a className="hover:text-on-surface transition-colors" href="#/">Clinical Operations (CLIN)</a>
          <span className="text-outline-variant font-code text-[11px]">/</span>
          <span className="text-on-surface font-body-bold text-body-bold">Protocol Amendments</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pt-space-xs">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Protocol Amendments</h1>
              <Pill tone="info">Confluence Sync</Pill>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Automated protocol amendment diff &amp; operational task rollout governance.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-primary mb-4">
          <Icon name="description" className="text-[32px]" />
        </div>
        <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
          No amendment analyzed yet
        </h2>
        <p className="font-body-md text-body-md text-outline max-w-md mt-2">
          Protocol amendment analysis compares Confluence protocol document revisions against active Jira site operations. Connect your Confluence protocol space to analyze new amendments.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <a
            href="#/"
            className="h-9 px-4 bg-primary-container hover:bg-primary text-on-primary rounded font-body-bold text-body-md inline-flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Icon name="dashboard" className="text-[18px]" />
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
