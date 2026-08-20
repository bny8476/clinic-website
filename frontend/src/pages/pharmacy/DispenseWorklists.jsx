import { useState } from 'react';
import useDebounce from '../../hooks/pharmacy/useDebounce';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { usePageData } from '../../hooks/pharmacy/usePageData';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import api from '../../utils/pharmacy/api';
import { v4 as uuidv4 } from 'uuid';



export default function DispenseWorklists() {
  const queryClient = useQueryClient();
  const { items: filteredPrescriptions = [], isLoading: loading } = usePageData('dispense-worklists', '/pharmacy/prescriptions/pending');

  // Local filter states
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [partialDispense, setPartialDispense] = useState(false);
  const [dispenseItems, setDispenseItems] = useState([]);

  const dispenseMutation = useMutation({
    mutationFn: (data) => api.post(`/pharmacy/prescriptions/${selectedPrescription.id}/dispense`, data, {
      headers: { 'Idempotency-Key': idempotencyKey }
    }),
    onSuccess: () => {
      toast.success('Medicines dispensed successfully!');
      setIsModalOpen(false);
      queryClient.invalidateQueries(['dispense-worklists']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to dispense medicines');
    }
  });

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'ID', accessor: 'id' },
    { header: 'Patient Name', accessor: 'patientName' },
    { header: 'Doctor', accessor: 'doctorName' },
    { header: 'Prescription Date', render: (row) => new Date(row.prescriptionDate).toLocaleDateString('en-IN') },
    { header: 'Status', render: (row) => (
      <Badge variant={row.status === 'PENDING' ? 'danger' : 'warning'}>{row.status}</Badge>
    )},
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View" 
          onClick={() => { setSelectedPrescription(row); setIsViewModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button 
          title="Dispense" 
          onClick={() => { 
            setSelectedPrescription(row); 
            setIdempotencyKey(uuidv4());
            setPartialDispense(false);
            setDispenseItems(row.items?.map(item => ({
              id: item.id,
              medicineId: item.medicineId,
              medicationName: item.medicationName,
              quantity: item.prescribedQuantity || 1
            })) || []);
            setIsModalOpen(true); 
          }}
          className="p-1.5 text-success hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Pill className="w-4 h-4" />
        </button>
      </div>
    )}
  ];

  // Filtering logic
  const filteredData = filteredPrescriptions.filter(row => {
    const s = debouncedSearch.toLowerCase();
    return !debouncedSearch || 
      row.id?.toString().toLowerCase().includes(s) || 
      row.patientName?.toLowerCase().includes(s) || 
      row.doctorName?.toLowerCase().includes(s);
  });

  return (
    
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Pending Dispense List</h2>
        <p className="text-sm text-gray-500 font-medium">Verify and dispense prescribed medicines to wards</p>
      </div>

      <ModuleFilterBar searchPlaceholder="Search..." 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : (
          <>
            <DataTable columns={columns} data={filteredData} hover striped />
            <Pagination totalRecords={filteredData.length} currentPage={1} pageSize={10} onPageChange={() => {}} onPageSizeChange={() => {}} />
          </>
        )}
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Medicine Dispensing"
        maxWidth="sm:max-w-4xl"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all font-display">Cancel</button>
             <button 
               onClick={() => dispenseMutation.mutate({ items: dispenseItems, partialDispense })} 
               disabled={dispenseMutation.isLoading}
               className="flex-1 px-6 py-2.5 bg-success text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all font-display disabled:opacity-50"
             >
               {dispenseMutation.isLoading ? 'Dispensing...' : 'Confirm Dispense'}
             </button>
          </div>
        }
      >
        {selectedPrescription && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient Details</p>
                  <p className="text-sm font-bold text-slate-800">{selectedPrescription.patientName}</p>
                  <p className="text-xs text-slate-500">{selectedPrescription.doctorName}</p>
               </div>
               <div className="text-right">
                  <Badge variant="danger">{selectedPrescription.status}</Badge>
                  <p className="text-xs font-bold text-slate-400 mt-2">Pr-ID: {selectedPrescription.id}</p>
               </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input 
                type="checkbox" 
                id="partialDispense" 
                checked={partialDispense} 
                onChange={(e) => setPartialDispense(e.target.checked)} 
                className="rounded border-gray-300 text-success focus:ring-success"
              />
              <label htmlFor="partialDispense" className="text-sm font-medium text-gray-700">Allow Partial Dispense</label>
            </div>

            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-sm font-bold text-slate-700">Prescribed Medicines</th>
                    <th className="px-4 py-3 text-sm font-bold text-slate-700 w-32 text-center">Dispense Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {dispenseItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">{item.medicationName}</td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          min="0"
                          value={item.quantity} 
                          onChange={(e) => {
                            const newItems = [...dispenseItems];
                            newItems[idx].quantity = parseInt(e.target.value) || 0;
                            setDispenseItems(newItems);
                          }}
                          className="w-full text-center border border-slate-200 rounded-lg py-1.5 outline-none focus:border-success font-bold text-success" 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AppModal>

      <AppModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Prescription Details"
        maxWidth="sm:max-w-xl"
      >
        {selectedPrescription && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Patient</p>
                <p className="font-bold">{selectedPrescription.patientName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Doctor</p>
                <p className="font-bold">{selectedPrescription.doctorName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Date</p>
                <p className="font-bold">{new Date(selectedPrescription.prescriptionDate).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Status</p>
                <Badge variant={selectedPrescription.status === 'PENDING' ? 'danger' : 'success'}>{selectedPrescription.status}</Badge>
              </div>
            </div>
          </div>
        )}
      </AppModal>
    </div>
    
  );
}
