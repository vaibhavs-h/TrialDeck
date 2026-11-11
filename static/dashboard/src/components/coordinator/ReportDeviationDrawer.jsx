import { useEffect, useState } from 'react';
import Icon from '../Icon.jsx';
import { site } from './coordinatorData.js';

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({
  subjectId: '',
  protocolVersion: 'v2.2 (Amendment 3)',
  severity: 'major',
  dateDetected: today(),
  description: '',
  notifyPI: true,
});

const inputCls =
  'w-full bg-surface-container-lowest rounded text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container transition-all border border-outline-variant';

const classes = [
  { value: 'major', badge: 'MAJOR', badgeCls: 'bg-error-container text-on-error-container', title: 'GCP Safety / Consent', text: 'Direct risk to participant safety or trial integrity' },
  { value: 'minor', badge: 'MINOR', badgeCls: 'bg-amber-100 text-amber-900', title: 'Procedural Variance', text: 'Administrative or window scheduling deviations' },
];

export default function ReportDeviationDrawer({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState(false);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

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
    onSubmit(form);
    setForm(emptyForm());
    setTouched(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-inverse-surface/40 z-[60] transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Report protocol deviation"
        aria-hidden={!open}
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-surface-container-lowest shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out flex flex-col justify-between ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-space-lg bg-surface-container-low">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <div className="w-6 h-6 rounded bg-primary-container text-on-primary flex items-center justify-center">
                <Icon name="assignment_add" className="text-[16px]" />
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Report Protocol Deviation</h2>
            </div>
            <button type="button" aria-label="Close form" onClick={onClose} className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors">
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>
          <p className="font-body-md text-body-md text-outline mt-1">Submit a new deviation report to the TrialDeck compliance log and Jira.</p>
        </div>

        <div className="p-space-lg flex-1 overflow-y-auto flex flex-col gap-space-md">
          {/* Locked site */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">Assigned Clinical Trial Site</label>
            <div className="relative flex items-center">
              <input readOnly value={site.lockedSiteLabel} className="w-full h-8 pl-8 pr-3 bg-surface-container-high text-on-surface-variant rounded font-body-md text-body-md cursor-not-allowed" />
              <Icon name="lock" className="text-outline text-[16px] absolute left-2.5" />
            </div>
            <span className="font-label-sm text-[10px] text-outline mt-1 block">Locked to your authenticated coordinator site</span>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject-id" className="block font-label-md text-label-md text-on-surface mb-1">
              Subject Pseudonym ID <span className="text-error">*</span>
            </label>
            <input id="subject-id" type="text" placeholder="e.g. SUBJ-0105" value={form.subjectId} onChange={set('subjectId')}
              className={`${inputCls} h-8 px-3 font-code text-code ${subjectError ? 'border-error' : ''}`} />
            {subjectError
              ? <span className="font-label-sm text-[10px] text-error mt-1 block">Enter the subject pseudonym ID.</span>
              : <span className="font-label-sm text-[10px] text-outline mt-1 block">Never input real participant patient names or direct identifiers</span>}
          </div>

          {/* Protocol version */}
          <div>
            <label htmlFor="protocol-version" className="block font-label-md text-label-md text-on-surface mb-1">Protocol Version</label>
            <select id="protocol-version" value={form.protocolVersion} onChange={set('protocolVersion')} className={`${inputCls} h-8 px-2.5 font-body-md text-body-md`}>
              <option>v2.2 (Amendment 3)</option>
              <option>v2.1 (Amendment 2)</option>
              <option>v2.0 (Baseline)</option>
            </select>
          </div>

          {/* Classification */}
          <div>
            <span className="block font-label-md text-label-md text-on-surface mb-1.5">Deviation Classification</span>
            <div className="grid grid-cols-2 gap-space-sm">
              {classes.map((c) => (
                <label key={c.value} className="p-2.5 rounded bg-surface-container-low hover:bg-surface-container cursor-pointer flex flex-col gap-1 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded font-bold uppercase ${c.badgeCls}`}>{c.badge}</span>
                    <input type="radio" name="severity" value={c.value} checked={form.severity === c.value} onChange={set('severity')} className="accent-primary" />
                  </div>
                  <span className="font-body-md text-[11px] text-on-surface font-semibold mt-1">{c.title}</span>
                  <span className="font-body-md text-[10px] text-outline">{c.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date-detected" className="block font-label-md text-label-md text-on-surface mb-1">Date Detected</label>
            <input id="date-detected" type="date" value={form.dateDetected} onChange={set('dateDetected')} className={`${inputCls} h-8 px-3 font-body-md text-body-md`} />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="deviation-desc" className="block font-label-md text-label-md text-on-surface mb-1">
              Clinical Description &amp; Immediate Corrective Steps <span className="text-error">*</span>
            </label>
            <textarea id="deviation-desc" rows={4} value={form.description} onChange={set('description')}
              placeholder="Describe the deviation, clinical circumstances, and immediate corrective steps taken..."
              className={`${inputCls} p-2.5 font-body-md text-body-md placeholder:text-outline ${descError ? 'border-error' : ''}`} />
            {descError && <span className="font-label-sm text-[10px] text-error mt-1 block">Add a description and the corrective steps taken.</span>}
          </div>

          {/* PI notify */}
          <div className="p-2.5 rounded bg-amber-50 flex items-start gap-space-sm">
            <input id="pi-notify" type="checkbox" checked={form.notifyPI} onChange={set('notifyPI')} className="mt-0.5 w-4 h-4 rounded text-primary accent-primary cursor-pointer" />
            <label htmlFor="pi-notify" className="font-body-md text-body-md text-amber-950 cursor-pointer">
              <strong className="font-body-bold text-body-bold">Flag for expedited Principal Investigator notification</strong>
              <span className="block text-[11px] text-amber-800 mt-0.5">Triggers high-priority SMS and email alerts to {site.piName} (PI, Pune).</span>
            </label>
          </div>
        </div>

        <div className="p-space-md bg-surface-container-low flex items-center justify-end gap-space-sm">
          <button type="button" onClick={onClose} className="h-8 px-3.5 bg-surface-container hover:bg-surface-container-high rounded text-on-surface font-body-bold text-body-bold transition-colors">
            Cancel
          </button>
          <button type="button" onClick={submit} className="h-8 px-4 bg-primary-container hover:bg-primary text-on-primary rounded font-body-bold text-body-bold shadow-sm transition-colors">
            Submit report
          </button>
        </div>
      </div>
    </>
  );
}