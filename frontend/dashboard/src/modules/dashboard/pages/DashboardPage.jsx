import { useState } from 'react';
import { useDashboard } from '../../../hooks/useDashboard.js';
import { useSettings } from '../../../hooks/useDeviations.js';
import DashboardHeader from '../components/DashboardHeader.jsx';
import KpiRow from '../components/KpiRow.jsx';
import InsightBanner from '../components/InsightBanner.jsx';
import DeviationsBySiteChart from '../components/DeviationsBySiteChart.jsx';
import TrendChart from '../components/TrendChart.jsx';
import OverdueCapaTable from '../components/OverdueCapaTable.jsx';

export default function DashboardPage() {
  const { data, loading, error, refetch } = useDashboard();
  const { settings } = useSettings();
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedRange, setSelectedRange] = useState('90');

  if (loading) {
    return (
      <div className="p-12 text-center text-[#6B778C] flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-[32px] animate-spin text-[#0052CC]">progress_activity</span>
        <span className="font-body-md text-body-md">Loading live Jira operational dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 my-4 rounded border border-[#FFBDAD] bg-[#FFEBE6] text-[#DE350B] flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-[32px]">error</span>
        <span className="font-headline-sm text-headline-sm font-semibold">Error loading live Jira dashboard</span>
        <span className="font-body-md text-body-md">{error}</span>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-[#DE350B] text-white rounded font-body-bold text-body-bold hover:bg-[#BF2600]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-[#6B778C]">
        <p className="font-headline-sm text-headline-sm font-semibold">No protocol deviations found</p>
        <p className="font-body-md text-body-md mt-1">Create a Protocol Deviation issue in the CLIN Jira space to populate this view.</p>
      </div>
    );
  }

  const filteredBySite = selectedSite
    ? data.bySite.filter(s => s.name === selectedSite || s.id === selectedSite)
    : data.bySite;

  const filteredOverdue = selectedSite
    ? (data.overdueCapasList || []).filter(item => item.site === selectedSite)
    : (data.overdueCapasList || []);

  return (
    <div className="flex flex-col w-full pb-12">
      <DashboardHeader
        sites={data.sites || []}
        selectedSite={selectedSite}
        onSiteChange={setSelectedSite}
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        exportData={filteredOverdue}
      />
      <KpiRow
        data={{
          ...data.kpis,
          simulatedThreshold: settings?.targetThreshold ? `≤ ${settings.targetThreshold}` : data.kpis.simulatedThreshold
        }}
      />
      {data.insight && <InsightBanner insight={data.insight} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <DeviationsBySiteChart data={filteredBySite} />
        <TrendChart data={data.trend} />
      </div>
      <OverdueCapaTable data={filteredOverdue} totalOpen={data.kpis.open} />
    </div>
  );
}
