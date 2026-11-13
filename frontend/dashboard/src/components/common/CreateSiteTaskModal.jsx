import { useState } from 'react';
import Icon from './Icon.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import { useMutation, useCreateMeta } from '../../hooks/useDeviations.js';

const fieldCls =
  'w-full bg-surface-container-lowest border border-outline-variant rounded text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all';

export default function CreateSiteTaskModal({ open, onClose, onCreated, defaultSite }) {
  const { data: meta } = useCreateMeta();
  const { mutate: doCreate, loading, error, reset } = useMutation('createSiteTask');

  const [form, setForm] = useState({
    site: defaultSite || 'Site 1',
    title: '',
    type: 're-consent',
    dueDate: ''
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [valError, setValError] = useState(null);

  if (!open) return null;

  const handleProceed = (e) => {
    e.preventDefault();
    setValError(null);
    reset();

    if (!form.title?.trim()) {
      setValError('Task title is required.');
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      const res = await doCreate(form);
      setConfirmOpen(false);
      onCreated?.(res);
      onClose();
    } catch (e) {
      // Error in mutation state
    }
  };

  const sites = meta?.options?.site || [{ value: 'Site 1', label: 'Site 1' }, { value: 'Site 4', label: 'Site 4' }];

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-[#091E42]/50 backdrop-blur-[1px]" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-lg shadow-2xl border border-outline-variant p-6 z-[81]">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
            <div className="flex items-center gap-2">
              <Icon name="add_task" className="text-primary text-[22px]" />
              <h3 className="font-headline-md font-bold text-on-surface">Create Trial Site Task</h3>
            </div>
            <button type="button" onClick={onClose} className="text-outline hover:text-on-surface">
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>

          <form onSubmit={handleProceed} className="flex flex-col gap-3.5 pt-4">
            {valError && (
              <div className="p-2.5 bg-[#FFEBE6] border border-[#FFBDAD] text-[#DE350B] rounded text-[12px]">
                {valError}
              </div>
            )}

            <div>
              <label className="block font-label-md text-on-surface mb-1">Trial Site *</label>
              <select
                value={form.site}
                onChange={(e) => setForm({ ...form, site: e.target.value })}
                className={`${fieldCls} h-9 px-3 font-body-md`}
              >
                {sites.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-label-md text-on-surface mb-1">Task Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className={`${fieldCls} h-9 px-3 font-body-md`}
              >
                <option value="re-consent">Re-consent Checkpoint</option>
                <option value="retraining">Staff Retraining</option>
                <option value="irb-approval">IRB Protocol Approval</option>
                <option value="form-update">eCRF Form Update</option>
                <option value="audit-review">GCP Audit Review</option>
              </select>
            </div>

            <div>
              <label className="block font-label-md text-on-surface mb-1">Task Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Upload signed IRB approval addendum"
                className={`${fieldCls} h-9 px-3 font-body-md`}
              />
            </div>

            <div>
              <label className="block font-label-md text-on-surface mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className={`${fieldCls} h-9 px-3 font-body-md`}
              />
            </div>

            <div className="pt-3 border-t border-outline-variant/60 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded bg-surface-container hover:bg-surface-container-high font-body-bold text-body-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded bg-primary-container hover:bg-primary text-on-primary font-body-bold text-body-bold shadow-sm"
              >
                Review &amp; Create
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Site Task"
        message="Create a site checkpoint Task in space CLIN. It will appear on the coordinator dashboard."
        confirmLabel="Create Task"
        loading={loading}
        error={error}
        details={[
          { label: 'Site', value: form.site },
          { label: 'Type', value: form.type },
          { label: 'Title', value: form.title },
          { label: 'Target Due Date', value: form.dueDate || 'No due date set' }
        ]}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
