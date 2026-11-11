import Icon from '../Icon.jsx';
import { kpis } from './coordinatorData.js';

function Card({ title, icon, iconColor, value, valueColor = 'text-on-surface', badge, badgeCls, note }) {
  return (
    <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col justify-between border border-outline-variant/40">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">{title}</span>
        <Icon name={icon} className={`${iconColor} text-[18px]`} />
      </div>
      <div className="flex items-baseline justify-between mt-3">
        <span className={`font-display text-[32px] leading-8 font-bold ${valueColor}`}>{value}</span>
        <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded ${badgeCls}`}>{badge}</span>
      </div>
      <div className="mt-2 text-outline font-body-md text-body-md">{note}</div>
    </div>
  );
}

export default function CoordinatorKpiRow({ pendingTasks, highPriority }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-md">
      <Card
        title="Open at my site" icon="clinical_notes" iconColor="text-outline"
        value={kpis.openAtSite.value}
        badge={kpis.openAtSite.delta} badgeCls="bg-surface-container-high text-on-surface-variant font-semibold"
        note={kpis.openAtSite.note}
      />
      <Card
        title="Major" icon="report_problem" iconColor="text-error"
        value={kpis.major.value} valueColor="text-error"
        badge="Requires CAPA" badgeCls="bg-error-container text-on-error-container tracking-wider uppercase font-bold"
        note={kpis.major.note}
      />
      <Card
        title="My overdue CAPAs" icon="pending_actions" iconColor="text-amber-600"
        value={kpis.overdueCapas.value}
        badge={kpis.overdueCapas.badge} badgeCls="bg-amber-100 text-amber-900 tracking-wider font-bold"
        note={kpis.overdueCapas.note}
      />
      <Card
        title="My pending tasks" icon="fact_check" iconColor="text-primary"
        value={pendingTasks}
        badge="Action required" badgeCls="bg-primary-fixed text-on-primary-fixed-variant tracking-wider uppercase font-bold"
        note={`${highPriority} high priority`}
      />
    </section>
  );
}