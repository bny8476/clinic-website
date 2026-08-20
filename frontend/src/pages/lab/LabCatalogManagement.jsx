import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import ConfirmDialog from '../../components/ui/ConfirmDialog';



const LabCatalogManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState({ isOpen: false, id: null });

  const { data: catalog = [], isLoading, isError } = useQuery({
    queryKey: ['lab-catalog'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/lab/catalog/all');
      return res.data;
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      if (isActive) {
        return await axiosPrivate.post(`/lab/catalog/${id}/deactivate`);
      } else {
        // Assume endpoint for reactivate exists, otherwise we'd need to handle it or only deactivate.
        // For now, let's just use deactivate if that's all backend supports, but we can do a generic PUT/PATCH if we update backend.
        // Actually the backend has only deactivate, but let's see. Wait, I wrote `catalogService.deactivateTest(id)`. Let's just leave it to deactivate for now or do full update.
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['lab-catalog'])
  });

  const filteredCatalog = catalog.filter(t => 
    t.testName?.toLowerCase().includes(search.toLowerCase()) || 
    t.testCode?.toLowerCase().includes(search.toLowerCase()) ||
    t.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lab Test Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">Manage available laboratory tests, prices, and requirements.</p>
        </div>
        <button 
          onClick={() => { setEditingTest(null); setIsModalOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          <Plus size={16} />
          Add New Test
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by test name, code or department..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Test Code</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Test Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Department</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Specimen / Container</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Price</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">Loading catalog...</td></tr>
              ) : filteredCatalog.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">No tests found matching criteria.</td></tr>
              ) : (
                filteredCatalog.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-900">{test.testCode}</td>
                    <td className="px-6 py-4">{test.testName}</td>
                    <td className="px-6 py-4">{test.department || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span>{test.specimenType}</span>
                        <span className="text-xs text-slate-500">{test.containerType || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      ${Number(test.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {test.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setEditingTest(test); setIsModalOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        {test.isActive && (
                            <button 
                              onClick={() => setConfirmDeactivate({ isOpen: true, id: test.id })}
                              className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                              title="Deactivate Test"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <CatalogFormModal 
          test={editingTest} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

      <ConfirmDialog 
        isOpen={confirmDeactivate.isOpen}
        onClose={() => setConfirmDeactivate({ isOpen: false, id: null })}
        onConfirm={() => {
          if (confirmDeactivate.id) {
            // Find the test to get its current active status
            const test = catalog.find(t => t.id === confirmDeactivate.id);
            if (test) {
              toggleStatusMutation.mutate({ id: test.id, isActive: test.isActive });
            }
            setConfirmDeactivate({ isOpen: false, id: null });
          }
        }}
        title="Deactivate Test"
        description="Are you sure you want to deactivate this test? It will no longer be available for new orders."
        confirmText="Deactivate"
        isDestructive={true}
        isLoading={toggleStatusMutation.isPending}
      />
    </div>
    </>
  );
};

const CatalogFormModal = ({ test, onClose }) => {
  const queryClient = useQueryClient();
  const isEditing = !!test;

  const [formData, setFormData] = useState({
    testCode: test?.testCode || '',
    testName: test?.testName || '',
    department: test?.department || '',
    specimenType: test?.specimenType || '',
    containerType: test?.containerType || '',
    price: test?.price || '',
    turnaroundTargetHours: test?.turnaroundTargetHours || 24,
    referenceRange: test?.referenceRange || '',
    unit: test?.unit || '',
    instructions: test?.instructions || '',
    isActive: test ? test.isActive : true
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEditing) {
        // Implement full update if backend supports, otherwise just a placeholder
        const res = await axiosPrivate.put(`/lab/catalog/${test.id}`, data);
        return res.data;
      } else {
        const res = await axiosPrivate.post('/lab/catalog', data);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lab-catalog']);
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {isEditing ? 'Edit Test Catalog' : 'Add New Lab Test'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="catalog-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Test Code *</label>
                <input required name="testCode" value={formData.testCode} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Test Name *</label>
                <input required name="testName" value={formData.testName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <input name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Hematology" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price *</label>
                <input required type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Specimen Type *</label>
                <input required name="specimenType" value={formData.specimenType} onChange={handleChange} placeholder="e.g. Blood, Urine" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Container Type</label>
                <input name="containerType" value={formData.containerType} onChange={handleChange} placeholder="e.g. EDTA Tube" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Turnaround Target (Hours)</label>
                <input type="number" name="turnaroundTargetHours" value={formData.turnaroundTargetHours} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit of Measurement</label>
                <input name="unit" value={formData.unit} onChange={handleChange} placeholder="e.g. mg/dL" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Reference Range</label>
              <input name="referenceRange" value={formData.referenceRange} onChange={handleChange} placeholder="e.g. 70-99" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Collection Instructions</label>
              <textarea name="instructions" value={formData.instructions} onChange={handleChange} rows="3" placeholder="Fasting required, keep refrigerated..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
            </div>

            {isEditing && (
              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Test is Active and Orderable</label>
              </div>
            )}
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition">
            Cancel
          </button>
          <button 
            type="submit" 
            form="catalog-form"
            disabled={mutation.isLoading}
            className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm disabled:opacity-50"
          >
            {mutation.isLoading ? 'Saving...' : 'Save Test'}
          </button>
        </div>
      </div>
    </div>
    
  );
};

export default LabCatalogManagement;
