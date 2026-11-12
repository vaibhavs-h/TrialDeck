import { useEffect, useState } from 'react';
import Shell from './components/Shell.jsx';
import DashboardHeader from './components/Dashboardheader.jsx'; // must match your file name exactly
import KpiRow from './components/KpiRow.jsx';
import InsightBanner from './components/InsightBanner.jsx';
import DeviationsBySiteChart from './components/DeviationsBySiteChart.jsx';
import TrendChart from './components/TrendChart.jsx';
import OverdueCapaTable from './components/OverdueCapaTable.jsx';
import DeviationDetailPage from './pages/DeviationDetailPage.jsx';
import SiteCoordinatorPage from './pages/SiteCoordinatorPage.jsx';
import AmendmentPage from '../../../amendment/static/dashboard/src/components/AmendmentPage.jsx';

// Study manager dashboard
function DashboardPage() {
  return (
    <div className="flex flex-col w-full pb-12">
      <DashboardHeader />
      <KpiRow />
      <InsightBanner />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <DeviationsBySiteChart />
        <TrendChart />
      </div>
      <OverdueCapaTable />
    </div>
  );
}

// Tiny hash router
//   #/                  -> manager dashboard
//   #/coordinator       -> site coordinator dashboard
//   #/deviation/DEV-112 -> deviation detail page
//   #/amendment         -> protocol amendment page
function useHash() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  const detail = hash.match(/^#\/deviation\/([\w-]+)$/);

  useEffect(() => {
    if (detail) window.scrollTo(0, 0);
    else if (hash === '#/capa') document.getElementById('table-section')?.scrollIntoView();
    else if (hash === '#/sites') document.getElementById('site-deviations')?.scrollIntoView();
    else if (hash === '#/tasks') document.getElementById('tasks-section')?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [hash, detail?.[1]]);

  if (detail) {
    return (
      <Shell activeSub="Deviations" activeSide="Protocol Deviations">
        <DeviationDetailPage issueId={detail[1]} />
      </Shell>
    );
  }
  if (hash === '#/coordinator' || hash === '#/sites' || hash === '#/tasks') {
    return (
      <Shell
        activeSub={hash === '#/sites' ? 'Site Directory' : 'Deviations'}
        activeSide={hash === '#/sites' ? 'Trial Sites' : 'Protocol Deviations'}
      >
        <SiteCoordinatorPage />
      </Shell>
    );
  }
  if (hash === '#/amendment') {
    return (
      <Shell activeSub="Amendments" activeSide="Protocol Amendments">
        <AmendmentPage />
      </Shell>
    );
  }
  if (hash === '#/capa') {
    return (
      <Shell activeSub="CAPA Tracker" activeSide="CAPA Register">
        <DashboardPage />
      </Shell>
    );
  }
  return <Shell><DashboardPage /></Shell>;
}