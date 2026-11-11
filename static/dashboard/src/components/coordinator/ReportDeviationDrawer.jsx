import { useEffect, useState } from 'react';
import Icon from '../Icon.jsx';
import { site, protocolVersions, deviationCategories } from './coordinatorData.js';

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({
  subjectId: '',
  protocolVersion: protocolVersions[0],
  category: deviationCategories[0].value,
  dateDetected: today(),
  description: '',
});

const fieldCls =
  'w-full bg-surface-container-lowest border border-outline-variant rounded text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all';

const severityBadge = {
  MAJOR: 'bg-error-container text-on-error-container',
  MINOR: 'bg-amber-100 text-amber-900',
};

export default function ReportDeviationDrawer({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const category = deviationCategories.find((c) => c.value === form.category) ?? deviationCategories[0];
  const subjectError = touched && !form.subjectId.trim();
  const descError = touched && !form.description.trim();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const submit = () => {
    setTouched(true);
    if (!form.subjectId.trim() || !form.description.trim()) return;
    onSubmit({ ...form, severity: category.severity });
    setForm(emptyForm());
    setTouched(false);
  };

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-[#091E42]/40 backdrop-blur-[1px] z-[60] transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Report deviation panel"
        aria-hidden={!open}
        className={`fixed top-0 right-0 h-full w-full sm:w-[500px] bg-surface-container-lowest shadow-2xl z-[60] flex flex-col justify-between border-l border-outline-variant transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant bg-surface-container-lowest">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm">
                <Icon name="assignment_add" className="text-[20px]" />
              </div>
              <div>
                <h2 className="font-headline-md text-[18px] leading-6 font-bold text-on-surface">Report deviation</h2>
                <p className="font-body-md text-outline mt-0.5 text-[12px] leading-4">
                  Log a clinical trial deviation for Jira triage and regulatory audit.
                </p>
              </div>
            </div>
            <button type="button" aria-label="Close modal" onClick={onClose} className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors ml-2">
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex-1 overflow-y-auto flex flex-col gap-4 bg-surface-container-lowest">
          {/* Site (locked) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-label-md text-label-md text-on-surface">Site</label>
              <span className="font-label-sm text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-bold uppercase tracking-wider">Assigned Site</span>
            </div>
            <div className="relative flex items-center">
              <Icon name="lock" className="text-outline text-[16px] absolute left-3 pointer-events-none" />
              <input readOnly value={site.lockedSiteLabel} className="w-full h-9 pl-9 pr-3 bg-surface-container-low border border-outline-variant text-on-surface-variant rounded font-body-md text-body-md cursor-not-allowed select-none font-medium" />
            </div>
          </div>

          {/* Subject ID */}
          <div>
            <label htmlFor="form-subject-id" className="block font-label-md text-label-md text-on-surface mb-1.5">
              Subject ID <span className="text-error">*</span>
            </label>
            <input
              id="form-subject-id" type="text" placeholder="e.g. SUBJ-0058"
              value={form.subjectId} onChange={set('subjectId')}
              className={`${fieldCls} h-9 px-3 font-code text-code font-semibold ${subjectError ? 'border-error' : ''}`}
            />
            {subjectError
              ? <span className="font-body-md text-[11px] text-error mt-1 block">Enter the subject ID.</span>
              : <span className="font-body-md text-[11px] text-outline mt-1 block">Pseudonymized trial subject code</span>}
          </div>

          {/* Protocol version */}
          <div>
            <label htmlFor="form-protocol-version" className="block font-label-md text-label-md text-on-surface mb-1.5">
              Protocol Version <span className="text-error">*</span>
            </label>
            <div className="relative flex items-center">
              <select id="form-protocol-version" value={form.protocolVersion} onChange={set('protocolVersion')}
                className={`${fieldCls} h-9 pl-3 pr-8 font-body-md text-body-md appearance-none cursor-pointer`}>
                {protocolVersions.map((v) => <option key={v}>{v}</option>)}
              </select>
              <Icon name="expand_more" className="text-outline text-[18px] absolute right-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="form-category" className="block font-label-md text-label-md text-on-surface mb-1.5">
              Category <span className="text-error">*</span>
            </label>
            <div className="relative flex items-center">
              <select id="form-category" value={form.category} onChange={set('category')}
                className={`${fieldCls} h-9 pl-3 pr-8 font-body-md text-body-md appearance-none cursor-pointer`}>
                {deviationCategories.map((c) => <option key={c.value} value={c.value}>{c.option}</option>)}
              </select>
              <Icon name="expand_more" className="text-outline text-[18px] absolute right-2.5 pointer-events-none" />
            </div>
            <div className="mt-2 p-2.5 bg-surface-container-low rounded border border-outline-variant/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`font-label-sm text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${severityBadge[category.severity]}`}>
                  {category.severity}
                </span>
                <span className="font-body-bold text-[12px] text-on-surface">{category.value}</span>
              </div>
              <Icon name="check_circle" className="text-primary text-[18px]" />
            </div>
          </div>

          {/* Date detected */}
          <div>
            <label htmlFor="form-date-detected" className="block font-label-md text-label-md text-on-surface mb-1.5">
              Date detected <span className="text-error">*</span>
            </label>
            <input id="form-date-detected" type="date" value={form.dateDetected} onChange={set('dateDetected')}
              className={`${fieldCls} h-9 px-3 font-body-md text-body-md`} />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="form-deviation-desc" className="block font-label-md text-label-md text-on-surface mb-1.5">
              Description <span className="text-error">*</span>
            </label>
            <textarea
              id="form-deviation-desc" rows={3}
              placeholder="Describe the deviation, circumstances, and any immediate actions taken..."
              value={form.description} onChange={set('description')}
              className={`${fieldCls} p-3 font-body-md text-body-md placeholder:text-outline leading-5 ${descError ? 'border-error' : ''}`}
            />
            {descError
              ? <span className="font-body-md text-[11px] text-error mt-1 block">Add a description of the deviation.</span>
              : <span className="font-body-md text-[11px] text-outline mt-1 block">Detailed clinical circumstances and immediate mitigations</span>}
          </div>

          {/* Compliance notice */}
          <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant/50 flex items-start gap-2.5">
            <Icon name="verified_user" className="text-primary text-[18px] shrink-0 mt-0.5" />
            <p className="font-body-md text-[11px] text-on-surface-variant leading-4">
              Reporting generates an audited Jira issue linkable to eCRF data and notifies the Lead Study Monitor for Site 02.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-end gap-2.5">
          <button type="button" onClick={onClose} className="h-9 px-4 bg-surface-container hover:bg-surface-container-high rounded text-on-surface font-body-bold text-body-bold transition-colors cursor-pointer">
            Cancel
          </button>
          <button type="button" onClick={submit} className="h-9 px-4 bg-primary-container hover:bg-primary text-on-primary rounded font-body-bold text-body-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5">
            <span>Submit deviation</span>
            <Icon name="arrow_forward" className="text-[16px]" />
          </button>
        </div>
      </aside>
    </>
  );
}