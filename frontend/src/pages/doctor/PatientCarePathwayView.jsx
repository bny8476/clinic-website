import { useEffect, useState } from 'react';
import logger from '../../utils/logger';
import { useClinicalDecisionStore } from '../../store/useClinicalDecisionStore';

export default function PatientCarePathwayView({ patientId = 1 }) {
  const {
    patientPathways,
    pathwayTemplates,
    fetchPatientPathways,
    fetchPathwayTemplates,
    assignPathway,
    startPathwayStep,
    completePathwayStep,
    loading
  } = useClinicalDecisionStore();

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  useEffect(() => {
    if (patientId) {
      fetchPatientPathways(patientId);
      fetchPathwayTemplates();
    }
  }, [patientId]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTemplateId) return;
    try {
      await assignPathway(patientId, Number(selectedTemplateId));
      setIsAssignModalOpen(false);
      setSelectedTemplateId('');
    } catch (err) {
      logger.error(err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Active Patient Care Pathways</h2>
          <p className="text-xs text-gray-500">Standardized clinical progress timeline and step management.</p>
        </div>
        <button
          onClick={() => setIsAssignModalOpen(true)}
          className="px-3 py-1.5 bg-indigo-600 text-white font-medium rounded text-xs hover:bg-indigo-700 shadow-sm"
        >
          + Assign Pathway
        </button>
      </div>

      {loading && <p className="text-xs text-gray-500">Loading pathways...</p>}

      {!loading && patientPathways.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded border border-dashed border-gray-300">
          <p className="text-sm font-medium text-gray-600">No care pathways currently assigned to this patient.</p>
          <p className="text-xs text-gray-400 mt-1">Assign a clinical pathway to initiate structured care protocols.</p>
        </div>
      ) : (
        patientPathways.map(pathway => (
          <div key={pathway.id} className="border border-gray-200 rounded-lg p-5 bg-gray-50 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Pathway Protocol #{pathway.id}</span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5">Template ID: {pathway.templateId}</h3>
                <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                  <span>Start Date: {pathway.startDate}</span>
                  <span>Target End Date: {pathway.targetEndDate || 'N/A'}</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-xs font-bold rounded ${
                pathway.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                pathway.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {pathway.status}
              </span>
            </div>

            <div className="bg-white rounded p-4 border border-gray-200">
              <CarePathwayTimeline
                pathway={pathway}
                onStartStep={(stepId) => startPathwayStep(stepId, patientId)}
                onCompleteStep={(stepId) => completePathwayStep(stepId, patientId)}
              />
            </div>
          </div>
        ))
      )}

      {/* Modal to Assign Pathway */}
      <AppModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Care Pathway Template"
        maxWidth="sm:max-w-md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Select Pathway Protocol *</label>
            <select
              required
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Choose Care Pathway Template --</option>
              {pathwayTemplates.map(tmpl => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name} ({tmpl.indication} - {tmpl.estimatedDurationDays} Days)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTemplateId}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              Assign to Patient
            </button>
          </div>
        </form>
      </AppModal>
    </div>
  );
}
