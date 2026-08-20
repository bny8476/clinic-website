import { useState, useEffect } from 'react';
import useDebounce from '../../hooks/pharmacy/useDebounce';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { format } from 'date-fns';



const fetchClearances = async () => {
  const response = await axiosPrivate.get('/v1/pharmacy/clearances');
  return response.data;
};

const clearPatient = async (id) => {
  const response = await axiosPrivate.post(`/v1/pharmacy/clearances/${id}/clear`);
  return response.data;
};

export default function PharmacyClearance() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const queryClient = useQueryClient();

  const { data: clearanceList = [], isLoading } = useQuery({
    queryKey: ['pharmacyClearances'],
    queryFn: fetchClearances
  });

  const clearMutation = useMutation({
    mutationFn: clearPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacyClearances'] });
      toast.success('Clearance completed!');
      setIsModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to complete clearance.');
    }
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const filteredClearance = clearanceList.filter(row => {
    const s = debouncedSearch.toLowerCase();
    const matchesSearch = !debouncedSearch || 
      (row.patientName && row.patientName.toLowerCase().includes(s)) || 
      (row.uhid && row.uhid.toLowerCase().includes(s)) || 
      (row.ward && row.ward.toLowerCase().includes(s));

    const admDate = row.admissionDate ? new Date(row.admissionDate) : null;
    const normalizedAdmDate = admDate ? new Date(admDate.getFullYear(), admDate.getMonth(), admDate.getDate()).getTime() : 0;
    const matchesFrom = !dateRange.from || (admDate && normalizedAdmDate >= new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()).getTime());
    const matchesTo = !dateRange.to || (admDate && normalizedAdmDate <= new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate()).getTime());

    return matchesSearch && matchesFrom && matchesTo;
  });

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Patient Name', accessor: 'patientName' },
    { header: 'UHID', accessor: 'uhid' },
    { header: 'Ward', accessor: 'ward' },
    { header: 'Admission Date', render: (row) => row.admissionDate ? format(new Date(row.admissionDate), 'MMM dd, yyyy') : 'N/A' },
    { header: 'Total Due', render: (row) => `₹${(row.totalDue || 0).toFixed(2)}` },
    { header: 'Advance Adjusted', render: (row) => `₹${(row.advanceAdjusted || 0).toFixed(2)}` },
    { header: 'Net Payable', render: (row) => <span className="font-bold text-red-600">₹{(row.netPayable || 0).toFixed(2)}</span> },
    { header: 'Clearance Status', render: (row) => (
      <Badge variant={row.status === 'Cleared' ? 'success' : 'warning'}>{row.status}</Badge>
    )},
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View" 
          onClick={() => { setSelectedPatient(row); setIsViewModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
        >
          <Eye className="w-4 h-4" />
        </button>
        {row.status === 'Pending' && (
          <button 
            title="Clear" 
            onClick={() => { setSelectedPatient(row); setIsModalOpen(true); }}
            className="p-1.5 text-success hover:bg-blue-50 rounded-lg"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
        <button title="Print" className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg"><Printer className="w-4 h-4" /></button>
      </div>
    )}
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading Clearances...</div>;
  }

  return (
    
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Pharmacy Clearance</h2>
        <p className="text-sm text-gray-500 font-medium">Finalize patient medicine bills and advance adjustments before discharge</p>
      </div>

      <ModuleFilterBar 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        searchPlaceholder="Search by Patient Name, UHID, Ward..."
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
        filters={[
          { label: 'Ward', name: 'ward', options: [{ label: 'General Ward', value: 'gw' }, { label: 'ICU', value: 'icu' }] }
        ]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={pageSize === 'All' ? filteredClearance : filteredClearance.slice((currentPage - 1) * pageSize, currentPage * pageSize)} hover striped />
        <Pagination totalRecords={filteredClearance.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Patient Final Clearance"
        maxWidth="sm:max-w-2xl"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
             <button onClick={() => { 
                clearMutation.mutate(selectedPatient.id);
             }} className="flex-1 px-8 py-2.5 bg-success text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2" disabled={clearMutation.isLoading}>
                <FileCheck className="w-4 h-4"/> Confirm Clearance
             </button>
          </div>
        }
      >
        {selectedPatient && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient Name</p>
                  <p className="text-sm font-bold text-slate-800">{selectedPatient.patientName}</p>
               </div>
               <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admission Date</p>
                  <p className="text-sm font-bold text-slate-800">{selectedPatient.admissionDate ? format(new Date(selectedPatient.admissionDate), 'MMM dd, yyyy') : 'N/A'}</p>
               </div>
               <div className="space-y-1 col-span-2 pt-2 text-slate-400 uppercase tracking-widest font-bold text-[10px]">
                  Ward / Bed Info
               </div>
               <div className="col-span-2">
                  <p className="text-sm font-bold text-slate-800">{selectedPatient.ward}</p>
               </div>
            </div>

            <div className="space-y-4 pt-2">
               <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                  <span className="text-sm text-slate-500 font-medium tracking-tight">Total Outstanding Bills</span>
                  <span className="text-lg font-bold text-slate-700">₹{(selectedPatient.totalDue || 0).toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                  <span className="text-sm text-success font-bold tracking-tight">Available Advance (Adjustable)</span>
                  <span className="text-lg font-bold text-success">- ₹{(selectedPatient.advanceAdjusted || 0).toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center py-4 px-6 bg-red-50 rounded-2xl border border-red-100 mt-4">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Net Payable Amount</span>
                     <span className="text-4xl font-black text-red-600 tracking-tighter">₹{(selectedPatient.netPayable || 0).toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-bold text-red-800 mb-1">Payment Method</p>
                     <select className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-bold bg-white text-red-800 outline-none">
                        <option>Cash</option>
                        <option>Card</option>
                        <option>UPI</option>
                     </select>
                  </div>
               </div>
            </div>
          </div>
        )}
      </AppModal>

      <AppModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Clearance Details"
        maxWidth="sm:max-w-xl"
      >
        {selectedPatient && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs text-slate-500 font-medium">Patient</p>
                <p className="font-bold">{selectedPatient.patientName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">UHID</p>
                <p className="font-bold">{selectedPatient.uhid}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Due</p>
                <p className="font-bold text-red-600">₹{(selectedPatient.totalDue || 0).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Status</p>
                <Badge variant={selectedPatient.status === 'Cleared' ? 'success' : 'warning'}>{selectedPatient.status}</Badge>
              </div>
            </div>
          </div>
        )}
      </AppModal>
    </div>
    
  );
}
