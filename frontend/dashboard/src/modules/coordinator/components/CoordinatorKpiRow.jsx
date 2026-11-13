import Icon from '../../../components/common/Icon.jsx';

function Card({ title, icon, iconColor, value, valueColor = 'text-on-surface', badge, badgeCls, note }) {
  return (
    <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col justify-between border border-outline-variant/40">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">{title}</span>
        <Icon name={icon} className={`${iconColor} text-[18px]`} />
      </div>
      <div className="flex items-baseline justify-between mt-3">
        <span className={`font-display text-[32px] leading-8 font-bold ${valueColor}`}>{value}</span>
        {badge && <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded ${badgeCls}`}>{badge}</span>}
      </div>
      <div className="mt-2 text-outline font-body-md text-body-md">{note}</div>
    </div>
  );
}

export default function CoordinatorKpiRow({ deviations = [], pendingTasks = 0, highPriority = 0, siteName }) {
  const major = deviations.filter(d => d.category === 'major').length;
  const overdue = deviations.filter(d => d.dueDate && new Date(d.dueDate) < new Date() && !d.isDone).length;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-md">
      <Card
        title={siteName ? `Open at ${siteName}` : 'Open Deviations'}
        icon="clinical_notes"
        iconColor="text-outline"
        value={deviations.length}
        badge={deviations.length > 5 ? 'High Volume' : 'Active'}
        badgeCls="bg-surface-container-high text-on-surface-variant font-semibold"
        note="Across active protocol subjects"
      />
      <Card
        title="Major Deviations"
        icon="report_problem"
        iconColor="text-error"
        value={major}
        valueColor="text-error"
        badge="Requires CAPA"
        badgeCls="bg-error-container text-on-error-container tracking-wider uppercase font-bold"
        note="GCP critical review queue"
      />
      <Card
        title="Overdue CAPAs"
        icon="pending_actions"
        iconColor="text-amber-600"
        value={overdue}
        valueColor={overdue > 0 ? 'text-amber-600' : 'text-on-surface'}
        badge={overdue > 0 ? 'Breached' : 'On Track'}
        badgeCls={overdue > 0 ? 'bg-amber-100 text-amber-900 tracking-wider font-bold' : 'bg-surface-container text-on-surface-variant'}
        note={overdue > 0 ? 'Escalation required' : 'No overdue corrective actions'}
      />
      <Card
        title="Pending Site Tasks"
        icon="fact_check"
        iconColor="text-primary"
        value={pendingTasks}
        badge={pendingTasks > 0 ? 'Action required' : 'Clear'}
        badgeCls="bg-primary-fixed text-on-primary-fixed-variant tracking-wider uppercase font-bold"
        note={`${highPriority} high priority`}
      />
    </section>
  );
}
