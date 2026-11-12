import Icon from '../../../components/common/Icon.jsx';

export default function IssueDetailsCard({ d }) {
  return (
    <div className="bg-surface-container-lowest rounded p-space-md shadow-sm">
      <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/60">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Details</span>
        <button type="button" aria-label="Collapse details" className="text-secondary hover:text-on-surface">
          <Icon name="expand_less" className="text-[16px]" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 pt-space-xs font-body-md text-body-md">
        <span className="text-secondary">Assignee:</span>
        <span className="font-body-bold text-body-bold text-on-surface flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-[9px] font-bold">
            {d.assignee.initials}
          </span>
          {d.assignee.name}
        </span>
        <span className="text-secondary">Reporter:</span>
        <span className="font-body-bold text-body-bold text-on-surface">{d.reporter}</span>
        <span className="text-secondary">Investigational Product:</span>
        <span className="font-body-bold text-body-bold text-on-surface">{d.product}</span>
      </div>
    </div>
  );
}