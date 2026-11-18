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
  const [hideSampleData, setHideSampleData] = useState(false);

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

  // Work type missing state
  if (data?.workTypeMissing) {
    return (
      <div className="my-8 p-8 max-w-2xl mx-auto rounded-lg border border-[#FFE380] bg-[#FFFAE6] text-[#172B4D] shadow-sm flex flex-col items-center text-center gap-3">
        <span className="material-symbols-outlined text-[48px] text-[#FFAB00]">clinical_notes</span>
        <h2 className="font-headline-lg font-bold">Protocol Deviation Work Type Not Found</h2>
        <p className="font-body-md text-[#42526E] leading-relaxed">
          The <strong>Protocol Deviation</strong> issue type has not been created on this Jira site yet.
          To set up your site in 5 minutes with our sample tickets and required custom fields, see our setup guide.
        </p>
        <a
          href="https://github.com/vaibhavs-h/TrialDeck/blob/main/SETUP.md"
          target="_blank"
          rel="noreferrer"
          className="mt-3 px-5 py-2.5 bg-[#0052CC] hover:bg-[#0065FF] text-white rounded font-body-bold transition-colors inline-flex items-center gap-2"
        >
          <span>View SETUP.md Guide</span>
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
        </a>
      </div>
    );
  }

  if (!data || (data.isSampleData && hideSampleData)) {
    return (
      <div className="p-12 text-center text-[#6B778C]">
        <p className="font-headline-sm text-headline-sm font-semibold">No protocol deviations found</p>
        <p className="font-body-md text-body-md mt-1">Create a Protocol Deviation issue in your Jira space to populate this view.</p>
        {hideSampleData && (
          <button
            type="button"
            onClick={() => setHideSampleData(false)}
            className="mt-4 px-4 py-2 bg-[#0052CC] text-white rounded text-sm font-medium"
          >
            Show Sample Data Mode
          </button>
        )}
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
      {data.isSampleData && (
        <div className="mb-4 p-4 rounded-md bg-[#DEEBFF] border border-[#B3D4FF] text-[#0747A6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px] text-[#0052CC]">biotech</span>
            <div>
              <span className="font-headline-sm font-bold block">Sample Data Mode Active</span>
              <span className="font-body-md text-[13px] text-[#172B4D]">
                Showing 12 realistic synthetic clinical protocol deviations across 6 sites. Create real tickets in Jira to see your live data automatically.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setHideSampleData(true)}
            className="px-3 py-1.5 bg-white hover:bg-[#F4F5F7] border border-[#B3D4FF] rounded text-[12px] font-semibold text-[#0052CC] shrink-0"
          >
            Hide Sample Data
          </button>
        </div>
      )}

      {data.fieldStatus && !data.fieldStatus.hasRequired && (
        <div className="mb-4 p-3 rounded-md bg-[#FFF0B3] border border-[#FFE380] text-[#172B4D] flex items-center justify-between text-[12px]">
          <span>
            Notice: Some recommended custom fields are missing in Jira: <strong>{data.fieldStatus.missingRequired.join(', ')}</strong>.
            See <a href="https://github.com/vaibhavs-h/TrialDeck/blob/main/SETUP.md" target="_blank" rel="noreferrer" className="underline font-bold">SETUP.md</a> to configure them.
          </span>
        </div>
      )}

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
