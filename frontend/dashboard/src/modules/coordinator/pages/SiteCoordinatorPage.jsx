import { useState } from 'react';
import { useDeviations, useSiteTasks, useMutation } from '../../../hooks/useDeviations.js';
import SiteContextBar from '../components/SiteContextBar.jsx';
import AmendmentBanner from '../components/AmendmentBanner.jsx';
import CoordinatorKpiRow from '../components/CoordinatorKpiRow.jsx';
import SiteTrendChart from '../components/SiteTrendChart.jsx';
import MyTasksCard from '../components/MyTasksCard.jsx';
import SiteDeviationsTable from '../components/SiteDeviationsTable.jsx';
import ReportDeviationDrawer from '../components/ReportDeviationDrawer.jsx';
import ConfirmModal from '../../../components/common/ConfirmModal.jsx';

export default function SiteCoordinatorPage() {
  const [siteFilter, setSiteFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [daysFilter, setDaysFilter] = useState('90');

  const { data, loading, error, refetch: refetchDeviations } = useDeviations(siteFilter, daysFilter, categoryFilter);
  const { data: tasksData, refetch: refetchTasks } = useSiteTasks(siteFilter);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [taskToToggle, setTaskToToggle] = useState(null);

  const { execute: doTransition, loading: transitioning, error: transitionError } = useMutation('transitionIssue');

  if (loading) {
    return (
      <div className="p-12 text-center text-[#6B778C] flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-[32px] animate-spin text-[#0052CC]">progress_activity</span>
        <span className="font-body-md text-body-md">Loading live site coordinator records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 my-4 rounded border border-[#FFBDAD] bg-[#FFEBE6] text-[#DE350B] flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-[32px]">error</span>
        <span className="font-headline-sm text-headline-sm font-semibold">Error loading deviations</span>
        <span className="font-body-md text-body-md">{error}</span>
        <button
          type="button"
          onClick={() => refetchDeviations()}
          className="mt-2 px-4 py-2 bg-[#DE350B] text-white rounded font-body-bold text-body-bold hover:bg-[#BF2600]"
        >
          Retry
        </button>
      </div>
    );
  }

  const deviations = data?.deviations || [];
  const allSites = data?.allSites || [];
  const tasks = tasksData || [];
  const pending = tasks.filter((t) => !t.done);
  const highPriority = pending.filter((t) => t.priority === 'High').length;

  const handleConfirmToggleTask = async () => {
    if (!taskToToggle) return;
    const targetStatus = taskToToggle.done ? 'To Do' : 'Done';
    try {
      await doTransition({ issueKey: taskToToggle.id, targetStatus });
      setTaskToToggle(null);
      refetchTasks();
    } catch (err) {
      console.error('Failed to transition task', err);
    }
  };

  return (
    <div className="flex flex-col w-full pb-space-xl">
      <SiteContextBar
        onReport={() => setDrawerOpen(true)}
        sites={allSites}
        selectedSite={siteFilter}
        onSelectSite={setSiteFilter}
        selectedCategory={categoryFilter}
        onSelectCategory={setCategoryFilter}
        selectedRange={daysFilter}
        onRangeChange={setDaysFilter}
      />
      <AmendmentBanner alert={null} />
      <CoordinatorKpiRow
        deviations={deviations}
        pendingTasks={pending.length}
        highPriority={highPriority}
        siteName={siteFilter}
      />
      <SiteTrendChart trend={data?.trend} siteName={siteFilter} />
      <section id="tasks-section" className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        <MyTasksCard
          tasks={tasks}
          siteName={siteFilter}
          onToggle={(id) => {
            const t = tasks.find(item => item.id === id);
            if (t) setTaskToToggle(t);
          }}
        />
        <SiteDeviationsTable rows={deviations} />
      </section>
      <ReportDeviationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        siteName={siteFilter}
        sites={allSites}
        onSubmit={() => {
          refetchDeviations();
          refetchTasks();
        }}
      />

      <ConfirmModal
        isOpen={Boolean(taskToToggle)}
        title={`${taskToToggle?.done ? 'Reopen' : 'Complete'} Task: ${taskToToggle?.id}`}
        confirmLabel={`Transition to ${taskToToggle?.done ? 'To Do' : 'Done'}`}
        isLoading={transitioning}
        error={transitionError}
        onClose={() => setTaskToToggle(null)}
        onConfirm={handleConfirmToggleTask}
      >
        <p className="text-body-md text-[#172B4D]">
          This will update the live Jira task <strong>{taskToToggle?.id}</strong> ({taskToToggle?.title}) to <strong>{taskToToggle?.done ? 'To Do' : 'Done'}</strong>.
        </p>
      </ConfirmModal>
    </div>
  );
}
