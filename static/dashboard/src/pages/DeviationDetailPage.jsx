import IssueBreadcrumbBar from '../components/deviation/IssueBreadcrumbBar.jsx';
import IssueHeroCard from '../components/deviation/IssueHeroCard.jsx';
import ActivityFeed from '../components/deviation/ActivityFeed.jsx';
import IssueDetailsCard from '../components/deviation/IssueDetailsCard.jsx';
import TrialDeckGlancePanel from '../components/deviation/TrialDeckGlancePanel.jsx';
import SiteHealthCard from '../components/deviation/SiteHealthCard.jsx';
import { deviation } from '../components/deviation/deviationData.js';

export default function DeviationDetailPage({ issueId }) {
  // Demo data only has DEV-112; swap this for a real lookup by issueId later.
  const d = { ...deviation, id: issueId || deviation.id };

  return (
    <div className="flex flex-col w-full pb-space-xl">
      <IssueBreadcrumbBar issueId={d.id} watchers={d.watchers} />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
        <div className="xl:col-span-8 flex flex-col gap-space-md">
          <IssueHeroCard d={d} />
          <ActivityFeed />
        </div>
        <div className="xl:col-span-4 flex flex-col gap-space-md">
          <IssueDetailsCard d={d} />
          <TrialDeckGlancePanel />
          <SiteHealthCard />
        </div>
      </div>
    </div>
  );
}