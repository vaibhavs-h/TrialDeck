import Icon from '../../../components/common/Icon.jsx';

export default function IssueBreadcrumbBar({ issueId }) {
  return (
    <div className="flex items-center justify-between pb-space-md text-on-surface-variant font-body-md text-body-md">
      <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs flex-wrap">
        <a href="#/" className="hover:text-on-surface transition-colors">Projects</a>
        <span className="text-outline-variant font-code text-[11px]">/</span>
        <a href="#/" className="hover:text-on-surface transition-colors">Clinical Operations (CLIN)</a>
        <span className="text-outline-variant font-code text-[11px]">/</span>
        <a href="#/coordinator" className="hover:text-on-surface transition-colors">Protocol Deviations</a>
        <span className="text-outline-variant font-code text-[11px]">/</span>
        <span className="text-on-surface font-code text-code font-bold">{issueId}</span>
      </nav>

      <div className="flex items-center gap-space-sm text-outline font-label-sm text-label-sm">
        <a
          href="#/coordinator"
          className="hover:text-on-surface flex items-center gap-1 transition-colors text-primary"
        >
          <Icon name="arrow_back" className="text-[16px]" /> Back to deviations
        </a>
      </div>
    </div>
  );
}
