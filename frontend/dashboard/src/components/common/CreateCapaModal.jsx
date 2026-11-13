import { useState } from 'react';
import Icon from './Icon.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import { useMutation } from '../../hooks/useDeviations.js';

const fieldCls =
  'w-full bg-surface-container-lowest border border-outline-variant rounded text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all';

export default function CreateCapaModal({ open, onClose, onCreated, defaultDeviationKey, defaultTitle }) {
  const { mutate: doCreate, loading, error, reset } = useMutation('createCapaTask');

  const [form, setForm] = useState({
    deviationKey: defaultDeviationKey || '',
    title: defaultTitle ? `CAPA: ${defaultTitle}` : '',
    dueDate: '',
    description: '',
    assigneeAccountId: ''
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [valError, setValError] = useState(null);

  if (!open) return null;

  const handleProceed = (e) => {
    e.preventDefault();
    setValError(null);
    reset();

    if (!form.deviationKey?.trim()) {
      setValError('Deviation key is required.');
      return;
    }
    if (!form.title?.trim()) {
      setValError('Title is required.');
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

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-[#091E42]/50 backdrop-blur-[1px]" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-lg shadow-2xl border border-outline-variant p-6 z-[81]">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
            <div className="flex items-center gap-2">
              <Icon name="assignment_turned_in" className="text-primary text-[22px]" />
              <h3 className="font-headline-md font-bold text-on-surface">Create Linked CAPA Task</h3>
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
              <label className="block font-label-md text-on-surface mb-1">Target Deviation Key *</label>
              <input
                type="text"
                value={form.deviationKey}
                onChange={(e) => setForm({ ...form, deviationKey: e.target.value })}
                placeholder="e.g. CLIN-1"
                className={`${fieldCls} h-9 px-3 font-code`}
              />
            </div>

            <div>
              <label className="block font-label-md text-on-surface mb-1">CAPA Action Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Re-train site nurses on dose escalation SOP"
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

            <div>
              <label className="block font-label-md text-on-surface mb-1">Action Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detailed corrective and preventive measures..."
                className={`${fieldCls} p-2.5 font-body-md text-[13px]`}
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
                Preview CAPA
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm CAPA Creation"
        message={`This will create a new Task in Jira space CLIN and link it directly to ${form.deviationKey}.`}
        confirmLabel="Create & Link Task"
        loading={loading}
        error={error}
        details={[
          { label: 'Deviation', value: form.deviationKey },
          { label: 'Title', value: form.title },
          { label: 'Target Due Date', value: form.dueDate || 'No due date set' }
        ]}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
