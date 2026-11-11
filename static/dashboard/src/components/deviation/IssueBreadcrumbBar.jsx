import Icon from '../Icon.jsx';

const btn =
  'h-8 px-space-sm rounded bg-surface-container-high text-on-surface font-body-bold text-body-bold hover:bg-surface-variant transition-colors flex items-center gap-1 shadow-sm';

export default function IssueBreadcrumbBar({ issueId, watchers }) {
  return (
    <div className="flex items-center justify-between py-space-sm mb-space-sm">
      <div className="flex items-center gap-space-xs font-body-md text-body-md text-secondary">
        <a href="#/" className="hover:text-primary hover:underline">Projects</a>
        <span className="text-outline-variant">/</span>
        <a href="#/" className="hover:text-primary hover:underline font-body-bold text-body-bold">ONC-101</a>
        <span className="text-outline-variant">/</span>
        <span className="font-code text-code text-on-surface">{issueId}</span>
      </div>
      <div className="flex items-center gap-space-xs">
        <button type="button" className={btn}>
          <Icon name="visibility" className="text-[16px]" />
          Watch <span className="bg-surface-container-lowest px-1.5 py-px rounded text-[11px] font-code">{watchers}</span>
        </button>
        <button type="button" className={btn}>
          <Icon name="share" className="text-[16px]" />
          Share
        </button>
        <button type="button" aria-label="More actions" className="h-8 w-8 rounded bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors flex items-center justify-center shadow-sm">
          <Icon name="more_horiz" className="text-[18px]" />
        </button>
      </div>
    </div>
  );
}