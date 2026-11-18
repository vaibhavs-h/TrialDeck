import Pill, { Icon } from './Pill.jsx';

const TYPE_LABEL = { added: 'Added', removed: 'Removed', modified: 'Changed' };
const TYPE_TONE = { added: 'success', removed: 'danger', modified: 'warning' };
const IMPACT_ICON = {
  reConsent: 'how_to_reg',
  irbApproval: 'fact_check',
  retraining: 'school',
  formUpdates: 'edit_document',
};

// Old wording struck through, new wording highlighted.
function InlineDiff({ parts }) {
  return (
    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
      {parts.map((p, i) =>
        p.added ? (
          <ins key={i} className="bg-[#E3FCEF] text-[#006644] no-underline px-0.5 rounded-[2px]">{p.value}</ins>
        ) : p.removed ? (
          <del key={i} className="bg-[#FFEBE6] text-[#DE350B] px-0.5 rounded-[2px]">{p.value}</del>
        ) : (
          <span key={i}>{p.value}</span>
        ),
      )}
    </p>
  );
}

function ChangeCard({ change, index }) {
  const body =
    change.type === 'modified' ? (
      <InlineDiff parts={change.inline} />
    ) : (
      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
        {change.type === 'removed' ? <del className="bg-[#FFEBE6] text-[#DE350B] px-0.5">{change.before}</del> : change.after}
      </p>
    );

  return (
    <article className="bg-surface-container-lowest border border-outline-variant rounded-lg p-space-md shadow-sm flex flex-col gap-space-sm">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-code text-code text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <Pill tone={TYPE_TONE[change.type]}>{TYPE_LABEL[change.type]}</Pill>
          <Pill tone={change.areaTone}>{change.section ? `${change.area} - ${change.section}` : change.area}</Pill>
        </div>
      </div>
      {body}
      <div className="border-t border-outline-variant/60 pt-space-sm flex flex-wrap gap-x-4 gap-y-1">
        {change.impacts.length ? (
          change.impacts.map((i) => (
            <span key={i.type} title={i.reason} className="inline-flex items-center gap-1 font-body-md text-[12px] text-on-surface-variant">
              <Icon name={IMPACT_ICON[i.type]} className="text-[15px]" />
              {i.label}
            </span>
          ))
        ) : (
          <span className="font-body-md text-[12px] text-outline">Informational - no site action detected</span>
        )}
      </div>
    </article>
  );
}

export default function ChangeCards({ changes, fromVersion, toVersion }) {
  return (
    <section className="flex flex-col gap-space-sm">
      <div className="flex items-center gap-space-sm flex-wrap">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">What changed</h2>
        <span className="font-code text-code bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant">
          DIFF v{fromVersion} to v{toVersion}
        </span>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant">
        {changes.length} protocol {changes.length === 1 ? 'modification' : 'modifications'} detected between v{fromVersion} and v{toVersion}.
      </p>
      {changes.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-8 text-center text-outline">
          No differences were found between these two versions.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
          {changes.map((c, i) => (
            <ChangeCard key={c.id} change={c} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
