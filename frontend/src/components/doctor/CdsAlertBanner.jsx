import { useState } from 'react';

export default function CdsAlertBanner({ alert, onAcknowledge }) {
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  if (!alert || alert.status !== 'PENDING') return null;

  const severityStyles = {
    CRITICAL: 'bg-red-50 border-red-500 text-red-900',
    WARNING: 'bg-amber-50 border-amber-500 text-amber-900',
    INFO: 'bg-blue-50 border-blue-500 text-blue-900'
  };

  const badgeStyles = {
    CRITICAL: 'bg-red-200 text-red-800',
    WARNING: 'bg-amber-200 text-amber-800',
    INFO: 'bg-blue-200 text-blue-800'
  };

  const handleConfirmOverride = () => {
    onAcknowledge(alert.id, overrideReason);
    setShowOverrideModal(false);
    setOverrideReason('');
  };

  return (
    <>
      <div className={`border-l-4 p-4 rounded-r shadow-sm mb-4 flex items-start justify-between ${severityStyles[alert.severity] || severityStyles.WARNING}`}>
        <div className="flex-1 pr-4">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${badgeStyles[alert.severity] || badgeStyles.WARNING}`}>
              {alert.severity} CDS Alert
            </span>
            <span className="text-xs text-gray-500">
              {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
          <p className="text-sm font-medium">{alert.message}</p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 shadow-sm"
          >
            Acknowledge
          </button>
          <button
            onClick={() => setShowOverrideModal(true)}
            className="px-3 py-1 bg-gray-800 text-white text-xs font-medium rounded hover:bg-gray-900 shadow-sm"
          >
            Override
          </button>
        </div>
      </div>

      <AppModal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        title="Override CDS Alert"
        maxWidth="sm:max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please document the clinical justification for overriding this safety alert:
          </p>
          <div className="p-3 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900">
            {alert.message}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Clinical Override Reason *</label>
            <textarea
              rows={3}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Patient previously tolerated medication under specialist supervision..."
              className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setShowOverrideModal(false)}
              className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              disabled={!overrideReason.trim()}
              onClick={handleConfirmOverride}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              Submit Clinical Override
            </button>
          </div>
        </div>
      </AppModal>
    </>
  );
}
