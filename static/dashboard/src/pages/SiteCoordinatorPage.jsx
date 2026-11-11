import { useState } from 'react';
import SiteContextBar from '../components/coordinator/SiteContextBar.jsx';
import AmendmentBanner from '../components/coordinator/AmendmentBanner.jsx';
import CoordinatorKpiRow from '../components/coordinator/CoordinatorKpiRow.jsx';
import SiteTrendChart from '../components/coordinator/SiteTrendChart.jsx';
import MyTasksCard from '../components/coordinator/MyTasksCard.jsx';
import SiteDeviationsTable from '../components/coordinator/SiteDeviationsTable.jsx';
import ReportDeviationDrawer from '../components/coordinator/ReportDeviationDrawer.jsx';
import { initialTasks, initialDeviations } from '../components/coordinator/coordinatorData.js';

export default function SiteCoordinatorPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [deviations, setDeviations] = useState(initialDeviations);

  const pending = tasks.filter((t) => !t.done);
  const highPriority = pending.filter((t) => t.priority === 'High').length;

  const toggleTask = (id) =>
    setTasks((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const addDeviation = (form) => {
    const major = form.severity === 'major';
    const nextNumber = 121 + (deviations.length - initialDeviations.length);
    setDeviations((list) => [
      {
        id: `DEV-${nextNumber}`,
        subject: form.subjectId.trim().toUpperCase(),
        severity: major ? 'MAJOR' : 'MINOR',
        category: major ? 'GCP Safety / Consent' : 'Procedural Variance',
        status: 'Pending CRA',
        statusTone: 'grey',
        age: '0d',
      },
      ...list,
    ]);
    setDrawerOpen(false);
  };

  return (
    <div className="flex flex-col w-full pb-space-xl">
      <SiteContextBar onReport={() => setDrawerOpen(true)} />
      <AmendmentBanner />
      <CoordinatorKpiRow pendingTasks={pending.length} highPriority={highPriority} />
      <SiteTrendChart />
      <section id="tasks-section" className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        <MyTasksCard tasks={tasks} onToggle={toggleTask} />
        <SiteDeviationsTable rows={deviations} />
      </section>
      <ReportDeviationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSubmit={addDeviation} />
    </div>
  );
}