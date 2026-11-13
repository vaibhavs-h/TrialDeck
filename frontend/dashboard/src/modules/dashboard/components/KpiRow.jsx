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

export default function KpiRow({ data }) {
  if (!data) return null;

  const { open = 0, major = 0, overdueCapas = 0, repeatSites = { sites: '', activeSites: 0 }, simulatedThreshold = '≤ 15', simulatedDelta = 'Normal' } = data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-space-sm">
      <KpiCard
        title="Open Deviations"
        icon="emergency"
        footerLeft={<span>Target threshold: {simulatedThreshold}</span>}
        footerRight={<span className="text-[#DE350B] font-semibold text-[11px] uppercase">{simulatedDelta}</span>}
      >
        <span className={`${bigNumber} text-[#172B4D]`}>{open}</span>
      </KpiCard>

      <KpiCard
        title="Major Deviations"
        icon="warning"
        iconColor="text-[#DE350B]"
        footerLeft={<span>All protocol studies</span>}
      >
        <span className={`${bigNumber} text-[#172B4D]`}>{major}</span>
        <span className="inline-flex items-center text-[11px] font-bold text-[#DE350B] bg-[#FFEBE6] border border-[#FFBDAD] px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider">
          Requires CAPA
        </span>
      </KpiCard>

      <KpiCard
        title="Overdue CAPAs"
        icon="schedule"
        iconColor="text-[#DE350B]"
        footerLeft={<span>Longest breach: {overdueCapas} days</span>}
        footerRight={<a href="#/capa" className="text-[#0052CC] hover:underline cursor-pointer">Escalate →</a>}
      >
        <span className={`${bigNumber} text-[#DE350B]`}>{overdueCapas > 0 ? overdueCapas : 0}</span>
        <span className="text-[12px] text-[#DE350B] font-semibold flex items-center gap-0.5">
          <Icon name="arrow_upward" className="text-[14px]" /> {overdueCapas > 0 ? 'Action Breached' : 'On Track'}
        </span>
      </KpiCard>

      <KpiCard
        title="Sites With Repeat Issues"
        icon="location_on"
        footerLeft={<span>Out of {repeatSites.activeSites} active sites</span>}
        footerRight={<a href="#/sites" className="text-[#0052CC] font-semibold text-[11px] uppercase">Audit Queue</a>}
      >
        <span className={`${bigNumber} text-[#172B4D]`}>{repeatSites.sites ? repeatSites.sites.split(',').filter(Boolean).length : 0}</span>
        <span className="inline-flex items-center text-[11px] font-bold text-[#172B4D] bg-[#FFF0B3] border border-[#FFE380] px-1.5 py-0.5 rounded-[3px] uppercase truncate max-w-[120px]">
          {repeatSites.sites || 'None'}
        </span>
      </KpiCard>
    </div>
  );
}
