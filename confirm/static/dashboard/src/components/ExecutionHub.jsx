import { useState } from 'react';
import Pill, { Icon } from './Pill.jsx';
import CreateTasksModal from './CreateTasksModal.jsx';
import { hub, kpis, workstreams } from './executionData.js';

export default function ExecutionHub() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | saving | done

  // TODO: call a resolver (e.g. invoke('createAmendmentTasks')) once it exists.
  // Until then confirming only updates local UI state; no Jira issues are created.
  const confirm = () => {
    setStatus('saving');
    setTimeout(() => setStatus('done'), 600);
  };
  const close = () => {
    setOpen(false);
    setStatus('idle');
  };

  return (
    <div className="flex flex-col w-full pb-12">
      <div className="flex flex-col gap-space-xs mb-space-md">
        <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-on-surface-variant font-body-md text-body-md">
          <a className="hover:text-on-surface transition-colors" href="#">Protocols</a>
          <Icon name="chevron_right" className="text-[16px]" />
          <a className="hover:text-on-surface transition-colors" href="#">{hub.protocolId}</a>
          <Icon name="chevron_right" className="text-[16px]" />
        </nav>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">{hub.title}</h1>
            <Pill tone="warning">{hub.status}</Pill>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-8 px-3 rounded-[3px] bg-primary-container hover:bg-tertiary-container active:bg-primary text-on-primary font-body-bold text-body-md flex items-center gap-1.5 transition-colors shadow-sm self-start"
          >
            <Icon name="sync_alt" className="text-[16px]" />
            Push to Jira Sprints
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface-container-lowest border border-outline-variant rounded-[4px] p-space-md shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">{k.label}</span>
              <Icon name={k.icon} className="text-[18px] text-primary" />
            </div>
            <div className="font-headline-md text-headline-md text-on-surface">{k.value}</div>
            <div className="font-body-md text-body-md text-on-surface-variant mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <section className="bg-surface-container-lowest border border-outline-variant rounded-[4px] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-space-md py-space-sm border-b border-outline-variant">
          <h2 className="flex items-center gap-space-sm font-headline-sm text-headline-sm text-primary">
            <Icon name="account_tree" />
            {hub.tableTitle}
          </h2>
          <span className="font-code text-[11px] text-outline">{hub.version}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {['Site Identifier', 'Principal Investigator', 'Planned Jira Issues', 'Re-consent Load', 'IRB Status'].map((h) => (
                  <th key={h} scope="col" className="py-2.5 px-3 font-label-sm text-label-sm uppercase tracking-wider text-outline">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-md text-body-md">
              {workstreams.map((w) => (
                <tr key={w.site} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3 px-3 font-body-bold text-body-bold text-on-surface">{w.site}</td>
                  <td className="py-3 px-3 text-on-surface-variant">{w.pi}</td>
                  <td className="py-3 px-3 text-on-surface-variant">{w.planned}</td>
                  <td className="py-3 px-3 text-on-surface-variant">{w.load}</td>
                  <td className="py-3 px-3"><Pill tone={w.irbTone}>{w.irb}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <CreateTasksModal open={open} status={status} onCancel={close} onConfirm={confirm} />
    </div>
  );
}
