import DashboardHeader from '../components/DashboardHeader.jsx';
import KpiRow from '../components/KpiRow.jsx';
import InsightBanner from '../components/InsightBanner.jsx';
import DeviationsBySiteChart from '../components/DeviationsBySiteChart.jsx';
import TrendChart from '../components/TrendChart.jsx';
import OverdueCapaTable from '../components/OverdueCapaTable.jsx';

// Study manager dashboard
export default function DashboardPage() {
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
