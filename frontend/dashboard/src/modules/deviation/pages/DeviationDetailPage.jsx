import { useDeviation } from '../../../hooks/useDeviations.js';
import IssueBreadcrumbBar from '../components/IssueBreadcrumbBar.jsx';
import IssueHeroCard from '../components/IssueHeroCard.jsx';
import ActivityFeed from '../components/ActivityFeed.jsx';
import IssueDetailsCard from '../components/IssueDetailsCard.jsx';
import TrialDeckGlancePanel from '../components/TrialDeckGlancePanel.jsx';
import SiteHealthCard from '../components/SiteHealthCard.jsx';

export default function DeviationDetailPage({ issueId }) {
  const { data: d, loading, error, refetch } = useDeviation(issueId);

  if (loading) {
    return (
      <div className="p-12 text-center text-[#6B778C] flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-[32px] animate-spin text-[#0052CC]">progress_activity</span>
        <span className="font-body-md text-body-md">Loading live Jira issue details for {issueId}...</span>
      </div>
    );
  }

  if (error || !d) {
    return (
      <div className="p-8 my-4 rounded border border-[#FFBDAD] bg-[#FFEBE6] text-[#DE350B] flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-[32px]">error</span>
        <span className="font-headline-sm text-headline-sm font-semibold">Could not load deviation {issueId}</span>
        <span className="font-body-md text-body-md">{error || 'Issue not found in CLIN project.'}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#DE350B] text-white rounded font-body-bold text-body-bold hover:bg-[#BF2600]"
          >
            Retry
          </button>
          <a
            href="#/coordinator"
            className="px-4 py-2 bg-white text-[#172B4D] border border-[#DFE1E6] rounded font-body-bold text-body-bold hover:bg-[#F4F5F7]"
          >
            Back to deviations
          </a>
        </div>
      </div>
    );
  }

  const relatedCount = (d.related?.length || 0) + 1;

  return (
    <div className="flex flex-col w-full pb-space-xl">
      <IssueBreadcrumbBar issueId={d.key || issueId} />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
        <div className="xl:col-span-8 flex flex-col gap-space-md">
          <IssueHeroCard d={d} onUpdated={refetch} />
          <ActivityFeed comments={d.comments || []} />
        </div>
        <div className="xl:col-span-4 flex flex-col gap-space-md">
          <IssueDetailsCard d={d} onUpdated={refetch} />
          <TrialDeckGlancePanel d={d} onUpdated={refetch} />
          <SiteHealthCard siteName={d.site} deviationCount={relatedCount} />
        </div>
      </div>
    </div>
  );
}
