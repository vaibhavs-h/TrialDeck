import { useState } from 'react';
import Icon from '../../../components/common/Icon.jsx';

const tabs = ['Activity', 'Comments', 'History'];

export default function ActivityFeed({ comments = [] }) {
  const [tab, setTab] = useState('Comments');

  return (
    <div className="bg-surface-container-lowest rounded p-space-md shadow-sm">
      <div className="flex items-center justify-between border-b border-outline-variant/60 pb-space-xs">
        <div className="flex items-center gap-space-md">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`font-headline-sm text-headline-sm pb-2 transition-colors ${
                tab === t
                  ? 'text-primary font-bold border-b-2 border-primary -mb-[9px]'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              {t} {t === 'Comments' ? `(${comments.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-space-md pt-space-md">
        {comments.length === 0 ? (
          <div className="py-6 text-center text-[#6B778C] font-body-md text-body-md">
            No comments logged on this deviation issue yet.
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id || c.created} className="flex items-start gap-space-sm">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-[#0052CC] text-white">
                {c.initials || 'U'}
              </div>
              <div className="flex-1 bg-surface-container-low rounded p-space-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body-bold text-body-bold text-on-surface">
                    {c.author || c.name}
                  </span>
                  <span className="font-body-md text-body-md text-outline">{c.time}</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">{c.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
