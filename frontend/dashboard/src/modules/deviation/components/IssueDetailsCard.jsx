import { useState } from 'react';
import Icon from '../../../components/common/Icon.jsx';
import ConfirmModal from '../../../components/common/ConfirmModal.jsx';
import { useCreateMeta, useMutation } from '../../../hooks/useDeviations.js';

export default function IssueDetailsCard({ d, onUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [category, setCategory] = useState(d?.category || '');
  const [rootCause, setRootCause] = useState(d?.rootCause || '');
  const [dueDate, setDueDate] = useState(d?.dueDate || '');
  const [showConfirm, setShowConfirm] = useState(false);

  const { meta } = useCreateMeta();
  const { execute: doUpdate, loading: saving, error: saveError } = useMutation('updateDeviation');

  if (!d) return null;

  const handleStartEdit = () => {
    setCategory(d.category || '');
    setRootCause(d.rootCause || '');
    setDueDate(d.dueDate || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await doUpdate({
        issueKey: d.key,
        category,
        rootCause,
        dueDate: dueDate || null,
      });
      setShowConfirm(false);
      setIsEditing(false);
      onUpdated?.();
    } catch (err) {
      console.error('Failed to update deviation', err);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded p-space-md shadow-sm">
      <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/60">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Details</span>
        {!isEditing ? (
          <button
            type="button"
            onClick={handleStartEdit}
            className="text-[12px] text-[#0052CC] font-semibold hover:underline flex items-center gap-1"
          >
            <Icon name="edit" className="text-[14px]" /> Edit Fields
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-[12px] text-[#6B778C] hover:underline"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="text-[12px] text-white bg-[#0052CC] hover:bg-[#0065FF] px-2 py-0.5 rounded font-semibold"
            >
              Save
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 pt-space-xs font-body-md text-body-md items-center">
        <span className="text-secondary">Assignee:</span>
        <span className="font-body-bold text-body-bold text-on-surface flex items-center gap-1.5 truncate">
          <span className="w-4 h-4 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-[9px] font-bold shrink-0">
            {d.assignee?.initials || 'U'}
          </span>
          <span className="truncate">{d.assignee?.name || 'Unassigned'}</span>
        </span>

        <span className="text-secondary">Reporter:</span>
        <span className="font-body-bold text-body-bold text-on-surface truncate">{d.reporter || 'Study Staff'}</span>

        <span className="text-secondary">Category:</span>
        {isEditing ? (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-[#DFE1E6] rounded px-1.5 py-0.5 text-[12px]"
          >
            <option value="">Select...</option>
            {(meta?.categories || ['major', 'minor']).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        ) : (
          <span className="font-body-bold text-body-bold text-on-surface uppercase">{d.category}</span>
        )}

        <span className="text-secondary">Root Cause:</span>
        {isEditing ? (
          <select
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            className="border border-[#DFE1E6] rounded px-1.5 py-0.5 text-[12px]"
          >
            <option value="">Select...</option>
            {(meta?.rootCauses || ['training', 'process', 'equipment', 'oversight']).map((rc) => (
              <option key={rc} value={rc}>{rc}</option>
            ))}
          </select>
        ) : (
          <span className="font-body-bold text-body-bold text-on-surface truncate">{d.rootCause}</span>
        )}

        <span className="text-secondary">CAPA Due Date:</span>
        {isEditing ? (
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="border border-[#DFE1E6] rounded px-1.5 py-0.5 text-[12px]"
          />
        ) : (
          <span className="font-body-bold text-body-bold text-on-surface truncate">
            {d.dueDate ? new Date(d.dueDate).toLocaleDateString() : 'Not set'}
          </span>
        )}

        <span className="text-secondary">Protocol Version:</span>
        <span className="font-body-bold text-body-bold text-on-surface truncate">{d.protocolVersion}</span>

        <span className="text-secondary">Report Status:</span>
        <span className="font-body-bold text-body-bold text-on-surface truncate">{d.reportStatus}</span>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title={`Update Deviation: ${d.key}`}
        confirmLabel="Save to Jira"
        isLoading={saving}
        error={saveError}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
      >
        <div className="space-y-2 text-body-md text-[#172B4D]">
          <p>Confirm updating live Jira fields for <strong>{d.key}</strong>:</p>
          <ul className="list-disc pl-5 text-[12px] space-y-1">
            <li>Category: <strong>{category}</strong></li>
            <li>Root Cause: <strong>{rootCause}</strong></li>
            <li>CAPA Due Date: <strong>{dueDate || 'None'}</strong></li>
          </ul>
        </div>
      </ConfirmModal>
    </div>
  );
}
