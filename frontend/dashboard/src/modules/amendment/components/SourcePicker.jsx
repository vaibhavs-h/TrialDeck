import { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';
import { useInvoke } from '../../../hooks/useInvoke.js';
import { Icon } from './Pill.jsx';

const fieldCls =
  'w-full h-9 px-2 bg-surface-container-lowest border border-outline-variant rounded text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container';
const labelCls = 'font-label-sm text-label-sm uppercase tracking-wider text-outline';

// Accepts a Confluence page URL (.../pages/12345/...) or a bare page ID.
const parsePageId = (raw) => {
  const text = String(raw || '');
  const m = text.match(/\/pages\/(\d+)/) || text.match(/^\s*(\d+)\s*$/);
  return m ? m[1] : '';
};

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '');

/**
 * Step 1: choose the Confluence protocol page and the two versions to compare.
 * `onChange` receives a partial update ({ pageId } etc.).
 */
export default function SourcePicker({ value, onChange, onAnalyze, analyzing, analyzeError }) {
  const { data: pages, loading: pagesLoading, error: pagesError } = useInvoke('getProtocolPages');
  const [versions, setVersions] = useState(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState(null);
  const [pasted, setPasted] = useState('');

  useEffect(() => {
    if (!value.pageId) {
      setVersions(null);
      return undefined;
    }
    let cancelled = false;
    setVersionsLoading(true);
    setVersionsError(null);
    invoke('getAmendmentVersions', { pageId: value.pageId })
      .then((res) => {
        if (cancelled) return;
        setVersions(res);
        const nums = res.versions.map((v) => v.number); // newest first
        onChange({ toVersion: nums[0] ?? '', fromVersion: nums[1] ?? '' });
      })
      .catch((e) => {
        if (cancelled) return;
        setVersions(null);
        setVersionsError(String(e?.message || e));
      })
      .finally(() => !cancelled && setVersionsLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.pageId]);

  const pageList = pages || [];
  const known = pageList.some((p) => p.id === value.pageId);
  const enoughVersions = (versions?.versions.length ?? 0) >= 2;
  const canAnalyze =
    value.pageId && value.fromVersion && value.toVersion && String(value.fromVersion) !== String(value.toVersion);

  const versionOptions = (versions?.versions || []).map((v) => (
    <option key={v.number} value={v.number}>
      {`v${v.number}${v.createdAt ? ` - ${fmtDate(v.createdAt)}` : ''}${v.message ? ` - ${v.message}` : ''}`}
    </option>
  ));

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-space-lg shadow-sm flex flex-col gap-space-md">
      <div>
        <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Compare protocol versions</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Pick a Confluence protocol page and the two versions to compare. Nothing is created in Jira until you approve.
        </p>
      </div>

      {pagesError && (
        <div role="alert" className="p-3 bg-[#FFEBE6] border border-[#FFBDAD] text-[#DE350B] rounded text-[12px]">
          Could not load Confluence pages: {pagesError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className={labelCls}>Protocol page</span>
          <select
            className={fieldCls}
            value={value.pageId}
            disabled={pagesLoading}
            onChange={(e) => onChange({ pageId: e.target.value, fromVersion: '', toVersion: '' })}
          >
            <option value="">{pagesLoading ? 'Loading pages...' : 'Select a page'}</option>
            {!known && value.pageId && <option value={value.pageId}>{`Page ${value.pageId}`}</option>}
            {pageList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          {!pagesLoading && !pagesError && pageList.length === 0 && (
            <span className="text-[12px] text-outline">
              No Confluence pages found. Create a protocol page and publish it at least twice.
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className={labelCls}>Or paste a page link or ID</span>
          <input
            className={fieldCls}
            placeholder="https://your-site.atlassian.net/wiki/spaces/.../pages/12345/..."
            value={pasted}
            onChange={(e) => {
              setPasted(e.target.value);
              const id = parsePageId(e.target.value);
              if (id) onChange({ pageId: id, fromVersion: '', toVersion: '' });
            }}
          />
        </label>

        {versionsLoading && <p className="md:col-span-2 text-[12px] text-outline">Loading versions...</p>}
        {versionsError && (
          <div role="alert" className="md:col-span-2 p-3 bg-[#FFEBE6] border border-[#FFBDAD] text-[#DE350B] rounded text-[12px]">
            {versionsError}
          </div>
        )}
        {versions && !enoughVersions && (
          <div className="md:col-span-2 p-3 bg-[#FFF0B3] border border-[#FFE380] text-[#172B4D] rounded text-[12px] flex gap-2">
            <Icon name="info" className="text-[16px]" />
            <span>
              &ldquo;{versions.page.title}&rdquo; has only one published version. Edit the page and publish it again to
              create an amendment to compare.
            </span>
          </div>
        )}

        {enoughVersions && (
          <>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Previous version (before)</span>
              <select className={fieldCls} value={value.fromVersion} onChange={(e) => onChange({ fromVersion: e.target.value })}>
                {versionOptions}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>New version (after)</span>
              <select className={fieldCls} value={value.toVersion} onChange={(e) => onChange({ toVersion: e.target.value })}>
                {versionOptions}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Effective date (optional)</span>
              <input
                type="date"
                className={fieldCls}
                value={value.effectiveDate}
                onChange={(e) => onChange({ effectiveDate: e.target.value })}
              />
              <span className="text-[11px] text-outline">Used as the task due date. Defaults to 30 days from today.</span>
            </label>
          </>
        )}
      </div>

      {analyzeError && (
        <div role="alert" className="p-3 bg-[#FFEBE6] border border-[#FFBDAD] text-[#DE350B] rounded text-[12px]">
          {analyzeError}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!canAnalyze || analyzing || !enoughVersions}
          onClick={onAnalyze}
          className="h-9 px-4 bg-primary-container hover:bg-primary text-on-primary rounded font-body-bold text-body-md inline-flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name={analyzing ? 'progress_activity' : 'compare_arrows'} className={`text-[18px] ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analyzing...' : 'Analyze amendment'}
        </button>
      </div>
    </section>
  );
}
