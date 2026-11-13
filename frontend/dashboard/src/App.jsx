import { useEffect, useState } from 'react';
import Shell from './components/common/Shell.jsx';
import DashboardPage from './modules/dashboard/pages/DashboardPage.jsx';
import SiteCoordinatorPage from './modules/coordinator/pages/SiteCoordinatorPage.jsx';
import DeviationDetailPage from './modules/deviation/pages/DeviationDetailPage.jsx';
import AmendmentPage from './modules/amendment/pages/AmendmentPage.jsx';
import SettingsPage from './modules/dashboard/pages/SettingsPage.jsx';
import { SitesPage, CapaPage, ReportsPage } from './modules/dashboard/pages/AdditionalPages.jsx';

function useHash() {
  const [hash, setHash] = useState(window.location.hash || '#/');
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  const detail = hash.match(/^#\/deviation\/([\w-]+)$/);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [hash, detail?.[1]]);

  if (detail) {
    return (
      <Shell activeSub="Deviations" activeSide="Protocol Deviations">
        <DeviationDetailPage issueId={detail[1]} />
      </Shell>
    );
  }

  if (hash === '#/coordinator' || hash === '#/tasks') {
    return (
      <Shell activeSub="Deviations" activeSide="Protocol Deviations">
        <SiteCoordinatorPage />
      </Shell>
    );
  }

  if (hash === '#/sites') {
    return (
      <Shell activeSub="Site Directory" activeSide="Trial Sites">
        <SitesPage />
      </Shell>
    );
  }

  if (hash === '#/capa') {
    return (
      <Shell activeSub="CAPA Tracker" activeSide="CAPA Register">
        <CapaPage />
      </Shell>
    );
  }

  if (hash === '#/reports') {
    return (
      <Shell activeSub="Reports" activeSide="Safety & Compliance">
        <ReportsPage />
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

  if (hash === '#/settings') {
    return (
      <Shell activeSub="Settings" activeSide="Hub Settings">
        <SettingsPage />
      </Shell>
    );
  }

  return (
    <Shell activeSub="Overview" activeSide="Operational Summary">
      <DashboardPage />
    </Shell>
  );
}
