import { useEffect, useState } from 'react';
import logger from '../../utils/logger';
import { useClinicalDecisionStore } from '../../store/useClinicalDecisionStore';

export default function OrderSetPicker({ isOpen, onClose, patientId = 1, diagnosisCode = '', onApplied }) {
  const { orderSets, fetchOrderSets, applyOrderSet, loading, error } = useClinicalDecisionStore();
  const [selectedOrderSet, setSelectedOrderSet] = useState(null);
  const [applyResult, setApplyResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchOrderSets(diagnosisCode);
      setApplyResult(null);
      setSelectedOrderSet(null);
    }
  }, [isOpen, diagnosisCode]);

  const handleApply = async (templateId) => {
    try {
      const res = await applyOrderSet(templateId, patientId);
      setApplyResult(res);
      if (onApplied) onApplied(res);
    } catch (err) {
      logger.error(err);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Smart Order Sets ${diagnosisCode ? `(Diagnosis: ${diagnosisCode})` : ''}`}
      maxWidth="sm:max-w-3xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
            {error}
          </div>
        )}

        {applyResult ? (
          <div className="space-y-3 bg-emerald-50 p-4 rounded border border-emerald-200">
            <h4 className="text-sm font-bold text-emerald-900">
              ✓ Applied Order Set: {applyResult.orderSetName}
            </h4>
            <p className="text-xs text-emerald-800">
              Successfully generated prescription for {applyResult.appliedMedicationCount} medication items through CDS safety check gate.
            </p>

            {applyResult.skippedItems && applyResult.skippedItems.length > 0 && (
              <div className="mt-2 p-3 bg-amber-50 rounded border border-amber-200">
                <p className="text-xs font-bold text-amber-900">Skipped Non-Medication Items ({applyResult.skippedItems.length}):</p>
                <ul className="list-disc list-inside text-xs text-amber-800 mt-1 space-y-1">
                  {applyResult.skippedItems.map((item, i) => (
                    <li key={i}>
                      <span className="font-semibold">{item.type || 'ORDER'}:</span> {item.code || item.name || 'Item'} — {item.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
              >
                Close & Return to Order Composition
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500">
              Standardized evidence-based order bundles for diagnosis-guided ordering.
            </p>

            {loading ? (
              <p className="text-xs text-gray-500 py-4">Loading order set catalog...</p>
            ) : orderSets.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-4">No order set templates match diagnosis {diagnosisCode}.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-1">
                {orderSets.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg hover:border-indigo-500 cursor-pointer transition ${
                      selectedOrderSet?.id === template.id ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200' : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => setSelectedOrderSet(template)}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-gray-900">{template.name}</h4>
                      <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Diagnosis Codes: {template.diagnosisCodes}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApply(template.id);
                      }}
                      className="mt-3 w-full py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 shadow-sm"
                    >
                      Apply Order Set Bundle
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppModal>
  );
}
