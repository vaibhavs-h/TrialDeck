import { useState } from 'react';
import Icon from './Icon.jsx';

export default function ConfirmModal({
  open,
  title,
  message,
  details = [],
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTone = 'primary', // 'primary' | 'danger'
  loading = false,
  error = null,
  errorDetails = null,
  onConfirm,
  onCancel
}) {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#091E42]/50 backdrop-blur-[1px] transition-opacity"
        onClick={loading ? undefined : onCancel}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-lg shadow-2xl border border-outline-variant p-space-lg flex flex-col gap-space-md z-[101]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-space-sm">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              confirmTone === 'danger' ? 'bg-[#FFEBE6] text-[#DE350B]' : 'bg-[#DEEBFF] text-[#0052CC]'
            }`}>
              <Icon name={confirmTone === 'danger' ? 'warning' : 'help_outline'} className="text-[20px]" />
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
              {title}
            </h3>
          </div>
          {!loading && (
            <button
              type="button"
              onClick={onCancel}
              className="text-outline hover:text-on-surface rounded p-1"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          )}
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          {message}
        </p>

        {details.length > 0 && (
          <div className="p-space-sm rounded bg-surface-container-low border border-outline-variant/60 flex flex-col gap-1.5 font-body-md text-[12px]">
            {details.map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-2">
                <span className="text-outline font-medium">{label}:</span>
                <span className="font-body-bold text-on-surface text-right break-words max-w-[280px]">
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-3 bg-[#FFEBE6] border border-[#FFBDAD] text-[#DE350B] rounded text-[12px] flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <Icon name="error" className="text-[16px] shrink-0 mt-0.5" />
              <div className="flex-1 break-words font-medium">{error}</div>
            </div>

            {/* Expandable full Jira error details */}
            <div className="border-t border-[#FFBDAD]/60 pt-2">
              <button
                type="button"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                className="text-[11px] font-semibold text-[#BF2600] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Icon name={showErrorDetails ? 'expand_less' : 'expand_more'} className="text-[14px]" />
                <span>{showErrorDetails ? 'Hide Jira Error Details' : 'View Full Jira Error Details'}</span>
              </button>
              {showErrorDetails && (
                <div className="mt-2 p-2 bg-white rounded border border-[#FFBDAD] font-code text-[11px] text-[#172B4D] max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {errorDetails ? (
                    typeof errorDetails === 'string'
                      ? errorDetails
                      : JSON.stringify(errorDetails, null, 2)
                  ) : (
                    error
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-space-sm border-t border-outline-variant/40 flex justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="h-9 px-4 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-body-bold text-body-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`h-9 px-4 rounded text-white font-body-bold text-body-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50 ${
              confirmTone === 'danger'
                ? 'bg-[#DE350B] hover:bg-[#BF2600]'
                : 'bg-[#0052CC] hover:bg-[#0065FF]'
            }`}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                <span>Saving to Jira...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
