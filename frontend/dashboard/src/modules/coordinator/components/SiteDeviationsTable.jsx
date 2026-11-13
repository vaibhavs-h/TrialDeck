import Icon from '../../../components/common/Icon.jsx';

const severityCls = {
  major: 'bg-error-container text-on-error-container',
  minor: 'bg-amber-100 text-amber-900',
};

const statusCls = {
  amber: 'bg-amber-100 text-amber-900',
  blue: 'bg-surface-container-highest text-tertiary',
  grey: 'bg-surface-container text-on-surface-variant',
  neutral: 'bg-surface-container text-on-surface',
};

export default function SiteDeviationsTable({ rows = [] }) {
  return (
    <div id="site-deviations" className="lg:col-span-6 bg-surface-container-lowest rounded-lg shadow-sm p-space-md flex flex-col justify-between border border-outline-variant/40">
      <div>
        <div className="flex items-center justify-between pb-space-sm mb-space-sm">
          <div className="flex items-center gap-space-xs">
            <Icon name="table_chart" className="text-primary text-[20px]" />
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Site deviations</h3>
          </div>
          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary uppercase font-bold border border-outline-variant/40">
            {rows.length} Active Records
          </span>
        </div>
        <p className="font-body-md text-body-md text-outline mb-space-md">Real-time pseudonymized logs under investigation</p>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left font-body-md text-body-md">
            <thead>
              <tr className="bg-surface-container-low text-outline font-label-sm text-label-sm uppercase tracking-wider">
                <th className="py-2.5 px-3">ID / Subject</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {rows.map((r) => (
                <tr key={r.key} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-2.5 px-3">
                    <a href={`#/deviation/${r.key}`} className="block font-body-bold text-body-bold text-primary hover:underline">{r.key}</a>
                    <div className="font-code text-[11px] text-outline">{r.subjectId}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-label-sm text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${severityCls[r.category] || severityCls.minor}`}>{r.category}</span>
                      <span className="text-on-surface">{r.protocolVersion}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`font-label-sm text-[11px] px-2 py-0.5 rounded font-bold uppercase inline-block ${statusCls.neutral}`}>{r.status}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-code text-code text-on-surface font-semibold">{r.daysOpen}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-space-md mt-space-md flex items-center justify-between text-outline font-body-md text-body-md border-t border-outline-variant/40">
        <span>Showing {rows.length} deviations</span>
        <a href="#/sites" className="font-body-bold text-body-bold text-primary hover:text-primary-container transition-colors inline-flex items-center gap-1">
          View full site log <Icon name="arrow_forward" className="text-[14px]" />
        </a>
      </div>
    </div>
  );
}