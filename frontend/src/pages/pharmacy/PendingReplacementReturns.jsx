import React, { useState, useEffect } from 'react';
import logger from '../../utils/logger';
import useDebounce from '../../hooks/pharmacy/useDebounce';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import pharmacyService from '../../utils/pharmacy/pharmacyService';



export default function PendingReplacementReturns() {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [returnToDelete, setReturnToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  React.useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [returns, setReturns] = useState([]);

  useEffect(() => {
    pharmacyService.getPendingWardReplacementReturns()
      .then(res => setReturns(res.data || res || []))
      .catch(err => logger.error('Failed to load replacement returns', err));
  }, [location.key]);

  const filteredReturns = returns.filter(row => {
    const s = debouncedSearch.toLowerCase();
    const matchesSearch = !debouncedSearch || 
      row.retNo.toLowerCase().includes(s) || 
      row.reqNo.toLowerCase().includes(s) || 
      row.ward.toLowerCase().includes(s) || 
      row.returnedBy.toLowerCase().includes(s);

    const retDate = new Date(row.returnDate);
    const normalizedRetDate = new Date(retDate.getFullYear(), retDate.getMonth(), retDate.getDate()).getTime();
    
    const matchesFrom = !dateRange.from || normalizedRetDate >= new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()).getTime();
    const matchesTo = !dateRange.to || normalizedRetDate <= new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate()).getTime();

    return matchesSearch && matchesFrom && matchesTo;
  });

  const confirmDelete = async () => {
    try {
      await pharmacyService.rejectWardReplacementReturn(returnToDelete);
      toast.success('Return request rejected');
      setIsDeleteModalOpen(false);
      setReturnToDelete(null);
      pharmacyService.getPendingWardReplacementReturns().then(res => setReturns(res.data || res || []));
    } catch (e) {
      logger.error('Failed to reject request', e);
      toast.error('Failed to reject request');
    }
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Return No', accessor: 'returnNumber' },
    { header: 'Original Request No', accessor: 'requestNumber' },
    { header: 'Ward', accessor: 'ward' },
    { header: 'Returned By', accessor: 'returnedBy' },
    { header: 'Return Date', render: (row) => new Date(row.returnDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { header: 'Items', render: (row) => row.items?.length || 0 },
    { header: 'Status', render: (row) => (
      <Badge variant={row.status === 'Pending' ? 'warning' : 'success'}>{row.status}</Badge>
    )},
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View"
          onClick={() => { setSelectedReturn(row); setIsViewModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        {row.status === 'Pending' && (
          <>
            <button 
              title="Accept" 
              onClick={() => { setSelectedReturn(row); setIsModalOpen(true); }}
              className="p-1.5 text-success hover:bg-blue-50 rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button 
              title="Reject" 
              onClick={() => { setReturnToDelete(row.id); setIsDeleteModalOpen(true); }}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    )}
  ];

  return (
    
    <div className="space-y-6">
              <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Replacement Return List</h2>
        <p className="text-sm text-gray-500 font-medium">Verify and accept returned medicines from wards back into pharmacy stock</p>
      </div>

      <ModuleFilterBar searchPlaceholder="Search..." 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
        filters={[{ label: 'Ward', name: 'ward', options: [{ label: 'ICU - 1', value: 'icu1' }] }]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={pageSize === 'All' ? filteredReturns : filteredReturns.slice((currentPage - 1) * pageSize, currentPage * pageSize)} hover striped />
        <Pagination totalRecords={filteredReturns.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Verify & Accept Return"
        maxWidth="sm:max-w-4xl"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
             <button onClick={async () => { 
                try {
                  await pharmacyService.approveWardReplacementReturn(selectedReturn.id);
                  toast.success('Return accepted and stock updated!'); 
                  setIsModalOpen(false); 
                  pharmacyService.getPendingWardReplacementReturns().then(res => setReturns(res.data || res || []));
                } catch (e) {
                  logger.error('Failed to accept return', e);
                  toast.error('Failed to accept return');
                }
             }} className="flex-1 px-8 py-2.5 bg-success text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4"/> Confirm Accept
             </button>
          </div>
        }
      >
        {selectedReturn && (
          <div className="space-y-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Original Request</p>
                  <p className="text-sm font-bold text-slate-800">{selectedReturn.requestNumber}</p>
               </div>
               <div className="text-right space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Returned By</p>
                  <p className="text-sm font-bold text-slate-800">{selectedReturn.returnedBy}</p>
               </div>
            </div>

            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <DataTable 
                columns={[
                  { header: 'Medicine', render: () => <span className="font-medium text-slate-700">Amoxicillin 500mg</span> },
                  { header: <div className="text-center">Returned Qty</div>, render: () => <div className="text-center font-bold">5</div> },
                  {
                    header: <div className="text-center w-48">Condition</div>,
                    render: () => (
                       <select className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-success/20">
                          <option>Good Condition</option>
                          <option>Damaged</option>
                          <option>Expired / Near Expiry</option>
                       </select>
                    )
                  }
                ]}
                data={[{ id: 1 }]}
                hover
                striped
              />
            </div>
          </div>
        )}
      </AppModal>

      <AppModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)}
        title="Replacement Return Details"
        maxWidth="sm:max-w-xl"
      >
        {selectedReturn && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs text-slate-500 font-medium">Return No</p>
                <p className="font-bold">{selectedReturn.returnNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Request No</p>
                <p className="font-bold">{selectedReturn.requestNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Ward</p>
                <p className="font-bold">{selectedReturn.ward}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Returned By</p>
                <p className="font-bold">{selectedReturn.returnedBy}</p>
              </div>
            </div>
            <div className="p-10 text-center text-slate-400 italic">
              Itemized return manifest is pending synchronization.
            </div>
          </div>
        )}
      </AppModal>

      <AppModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Rejection"
        maxWidth="sm:max-w-md"
        footer={
          <div className="flex gap-3 w-full">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-6 py-2 border rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-red-700">Yes, Reject</button>
          </div>
        }
      >
        <div className="p-6 text-center">
          <p className="font-bold text-gray-900 mb-2">Reject this replacement return?</p>
          <p className="text-sm text-gray-500">This action will return the request to the ward for correction.</p>
        </div>
      </AppModal>
    </div>
    
  );
}
