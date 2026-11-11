import { kpis } from './mockData.js';

const Icon = ({ name, className }) => <span className={`material-symbols-outlined ${className}`}>{name}</span>;

function KpiCard({ title, icon, iconColor = 'text-[#6B778C]', children, footerLeft, footerRight }) {
  return (
    <div className="jira-card p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-[#6B778C]">{title}</span>
        <Icon name={icon} className={`${iconColor} text-[18px]`} />
      </div>
      <div className="my-2 flex items-baseline gap-2">{children}</div>
      <div className="text-[12px] text-[#6B778C] flex items-center justify-between pt-1 border-t border-[#F4F5F7]">
        {footerLeft}
        {footerRight}
      </div>
    </div>
  );
}

const bigNumber = 'font-display text-[32px] leading-[36px] font-semibold';

export default function KpiRow() {
  const { openDeviations, majorDeviations, overdueCapas, repeatSites } = kpis;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-space-sm">
      <KpiCard
        title="Open Deviations"
        icon="emergency"
        footerLeft={<span>Target threshold: {openDeviations.threshold}</span>}
        footerRight={<span className="text-[#DE350B] font-semibold text-[11px] uppercase">{openDeviations.label}</span>}
      >
        <span className={`${bigNumber} text-[#172B4D]`}>{openDeviations.value}</span>
        <span className="inline-flex items-center text-[12px] font-medium text-[#42526E] bg-[#EBECF0] px-1.5 py-0.5 rounded-[3px]">
          {openDeviations.weekDelta}
        </span>
      </KpiCard>

      <KpiCard
        title="Major Deviations"
        icon="warning"
        iconColor="text-[#DE350B]"
        footerLeft={<span>All unblinded studies</span>}
        footerRight={<span className="font-code text-code text-[#172B4D]">{majorDeviations.share}</span>}
      >
        <span className={`${bigNumber} text-[#172B4D]`}>{majorDeviations.value}</span>
        <span className="inline-flex items-center text-[11px] font-bold text-[#DE350B] bg-[#FFEBE6] border border-[#FFBDAD] px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider">
          Requires CAPA
        </span>
      </KpiCard>

      <KpiCard
        title="Overdue CAPAs"
        icon="schedule"
        iconColor="text-[#DE350B]"
        footerLeft={<span>Longest breach: {overdueCapas.longestBreachDays} days</span>}
        footerRight={<span className="text-[#0052CC] hover:underline cursor-pointer">Escalate →</span>}
      >
        <span className={`${bigNumber} text-[#DE350B]`}>{overdueCapas.value}</span>
        <span className="text-[12px] text-[#DE350B] font-semibold flex items-center gap-0.5">
          <Icon name="arrow_upward" className="text-[14px]" /> Action Breached
        </span>
      </KpiCard>

      <KpiCard
        title="Sites With Repeat Issues"
        icon="location_on"
        footerLeft={<span>Out of {repeatSites.activeSites} active sites</span>}
        footerRight={<span className="text-[#0052CC] font-semibold text-[11px] uppercase">Audit Queue</span>}
      >
        <span className={`${bigNumber} text-[#172B4D]`}>{repeatSites.value}</span>
        <span className="inline-flex items-center text-[11px] font-bold text-[#172B4D] bg-[#FFF0B3] border border-[#FFE380] px-1.5 py-0.5 rounded-[3px] uppercase">
          {repeatSites.sites}
        </span>
      </KpiCard>
    </div>
  );
}