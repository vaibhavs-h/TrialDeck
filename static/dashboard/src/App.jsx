import { useEffect, useState } from 'react';
import Shell from './components/Shell.jsx';
import DashboardHeader from './components/Dashboardheader.jsx';
import KpiRow from './components/KpiRow.jsx';
import InsightBanner from './components/InsightBanner.jsx';
import DeviationsBySiteChart from './components/DeviationsBySiteChart.jsx';
import TrendChart from './components/TrendChart.jsx';
import OverdueCapaTable from './components/OverdueCapaTable.jsx';
import DeviationDetailPage from './pages/DeviationDetailPage.jsx';

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

// Tiny hash router: "#/deviation/DEV-112" -> detail page, anything else -> dashboard
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
  const match = hash.match(/^#\/deviation\/([\w-]+)/);

  useEffect(() => {
    if (match) window.scrollTo(0, 0);
  }, [match?.[1]]);

  return (
    <Shell>
      {match ? <DeviationDetailPage issueId={match[1]} /> : <DashboardPage />}
    </Shell>
  );
}