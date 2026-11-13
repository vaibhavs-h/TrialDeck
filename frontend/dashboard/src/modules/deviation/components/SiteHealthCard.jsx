import Icon from '../../../components/common/Icon.jsx';

export default function SiteHealthCard({ siteName, deviationCount = 0 }) {
  const complianceScore = Math.max(70, Math.min(100, 100 - (deviationCount * 3)));

  return (
    <div className="bg-surface-container-lowest rounded p-space-md shadow-sm">
      <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/60">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
          {siteName || 'Site'} Metrics
        </span>
        <Icon name="info" className="text-outline text-[16px]" />
      </div>
      <div className="flex flex-col gap-2 pt-space-xs">
        <div className="flex justify-between font-body-md text-body-md">
          <span className="text-secondary">Protocol Health Index</span>
          <span className="font-body-bold text-body-bold text-on-surface">{complianceScore}%</span>
        </div>
        <div className="w-full bg-surface-container h-1.5 rounded overflow-hidden">
          <div
            className={`h-full ${complianceScore < 85 ? 'bg-amber-500' : 'bg-primary'}`}
            style={{ width: `${complianceScore}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-secondary pt-1">
          <span>Active Deviations: <strong className="text-on-surface">{deviationCount}</strong></span>
          <span>Status: <strong className="text-on-surface">{deviationCount > 5 ? 'Audit Review' : 'Nominal'}</strong></span>
        </div>
      </div>
    </div>
  );
}
