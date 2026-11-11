import Icon from '../Icon.jsx';
import { siteHealth } from './deviationData.js';

export default function SiteHealthCard() {
  const { title, score, openQueries, lastVisit } = siteHealth;
  return (
    <div className="bg-surface-container-lowest rounded p-space-md shadow-sm">
      <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/60">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">{title}</span>
        <Icon name="info" className="text-outline text-[16px]" />
      </div>
      <div className="flex flex-col gap-2 pt-space-xs">
        <div className="flex justify-between font-body-md text-body-md">
          <span className="text-secondary">IRB Compliance Score</span>
          <span className="font-body-bold text-body-bold text-on-surface">{score}%</span>
        </div>
        <div className="w-full bg-surface-container h-1.5 rounded overflow-hidden">
          <div className="bg-primary h-full" style={{ width: `${score}%` }} />
        </div>
        <div className="flex justify-between items-center text-[11px] text-secondary pt-1">
          <span>Open queries: <strong className="text-on-surface">{openQueries}</strong></span>
          <span>Last CRA visit: <strong className="text-on-surface">{lastVisit}</strong></span>
        </div>
      </div>
    </div>
  );
}