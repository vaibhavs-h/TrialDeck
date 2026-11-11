import Icon from '../Icon.jsx';
import { site } from './coordinatorData.js';

export default function SiteContextBar({ onReport }) {
  return (
    <section className="w-full bg-surface-container-lowest rounded-lg shadow-sm mb-space-md p-space-md">
      <div className="flex flex-wrap items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md flex-wrap">
          <div className="flex items-center gap-space-sm">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-on-primary">
              <Icon name="domain" className="text-[18px]" />
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm text-on-surface">Site Operations</span>
              <span className="font-code text-code text-outline">/</span>
              <span className="font-body-bold text-body-bold text-primary">Coordinator Desk</span>
            </div>
          </div>

          <div className="h-4 w-px bg-surface-container-highest" />

          <div className="flex items-center gap-space-xs px-2.5 py-1 bg-surface-container-low rounded border border-outline-variant text-on-surface">
            <Icon name="pin_drop" className="text-[16px] text-primary" />
            <span className="font-body-bold text-body-bold">{site.title}</span>
            <span className="font-label-sm text-label-sm text-outline ml-1 uppercase">{site.institution}</span>
          </div>

          <button type="button" className="h-8 px-2.5 bg-surface-container-low hover:bg-surface-container-high rounded text-on-surface font-body-md text-body-md flex items-center gap-space-xs transition-colors">
            <Icon name="calendar_today" className="text-[16px] text-outline" />
            <span>Last 90 days</span>
            <Icon name="arrow_drop_down" className="text-[16px] text-outline" />
          </button>
        </div>

        <div className="flex items-center gap-space-sm">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-secondary-container text-on-surface rounded font-label-sm text-label-sm uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {site.protocolBadge}
          </div>
          <button
            type="button"
            onClick={onReport}
            className="h-8 px-3.5 bg-primary-container hover:bg-primary text-on-primary rounded font-headline-sm text-headline-sm flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Icon name="add" className="text-[18px]" />
            Report deviation
          </button>
        </div>
      </div>
    </section>
  );
}