import Pill from './Pill.jsx';
import { amendment, sites } from './amendmentData.js';

const COLUMNS = [
  ['reconsent', 'Re-consent Status'],
  ['irb', 'IRB Approval'],
  ['retraining', 'Retraining'],
  ['forms', 'Form Updates'],
];

export default function SiteActionsTable() {
  return (
    <section className="flex flex-col gap-space-md mb-space-xl">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-space-sm flex-wrap">
          <h2 className="font-headline-md text-headline-md text-on-surface">Actions per site</h2>
          <Pill tone="purple" className="px-2 tracking-wide font-bold">
            AI draft - requires review
          </Pill>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Generated task matrix based on site IRB submission status, patient enrollment counts, and staffing
          qualifications.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-[4px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th scope="col" className="py-2.5 px-3 font-label-sm text-label-sm uppercase tracking-wider text-outline">
                  Site / Investigator
                </th>
                {COLUMNS.map(([key, label]) => (
                  <th
                    key={key}
                    scope="col"
                    className="py-2.5 px-3 font-label-sm text-label-sm uppercase tracking-wider text-outline"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-md text-body-md">
              {sites.map((site) => (
                <tr key={site.name} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-body-bold text-body-bold text-on-surface">{site.name}</span>
                      <span className="text-on-surface-variant">PI: {site.pi}</span>
                    </div>
                  </td>
                  {COLUMNS.map(([key]) => (
                    <td key={key} className="py-3 px-3">
                      <Pill tone={site[key].tone} icon={site[key].icon}>
                        {site[key].label}
                      </Pill>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-surface-container-low px-space-md py-2 border-t border-outline-variant flex items-center justify-between text-outline">
          <span className="font-body-md text-[11px]">
            Audit trails automatically synced to Trial Master File (21 CFR Part 11 compliant).
          </span>
          <span className="font-code text-[11px]">JIRA-LINK: {amendment.tmfLink}</span>
        </div>
      </div>
    </section>
  );
}
