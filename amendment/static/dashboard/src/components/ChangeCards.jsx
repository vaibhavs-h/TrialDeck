import Pill, { Icon } from './Pill.jsx';
import { amendment, changes } from './amendmentData.js';

export default function ChangeCards() {
  return (
    <section className="flex flex-col gap-space-md mb-space-xl">
      <div className="flex flex-col">
        <div className="flex items-center gap-space-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface">What changed</h2>
          <span className="font-code text-code px-1.5 rounded bg-surface-container text-on-surface-variant">
            {amendment.diffId}
          </span>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {changes.length} protocol modifications detected between protocol {amendment.fromVersion} and{' '}
          {amendment.toVersion}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
        {changes.map((c) => (
          <article
            key={c.id}
            className="bg-surface-container-lowest border border-outline-variant rounded-[4px] p-space-md flex flex-col justify-between shadow-sm hover:border-outline transition-colors"
          >
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between gap-space-sm">
                <span className="font-code text-[11px] font-bold text-primary px-1.5 py-0.5 rounded bg-surface-container">
                  {c.id}
                </span>
                <Pill tone={c.tone} className="tracking-wider">
                  {c.area} • {c.section}
                </Pill>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">{c.title}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{c.body}</p>
            </div>
            <div className="mt-space-md pt-space-xs border-t border-outline-variant flex items-center gap-1.5 text-on-surface-variant">
              <Icon name={c.icon} className="text-[15px] text-tertiary" />
              <span className="font-body-bold text-body-md">{c.impact}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
