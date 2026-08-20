import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';



const PayrollManagement = () => {
  const queryClient = useQueryClient();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  
  const [formData, setFormData] = useState({
    staffId: '',
    monthYear: new Date().toISOString().slice(0, 7), // YYYY-MM
    basicSalary: '',
    allowances: '0',
    deductions: '0'
  });

  const { data: payrolls, isLoading } = useQuery({
    queryKey: ['payrolls'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/hr/payroll');
      return res.data;
    }
  });

  const { data: staffList } = useQuery({
    queryKey: ['staffList'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/users');
      // For a real app we'd filter for staff roles only
      return res.data;
    }
  });

  const generateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post('/hr/payroll/generate', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payrolls']);
      setShowGenerateModal(false);
      setFormData({
        staffId: '',
        monthYear: new Date().toISOString().slice(0, 7),
        basicSalary: '',
        allowances: '0',
        deductions: '0'
      });
      toast.success('Payroll generated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to generate payroll');
    }
  });

  const processMutation = useMutation({
    mutationFn: async (payrollId) => {
      const res = await axiosPrivate.put(`/hr/payroll/${payrollId}/process`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payrolls']);
      toast.success('Payment processed');
    },
    onError: () => {
      toast.error('Failed to process payment');
    }
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    generateMutation.mutate({
      staffId: parseInt(formData.staffId),
      monthYear: formData.monthYear,
      basicSalary: parseFloat(formData.basicSalary),
      allowances: parseFloat(formData.allowances || 0),
      deductions: parseFloat(formData.deductions || 0)
    });
  };

  const getStatusColor = (status) => {
    return status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  return (
    
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payroll Management</h1>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Generate Payroll
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-6">Loading payroll data...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrolls?.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.staff.id} ({p.staff.firstName} {p.staff.lastName})</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.monthYear}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.basicSalary.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${p.netSalary.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {p.status === 'PENDING' && (
                      <button
                        onClick={() => processMutation.mutate(p.id)}
                        disabled={processMutation.isPending}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Process Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {payrolls?.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No payroll records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4">Generate Payroll</h3>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Staff</label>
                <select 
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                  required
                >
                  <option value="">Select Staff</option>
                  {staffList?.map(user => (
                    <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Month/Year</label>
                <input 
                  type="month" 
                  value={formData.monthYear}
                  onChange={(e) => setFormData({ ...formData, monthYear: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Basic Salary</label>
                <input 
                  type="number" step="0.01"
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Allowances</label>
                  <input 
                    type="number" step="0.01"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deductions</label>
                  <input 
                    type="number" step="0.01"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    
  );
};

export default PayrollManagement;
