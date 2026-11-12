import { useState } from 'react';
import Icon from '../../../components/common/Icon.jsx';
import { comments } from '../data/deviationData.js';

const tabs = ['Activity', 'Comments (3)', 'History', 'Audit Logs'];

export default function ActivityFeed() {
  const [tab, setTab] = useState('Activity');

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
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-space-xs text-secondary font-body-md text-body-md">
          <span>Order:</span>
          <span className="font-body-bold text-body-bold text-on-surface cursor-pointer flex items-center">
            Newest first <Icon name="expand_more" className="text-[16px]" />
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-space-md pt-space-md">
        {comments.map((c) => (
          <div key={c.initials} className="flex items-start gap-space-sm">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${c.avatar}`}>
              {c.initials}
            </div>
            <div className="flex-1 bg-surface-container-low rounded p-space-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-body-bold text-body-bold text-on-surface">
                  {c.name} <span className="text-secondary font-normal">({c.role})</span>
                </span>
                <span className="font-body-md text-body-md text-outline">{c.time}</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}