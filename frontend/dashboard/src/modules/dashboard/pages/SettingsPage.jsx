import { useState } from 'react';
import { useSettings, useMutation } from '../../../hooks/useDeviations.js';
import Icon from '../../../components/common/Icon.jsx';
import ConfirmModal from '../../../components/common/ConfirmModal.jsx';

export default function SettingsPage() {
  const { data: initialSettings, loading: loadingSettings, refetch } = useSettings();
  const { mutate: doSave, loading: saving, error } = useMutation('saveSettings');

  const [form, setForm] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize form when settings load
  const settings = form || initialSettings || {
    overdueThresholdDays: 0,
    targetThreshold: 15,
    repeatIssueThreshold: 2
  };

  const handleSave = (e) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  const confirmSave = async () => {
    try {
      await doSave(settings);
      setConfirmOpen(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      refetch();
    } catch (e) {
      // Handled by mutation error state
    }
  };

  if (loadingSettings) {
    return <div className="p-12 text-center text-[#6B778C]">Loading app settings...</div>;
  }

  return (
    <div className="flex flex-col w-full pb-16 max-w-4xl">
      <div className="py-4">
        <h1 className="font-headline-lg text-headline-lg text-[#172B4D]">Operational Governance Settings</h1>
        <p className="text-body-md text-[#6B778C]">Configure protocol compliance thresholds stored securely in Forge storage.</p>
      </div>

      {savedSuccess && (
        <div className="p-3 mb-4 bg-[#E3FCEF] border border-[#ABF5D1] text-[#006644] rounded flex items-center gap-2">
          <Icon name="check_circle" className="text-[18px]" />
          <span>Governance settings saved to Forge storage successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="jira-card p-6 flex flex-col gap-6">
        <div>
          <h2 className="font-headline-md font-semibold text-[#172B4D] mb-1">Thresholds &amp; Alerts</h2>
          <p className="font-body-md text-[#6B778C] text-[13px]">
            Controls for deviation escalation indicators and repeat incident algorithms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#DFE1E6]">
          <div>
            <label className="block font-headline-sm text-headline-sm text-[#172B4D] mb-1">
              Target Open Deviations Threshold
            </label>
            <p className="font-body-md text-[12px] text-[#6B778C] mb-2">
              Maximum allowable concurrent open deviations across all active investigator sites.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="100"
                value={settings.targetThreshold}
                onChange={(e) => setForm({ ...settings, targetThreshold: Number(e.target.value) })}
                className="w-28 h-9 px-3 border border-[#DFE1E6] rounded font-body-md text-body-md"
              />
              <span className="font-body-md text-[#6B778C]">incidents max</span>
            </div>
          </div>

          <div>
            <label className="block font-headline-sm text-headline-sm text-[#172B4D] mb-1">
              Repeat Incident Sensitivity Rule
            </label>
            <p className="font-body-md text-[12px] text-[#6B778C] mb-2">
              Threshold of repeat incidents at one site with the same root cause or summary keyword before flagging for QA audit.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="2"
                max="10"
                value={settings.repeatIssueThreshold}
                onChange={(e) => setForm({ ...settings, repeatIssueThreshold: Number(e.target.value) })}
                className="w-28 h-9 px-3 border border-[#DFE1E6] rounded font-body-md text-body-md"
              />
              <span className="font-body-md text-[#6B778C]">occurrences</span>
            </div>
          </div>

          <div>
            <label className="block font-headline-sm text-headline-sm text-[#172B4D] mb-1">
              CAPA Overdue Grace Period (Days)
            </label>
            <p className="font-body-md text-[12px] text-[#6B778C] mb-2">
              Grace period in days after the due date before an action plan is flagged as Breached.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="30"
                value={settings.overdueThresholdDays}
                onChange={(e) => setForm({ ...settings, overdueThresholdDays: Number(e.target.value) })}
                className="w-28 h-9 px-3 border border-[#DFE1E6] rounded font-body-md text-body-md"
              />
              <span className="font-body-md text-[#6B778C]">days grace</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#DFE1E6] flex justify-end">
          <button
            type="submit"
            className="h-9 px-5 bg-primary-container hover:bg-primary text-on-primary rounded font-body-bold text-body-bold transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Icon name="save" className="text-[18px]" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      <ConfirmModal
        open={confirmOpen}
        title="Save Operational Settings"
        message="These settings will update the target threshold labels and repeat-issue alerting rules across the application."
        confirmLabel="Save to Storage"
        loading={saving}
        error={error}
        details={[
          { label: 'Target Threshold', value: `≤ ${settings.targetThreshold} deviations` },
          { label: 'Repeat Issue Rule', value: `≥ ${settings.repeatIssueThreshold} identical incidents` },
          { label: 'Grace Period', value: `${settings.overdueThresholdDays} days` }
        ]}
        onConfirm={confirmSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

