import { useState, useEffect } from 'react';
import logger from '../../utils/logger';
import { useClinicalDecisionStore } from '../../store/useClinicalDecisionStore';
import useAuthStore from '../../store/authStore';

export default function CarePathwayBuilder() {
  const { user } = useAuthStore();
  const { pathwayTemplates, fetchPathwayTemplates, savePathwayTemplate, deletePathwayTemplate, loading } = useClinicalDecisionStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [indication, setIndication] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [steps, setSteps] = useState([
    { title: 'Initial Clinical Assessment', description: 'Evaluate patient symptoms', type: 'TASK', dueOffsetDays: 0 },
    { title: 'Baseline Blood Panel', description: 'Order CBC and Electrolytes', type: 'LAB_ORDER', dueOffsetDays: 1 }
  ]);

  useEffect(() => {
    fetchPathwayTemplates();
  }, []);

  const isAdmin = user && (user.roles?.includes('ROLE_ADMIN') || user.roles?.includes('ROLE_SUPER_ADMIN') || user.roles?.includes('ROLE_BRANCH_ADMIN'));

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700 font-medium">
          Access Denied: Care Pathway Builder is restricted to Admin roles.
        </div>
      </div>
    );
  }

  const handleAddStep = () => {
    setSteps([...steps, { title: '', description: '', type: 'TASK', dueOffsetDays: 0 }]);
  };

  const handleUpdateStep = (index, field, value) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  const handleRemoveStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await savePathwayTemplate({
        name: templateName,
        indication: indication,
        estimatedDurationDays: Number(durationDays),
        steps: JSON.stringify(steps)
      });
      setIsModalOpen(false);
      setTemplateName('');
      setIndication('');
      setDurationDays(7);
    } catch (err) {
      logger.error(err);
    }
  };

  const columns = [
    { header: 'Pathway Name', accessorKey: 'name' },
    { header: 'Indication', accessorKey: 'indication' },
    { header: 'Est. Duration (Days)', accessorKey: 'estimatedDurationDays' },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <button
          onClick={() => deletePathwayTemplate(row.original.id)}
          className="text-xs text-red-600 hover:text-red-800 font-medium"
        >
          Delete
        </button>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Care Pathway Builder</h1>
          <p className="text-sm text-gray-500">Author standardized clinical protocols and care pathways.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg text-sm hover:bg-indigo-700 shadow-sm"
        >
          + Create Pathway Template
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <DataTable columns={columns} data={pathwayTemplates} loading={loading} hover striped />
      </div>

      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Build New Care Pathway Template"
        maxWidth="sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pathway Name *</label>
              <input
                type="text"
                required
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Type 2 Diabetes Initial Management"
                className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Indication / Condition *</label>
              <input
                type="text"
                required
                value={indication}
                onChange={(e) => setIndication(e.target.value)}
                placeholder="e.g. Diabetes Mellitus (E11)"
                className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Duration (Days)</label>
            <input
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase">Pathway Steps</label>
              <button
                type="button"
                onClick={handleAddStep}
                className="text-xs text-indigo-600 font-medium hover:underline"
              >
                + Add Step
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {steps.map((step, idx) => (
                <div key={idx} className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-600">Step #{idx + 1}</span>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Step Title"
                      value={step.title}
                      onChange={(e) => handleUpdateStep(idx, 'title', e.target.value)}
                      className="col-span-2 text-xs border border-gray-300 rounded p-1.5"
                    />
                    <select
                      value={step.type}
                      onChange={(e) => handleUpdateStep(idx, 'type', e.target.value)}
                      className="text-xs border border-gray-300 rounded p-1.5"
                    >
                      <option value="TASK">TASK</option>
                      <option value="APPOINTMENT">APPOINTMENT</option>
                      <option value="LAB_ORDER">LAB_ORDER</option>
                      <option value="MEDICATION">MEDICATION</option>
                      <option value="NURSING_ACTION">NURSING_ACTION</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Instructions / Description"
                      value={step.description}
                      onChange={(e) => handleUpdateStep(idx, 'description', e.target.value)}
                      className="col-span-2 text-xs border border-gray-300 rounded p-1.5"
                    />
                    <input
                      type="number"
                      placeholder="Due Offset (Days)"
                      value={step.dueOffsetDays}
                      onChange={(e) => handleUpdateStep(idx, 'dueOffsetDays', Number(e.target.value))}
                      className="text-xs border border-gray-300 rounded p-1.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700"
            >
              Save Care Pathway
            </button>
          </div>
        </form>
      </AppModal>
    </div>
  );
}
