import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import toast from 'react-hot-toast';

const HistorySection = ({ patientId, title, endpoint, icon: Icon, columns, formFields, renderRow }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: records, isLoading } = useQuery({
    queryKey: [title, patientId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/emr/${endpoint}/patient/${patientId}`);
      return res.data;
    },
    enabled: !!patientId,
  });

  const mutation = useMutation({
    mutationFn: async (newRecord) => {
      const payload = { ...newRecord, patientId, recordedByUserId: 1, recordedAt: new Date().toISOString() };
      return await axiosPrivate.post(`/emr/${endpoint}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([title, patientId]);
      queryClient.invalidateQueries(['chartSummary', patientId]);
      toast.success(`${title} added successfully!`);
      setIsAdding(false);
      setFormData({});
    },
    onError: () => toast.error('Failed to save record')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            {Icon ? <Icon size={18} /> : <Activity size={18} />}
          </div>
          <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-indigo-700"
          >
            <Plus size={14} /> Add New
          </button>
        )}
      </div>

      <div className="p-6">
        {isAdding && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border border-indigo-100 bg-indigo-50/30 rounded-lg relative">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
            <h4 className="text-sm font-bold text-indigo-900 mb-4">Add {title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formFields.map(field => (
                <div key={field.name}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{field.label}</label>
                  {field.type === 'select' ? (
                    <select 
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      value={formData[field.name] || ''}
                      onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                      required={field.required}
                    >
                      <option value="">Select...</option>
                      {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input 
                      type={field.type || 'text'}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      value={formData[field.name] || ''}
                      onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={mutation.isLoading}
                className="text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {mutation.isLoading ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        ) : records && records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="px-4 py-3 font-semibold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map(record => renderRow(record))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">No records found.</p>
        )}
      </div>
    </div>
  );
};

export default HistorySection;
