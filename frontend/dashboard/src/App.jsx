import { useEffect, useState } from 'react';
import Shell from './components/common/Shell.jsx';
import DashboardPage from './modules/dashboard/pages/DashboardPage.jsx';
import SiteCoordinatorPage from './modules/coordinator/pages/SiteCoordinatorPage.jsx';
import DeviationDetailPage from './modules/deviation/pages/DeviationDetailPage.jsx';
import AmendmentPage from './modules/amendment/pages/AmendmentPage.jsx';

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