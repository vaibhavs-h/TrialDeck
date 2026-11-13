import { useEffect, useState } from 'react';
import Icon from '../../../components/common/Icon.jsx';
import ConfirmModal from '../../../components/common/ConfirmModal.jsx';
import { useCreateMeta, useMutation } from '../../../hooks/useDeviations.js';

const today = () => new Date().toISOString().slice(0, 10);

const fieldCls =
  'w-full bg-surface-container-lowest border border-outline-variant rounded text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all';

export default function ReportDeviationDrawer({ open, onClose, onCreated, siteName = 'Unassigned' }) {
  const { data: meta, loading: metaLoading, error: metaError } = useCreateMeta();
  const { mutate: doCreate, loading, error, errorDetails, reset } = useMutation('createDeviation');

  const [form, setForm] = useState({
    summary: '',
    siteId: '',
    subjectId: '',
    protocolVersionId: '',
    categoryId: '',
    rootCauseId: '',
    dateDetected: today(),
    description: '',
  });

  const [validationError, setValidationError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  const sites = meta?.options?.site || [];
  const categories = meta?.options?.category || [];
  const protocolVersions = meta?.options?.protocolVersion || [];
  const rootCauses = meta?.options?.rootCause || [];

  useEffect(() => {
    if (meta?.options) {
      setForm(f => {
        const defaultSite = (siteName && siteName !== 'all')
          ? (sites.find(s => s.value === siteName || s.label === siteName || s.id === siteName)?.id || sites[0]?.id || '')
          : (f.siteId || sites[0]?.id || '');

        return {
          ...f,
          siteId: defaultSite,
          categoryId: f.categoryId || categories[0]?.id || '',
          protocolVersionId: f.protocolVersionId || protocolVersions[0]?.id || '',
          rootCauseId: f.rootCauseId || rootCauses[0]?.id || ''
        };
      });
    }
  }, [meta, siteName]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Client-side validation step before preview/confirm
  const handleProceed = (e) => {
    e.preventDefault();
    setValidationError(null);
    reset();

    if (!form.summary.trim()) {
      setValidationError('Summary is required.');
      return;
    }

    if (!form.siteId) {
      setValidationError('Please select a valid Trial Site.');
      return;
    }

    if (!form.categoryId) {
      setValidationError('Please select a valid Category / Severity.');
      return;
    }

    if (!form.protocolVersionId) {
      setValidationError('Please select a valid Protocol Version.');
      return;
    }

    if (!form.rootCauseId) {
      setValidationError('Please select a valid Root Cause.');
      return;
    }

    const subjPattern = /^SUBJ-\d{4}$/;
    if (!form.subjectId.trim() || !subjPattern.test(form.subjectId.trim())) {
      setValidationError('Subject ID must be pseudonymized matching format SUBJ-xxxx (e.g. SUBJ-0042). Non-pseudonymized identifiers are strictly rejected.');
      return;
    }

    if (form.dateDetected) {
      const d = new Date(form.dateDetected);
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      if (d > now) {
        setValidationError('Date detected cannot be in the future.');
        return;
      }
    }

    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      const payload = {
        summary: form.summary,
        site: { id: form.siteId },
        category: { id: form.categoryId },
        protocolVersion: { id: form.protocolVersionId },
        rootCause: { id: form.rootCauseId },
        subjectId: form.subjectId,
        dateDetected: form.dateDetected,
        description: form.description
      };
      const res = await doCreate(payload);
      setCreatedResult(res);
      setConfirmOpen(false);
      onCreated?.(res);
    } catch (e) {
      // Error and details are captured in useMutation state
    }
  };

  const handleClose = () => {
    setValidationError(null);
    setCreatedResult(null);
    setConfirmOpen(false);
    reset();
    onClose();
  };

  return (
    <>
      <div
        onClick={handleClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-[#091E42]/40 backdrop-blur-[1px] z-[60] transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Report deviation panel"
        aria-hidden={!open}
        className={`fixed top-0 right-0 h-full w-full sm:w-[520px] bg-surface-container-lowest shadow-2xl z-[60] flex flex-col justify-between border-l border-outline-variant transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-6 py-5 border-b border-outline-variant bg-surface-container-lowest flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm">
              <Icon name="assignment_add" className="text-[20px]" />
            </div>
            <div>
              <h2 className="font-headline-md text-[18px] leading-6 font-bold text-on-surface">Report Protocol Deviation</h2>
              <p className="font-body-md text-outline mt-0.5 text-[12px] leading-4">
                Record a live Protocol Deviation in Jira project CLIN
              </p>
            </div>
          </div>
          <button type="button" aria-label="Close modal" onClick={handleClose} className="p-1 rounded text-outline hover:text-on-surface">
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        <form onSubmit={handleProceed} className="px-6 py-5 flex-1 overflow-y-auto flex flex-col gap-4 bg-surface-container-lowest">
          {createdResult ? (
            <div className="p-6 bg-[#E3FCEF] border border-[#ABF5D1] text-[#006644] rounded flex flex-col items-center text-center gap-3">
              <Icon name="check_circle" className="text-[40px] text-[#00875A]" />
              <h3 className="font-headline-md font-bold text-[#006644]">Deviation Logged Successfully</h3>
              <p className="font-body-md text-[13px]">
                Created Jira issue <a href={`#/deviation/${createdResult.key}`} onClick={handleClose} className="font-code font-bold underline">{createdResult.key}</a> in space CLIN.
              </p>
              <div className="flex gap-2 mt-2">
                <a
                  href={`#/deviation/${createdResult.key}`}
                  onClick={handleClose}
                  className="px-4 py-2 bg-[#00875A] text-white rounded font-body-bold text-[13px] hover:bg-[#006644]"
                >
                  View Deviation Detail
                </a>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-white text-[#006644] border border-[#ABF5D1] rounded font-body-bold text-[13px]"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {validationError && (
                <div className="p-3 bg-[#FFEBE6] border border-[#FFBDAD] text-[#DE350B] rounded text-[12px] flex items-start gap-2">
                  <Icon name="error" className="text-[16px] shrink-0 mt-0.5" />
                  <div>{validationError}</div>
                </div>
              )}

              {/* Summary */}
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">
                  Deviation Summary <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dose titration missed at Week 4 visit"
                  value={form.summary}
                  onChange={set('summary')}
                  className={`${fieldCls} h-9 px-3 font-body-md text-body-md`}
                />
              </div>

              {/* Site & Subject ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Trial Site <span className="text-error">*</span>
                  </label>
                  {sites.length === 0 ? (
                    <div className="p-2 bg-[#FFEBE6] border border-[#FFBDAD] text-[#DE350B] rounded text-[11px]">
                      No allowed values returned by Jira for site.
                    </div>
                  ) : (
                    <select
                      value={form.siteId}
                      onChange={set('siteId')}
                      className={`${fieldCls} h-9 px-2 font-body-md text-body-md`}
                    >
                      <option value="">Select Site...</option>
                      {sites.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Subject ID <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="SUBJ-0042"
                    value={form.subjectId}
                    onChange={set('subjectId')}
                    className={`${fieldCls} h-9 px-3 font-code text-code`}
                  />
                  <span className="font-body-md text-[10px] text-outline mt-0.5 block">Format: SUBJ-xxxx</span>
                </div>
              </div>

              {/* Category & Root Cause */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Severity / Category <span className="text-error">*</span>
                  </label>
                  {categories.length === 0 ? (
                    <div className="p-2 bg-[#FFEBE6] border border-[#FFBDAD] text-[#DE350B] rounded text-[11px]">
                      No allowed values returned by Jira for category.
                    </div>
                  ) : (
                    <select
                      value={form.categoryId}
                      onChange={set('categoryId')}
                      className={`${fieldCls} h-9 px-2 font-body-md text-body-md capitalize`}
                    >
                      <option value="">Select Category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Root Cause <span className="text-error">*</span>
                  </label>
                  {rootCauses.length === 0 ? (
                    <div className="p-2 bg-[#FFEBE6] border border-[#FFBDAD] text-[#DE350B] rounded text-[11px]">
                      No allowed values returned by Jira for Root cause.
                    </div>
                  ) : (
                    <select
                      value={form.rootCauseId}
                      onChange={set('rootCauseId')}
                      className={`${fieldCls} h-9 px-2 font-body-md text-body-md`}
                    >
                      <option value="">Select Root Cause...</option>
                      {rootCauses.map(rc => <option key={rc.id} value={rc.id}>{rc.label}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* Protocol Version & Date Detected */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Protocol Version <span className="text-error">*</span>
                  </label>
                  {protocolVersions.length === 0 ? (
                    <div className="p-2 bg-[#FFEBE6] border border-[#FFBDAD] text-[#DE350B] rounded text-[11px]">
                      No allowed values returned by Jira for Protocol version.
                    </div>
                  ) : (
                    <select
                      value={form.protocolVersionId}
                      onChange={set('protocolVersionId')}
                      className={`${fieldCls} h-9 px-2 font-body-md text-body-md`}
                    >
                      <option value="">Select Protocol Version...</option>
                      {protocolVersions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Date Detected
                  </label>
                  <input
                    type="date"
                    value={form.dateDetected}
                    onChange={set('dateDetected')}
                    className={`${fieldCls} h-9 px-3 font-body-md text-body-md`}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">
                  Clinical Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the circumstances, protocol breach, and immediate mitigations..."
                  value={form.description}
                  onChange={set('description')}
                  className={`${fieldCls} p-3 font-body-md text-body-md leading-5`}
                />
              </div>

              <div className="p-3 bg-surface-container-low rounded border border-outline-variant/50 text-[11px] text-outline flex items-start gap-2">
                <Icon name="verified_user" className="text-primary text-[18px] shrink-0 mt-0.5" />
                <span>
                  Writes are signed as your Jira identity under space CLIN. Only pseudonymized Subject IDs are accepted.
                </span>
              </div>
            </>
          )}
        </form>

        {!createdResult && (
          <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="h-9 px-4 bg-surface-container hover:bg-surface-container-high rounded text-on-surface font-body-bold text-body-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProceed}
              className="h-9 px-4 bg-primary-container hover:bg-primary text-on-primary rounded font-body-bold text-body-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Review &amp; Submit</span>
              <Icon name="arrow_forward" className="text-[16px]" />
            </button>
          </div>
        )}
      </aside>

      {/* Preview & Confirm Step */}
      <ConfirmModal
        open={confirmOpen}
        title="Confirm Protocol Deviation"
        message="Review the deviation details before submitting live to the Jira CLIN space. An audited issue will be created."
        confirmLabel="Create Live in Jira"
        confirmTone="primary"
        loading={loading}
        error={error}
        errorDetails={errorDetails}
        details={[
          { label: 'Summary', value: form.summary },
          { label: 'Site', value: sites.find(s => s.id === form.siteId)?.label || form.siteId },
          { label: 'Subject ID', value: form.subjectId },
          { label: 'Severity', value: categories.find(c => c.id === form.categoryId)?.label || form.categoryId },
          { label: 'Root Cause', value: rootCauses.find(rc => rc.id === form.rootCauseId)?.label || form.rootCauseId },
          { label: 'Protocol Version', value: protocolVersions.find(p => p.id === form.protocolVersionId)?.label || form.protocolVersionId },
          { label: 'Date Detected', value: form.dateDetected }
        ]}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
