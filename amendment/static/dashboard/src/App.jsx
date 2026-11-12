import { useEffect, useState } from 'react';
import Shell from './components/Shell.jsx';
import DashboardHeader from './components/Dashboardheader.jsx';
import KpiRow from './components/KpiRow.jsx';
import InsightBanner from './components/InsightBanner.jsx';
import DeviationsBySiteChart from './components/DeviationsBySiteChart.jsx';
import TrendChart from './components/TrendChart.jsx';
import OverdueCapaTable from './components/OverdueCapaTable.jsx';
import AmendmentPage from './components/AmendmentPage.jsx';

// Tiny hash router: "#amendment" shows the amendment page, anything else the dashboard.
// (Plain #name hashes are what Forge allows to round-trip.)
const useHashView = () => {
  const read = () => (window.location.hash === '#amendment' ? 'amendment' : 'overview');
  const [view, setView] = useState(read);
  useEffect(() => {
    const onChange = () => setView(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return view;
};

export default function App() {
  const view = useHashView();
  return (
    <Shell>
      {view === 'amendment' ? (
        <AmendmentPage />
      ) : (
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
      )}
    </Shell>
  );
}
