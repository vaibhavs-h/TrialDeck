const topNav = [
  { label: 'Your work', href: '#/' },
  { label: 'Projects', href: '#/' },
  { label: 'Filters', href: '#/capa' },
  { label: 'Dashboards', href: '#/' },
  { label: 'Apps', href: '#/' },
];
const subNav = [
  { label: 'Overview', href: '#/' },
  { label: 'Deviations', href: '#/coordinator' },
  { label: 'CAPA Tracker', href: '#/capa' },
  { label: 'Site Directory', href: '#/sites' },
  { label: 'Reports', href: '#/reports' },
  { label: 'Amendments', href: '#/amendment' },
  { label: 'Settings', href: '#/settings' },
];
const sideNav = [
  { icon: 'dashboard', label: 'Operational Summary', href: '#/' },
  { icon: 'warning', label: 'Protocol Deviations', href: '#/coordinator' },
  { icon: 'assignment_turned_in', label: 'CAPA Register', href: '#/capa' },
  { icon: 'local_hospital', label: 'Trial Sites', href: '#/sites' },
  { icon: 'query_stats', label: 'Safety & Compliance', href: '#/reports' },
  { icon: 'description', label: 'Protocol Amendments', href: '#/amendment' },
  { icon: 'settings', label: 'Hub Settings', href: '#/settings' },
];

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const iconBtn =
  'p-space-xs text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded transition-colors flex items-center justify-center';

export default function Shell({ children, activeSub = 'Overview', activeSide = 'Operational Summary' }) {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-surface-container-lowest border-b border-outline-variant">
        {/* Jira top bar */}
        <header className="h-14 w-full px-margin flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center gap-space-md">
            <button type="button" aria-label="App switcher" className={iconBtn}>
              <Icon name="apps" className="text-[20px]" />
            </button>
            <div className="flex items-center gap-space-sm">
              <div className="w-6 h-6 rounded bg-primary-container flex items-center justify-center">
                <Icon name="developer_board" className="text-on-primary text-[16px]" />
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface">Jira</span>
            </div>
            <span className="text-outline-variant">/</span>
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">TrialDeck</span>
              <span className="text-on-surface-variant font-body-md text-body-md hidden sm:inline">/ Clinical Operations</span>
            </div>
            <nav className="hidden xl:flex items-center gap-space-md ml-space-md">
              {topNav.map(({ label, href }) => {
                const active = label === 'Apps';
                return (
                  <a
                    key={label}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`py-4 font-headline-sm text-headline-sm transition-colors ${
                      active
                        ? 'text-primary font-bold border-b-2 border-primary'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {label}
                  </a>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-space-sm">
            <div className="relative hidden md:flex items-center">
              <Icon name="search" className="absolute left-2 text-outline text-[18px]" />
              <input
                type="text"
                placeholder="Search (/)"
                className="h-8 pl-8 pr-3 w-56 lg:w-72 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
              />
              <kbd className="absolute right-2 top-1.5 px-1 py-0.5 font-code text-[10px] bg-surface-container text-on-surface-variant rounded border border-outline-variant">/</kbd>
            </div>
            {['notifications', 'help', 'settings'].map((n) => (
              <button key={n} type="button" aria-label={n} className={iconBtn}>
                <Icon name={n} className="text-[20px]" />
              </button>
            ))}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-space-xs">
              <Icon name="person" className="text-on-primary text-[18px]" />
            </div>
          </div>
        </header>

        {/* TrialDeck sub bar */}
        <div className="h-12 w-full px-margin bg-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-xs mr-space-md">
              <Icon name="biotech" className="text-primary text-[18px]" />
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface">TrialDeck</span>
            </div>
            <nav className="flex items-center gap-space-md h-12 overflow-x-auto">
              {subNav.map(({ label, href }) => {
                const active = label === activeSub;
                return (
                  <a
                    key={label}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`h-12 flex items-center whitespace-nowrap transition-colors font-headline-sm text-headline-sm ${
                      active
                        ? 'text-primary border-b-2 border-primary font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {label}
                  </a>
                );
              })}
            </nav>
          </div>
          <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 bg-surface-container-low text-tertiary rounded border border-outline-variant">
            Live Jira Workspace
          </span>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-[6.5rem] h-[calc(100vh-6.5rem)] w-64 bg-surface-container-lowest border-r border-outline-variant z-40 flex flex-col p-space-md overflow-y-auto">
        <div className="px-space-sm mb-space-md">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Operations Scope</span>
        </div>
        <nav className="flex flex-col gap-space-xs">
          {sideNav.map((item) => ({ ...item, active: item.label === activeSide })).map(({ icon, label, href, active }) => (
            <a
              key={label}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-space-sm px-space-sm py-2 rounded transition-colors ${
                active
                  ? 'bg-secondary-container text-on-surface font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-body-md text-body-md'
              }`}
            >
              <Icon name={icon} className="text-[18px]" />
              {label}
            </a>
          ))}
        </nav>
        <div className="mt-auto pt-space-md border-t border-outline-variant px-space-sm flex items-center justify-between text-outline">
          <span className="font-code text-code text-[11px]">CLIN Active</span>
          <Icon name="lock" className="text-[16px]" />
        </div>
      </aside>

      <div className="pl-64">
        <main className="relative pt-[6.5rem] min-h-screen bg-surface w-full px-margin">{children}</main>
      </div>
    </>
  );
}
