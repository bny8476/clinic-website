import React, { useState } from 'react';
import useDebounce from '../../hooks/pharmacy/useDebounce';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import pharmacyService from '../../utils/pharmacy/pharmacyService';
import { usePageData } from '../../hooks/pharmacy/usePageData';
import { useMutation, useQueryClient } from '@tanstack/react-query';



export default function MedicineCreditBills() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { items: creditBillsList = [], isLoading: loading } = usePageData(
    'credit-bills',
    '/pharmacy/credit-bills'
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [reference, setReference] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  React.useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paymentMutation = useMutation({
    mutationFn: () => pharmacyService.addCreditPayment(selectedBill.id, paymentAmount, paymentMode, reference),
    onSuccess: () => {
      toast.success('Payment recorded successfully!');
      setIsModalOpen(false);
      queryClient.invalidateQueries(['credit-bills']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  });

  const handleRecordPayment = () => {
    if (!paymentAmount) {
      toast.error('Please enter amount');
      return;
    }
    paymentMutation.mutate();
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Bill No', render: (row) => row.bill.billNumber },
    { header: 'Patient Name', render: (row) => row.bill.patientName },
    { header: 'Bill Date', render: (row) => new Date(row.bill.billingDate).toLocaleDateString() },
    { header: 'Total Amount', render: (row) => `₹${row.totalAmount.toFixed(2)}` },
    { header: 'Paid Amount', render: (row) => `₹${row.paidAmount.toFixed(2)}` },
    { header: 'Balance', render: (row) => <span className="text-red-600 font-bold">₹{row.balanceAmount.toFixed(2)}</span> },
    { header: 'Status', render: (row) => {
      let variant = row.status === 'PAID' ? 'success' : row.status === 'PARTIAL' ? 'warning' : 'danger';
      return <Badge variant={variant}>{row.status}</Badge>;
    }},
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button title="View" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
        {row.status !== 'PAID' && (
          <button 
            title="Collect Payment" 
            onClick={() => { setSelectedBill(row); setPaymentAmount(row.balanceAmount); setIsModalOpen(true); }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <CreditCard className="w-4 h-4" />
          </button>
        )}
        <button title="Print" className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"><Printer className="w-4 h-4" /></button>
      </div>
    )}
  ];

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Credit Bills...</div>;

  const totalCreditBills = creditBillsList.length;
  const totalOutstanding = creditBillsList.reduce((sum, b) => sum + b.balanceAmount, 0);
  const totalPaidAmount = creditBillsList.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalBalance = totalOutstanding;
  const overdueBills = creditBillsList.filter(b => b.status !== 'PAID').length; // Simplify overdue logic to not paid for now

  return (
    
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Medicine Credit Bills</h2>
          <p className="text-sm text-gray-500 font-medium">Track outstanding balances and manage credit settlements</p>
        </div>
        <button
          onClick={() => navigate('/pharmacy/pharmacy-sales', { state: { openModal: true, paymentType: 'CREDIT' } })}
          className="px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Credit Bill
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#2563eb]/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#2563eb]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500">Total Credit Bills</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalCreditBills}</h3>
            </div>
          </div>
          <p className="text-sm font-semibold text-[#2563eb]">₹0.00</p>
        </div>
        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500">Total Outstanding</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalOutstanding > 0 ? totalOutstanding : 0}</h3>
            </div>
          </div>
          <p className="text-sm font-semibold text-blue-500">₹{totalOutstanding.toFixed(2)}</p>
        </div>
        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500">Total Paid Amount</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalPaidAmount > 0 ? totalPaidAmount : 0}</h3>
            </div>
          </div>
          <p className="text-sm font-semibold text-blue-500">₹{totalPaidAmount.toFixed(2)}</p>
        </div>
        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <IndianRupee className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500">Total Balance</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalBalance > 0 ? totalBalance : 0}</h3>
            </div>
          </div>
          <p className="text-sm font-semibold text-orange-500">₹{totalBalance.toFixed(2)}</p>
        </div>
        {/* Card 5 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500">Overdue Bills</p>
              <h3 className="text-2xl font-bold text-slate-900">{overdueBills}</h3>
            </div>
          </div>
          <p className="text-sm font-semibold text-red-500">₹{(totalOutstanding).toFixed(2)}</p>
        </div>
      </div>

      {/* Inline Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 outline-none focus:border-[#2563eb]"
            value={dateRange.from || ''}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
          />
          <span className="text-sm font-bold text-slate-400">to</span>
          <input
            type="date"
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 outline-none focus:border-[#2563eb]"
            value={dateRange.to || ''}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
          />
        </div>
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by bill no., patient name, ..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-full text-sm outline-none focus:border-[#2563eb] text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2 border border-blue-200 text-blue-600 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-blue-50 transition-colors">
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button className="px-6 py-2 bg-[#2563eb] text-white rounded-full text-sm font-semibold shadow-sm hover:bg-[#1d4ed8] transition-colors flex items-center gap-2">
            <Search className="w-4 h-4" /> Apply
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : (
          <>
            <DataTable 
              columns={columns} 
              data={(() => {
                const filtered = creditBillsList.filter(row => {
                  const searchLower = debouncedSearch.toLowerCase();
                  const matchesSearch = !debouncedSearch || 
                    row.bill?.billNumber?.toLowerCase().includes(searchLower) ||
                    row.bill?.patientName?.toLowerCase().includes(searchLower);
                  
                  const billDate = new Date(row.bill?.billingDate || new Date());
                  const matchesFrom = !dateRange.from || billDate >= new Date(dateRange.from);
                  const matchesTo = !dateRange.to || billDate <= new Date(dateRange.to);
                  
                  return matchesSearch && matchesFrom && matchesTo;
                });
                return pageSize === 'All' ? filtered : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
              })()} 
              hover 
              striped 
              emptyStateTitle="No credit bills found"
              emptyStateDesc="Try adjusting your filters or search term"
              emptyStateIcon={
                <div className="relative">
                  <ClipboardList className="w-6 h-6 text-[#7c3aed]" />
                  <div className="absolute -bottom-1 -right-1 bg-[#7c3aed] text-white w-4 h-4 rounded-full flex items-center justify-center border-[1.5px] border-white">
                    <Search className="w-2.5 h-2.5" />
                  </div>
                </div>
              }
            />
            <Pagination totalRecords={creditBillsList.filter(row => {
                  const searchLower = debouncedSearch.toLowerCase();
                  const matchesSearch = !debouncedSearch || 
                    row.bill?.billNumber?.toLowerCase().includes(searchLower) ||
                    row.bill?.patientName?.toLowerCase().includes(searchLower);
                  
                  const billDate = new Date(row.bill?.billingDate || new Date());
                  const matchesFrom = !dateRange.from || billDate >= new Date(dateRange.from);
                  const matchesTo = !dateRange.to || billDate <= new Date(dateRange.to);
                  
                  return matchesSearch && matchesFrom && matchesTo;
                }).length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
          </>
        )}
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Collect Credit Payment"
        maxWidth="sm:max-w-md"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
             <button onClick={handleRecordPayment} disabled={paymentMutation.isPending} className="flex-1 px-6 py-2.5 bg-success text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">
               {paymentMutation.isPending ? 'Recording...' : 'Record Payment'}
             </button>
          </div>
        }
      >
        {selectedBill && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">
                  <span>Bill Reference</span>
                  <span className="text-slate-900">{selectedBill.bill.billNumber}</span>
               </div>
               <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-widest">
                  <span>Patient</span>
                  <span className="text-slate-900">{selectedBill.bill.patientName}</span>
               </div>
            </div>

            <div className="text-center py-4">
               <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">Outstanding Balance</p>
               <p className="text-4xl font-black text-red-600 tracking-tighter">₹{selectedBill.balanceAmount.toFixed(2)}</p>
            </div>

            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payment Amount</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-lg font-bold outline-none focus:ring-2 focus:ring-success/20 transition-all" 
                    />
                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold">₹</span>
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payment Mode</label>
                  <select 
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-success/20 transition-all font-semibold"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / QR Scan</option>
                    <option value="CARD">Card Payment</option>
                  </select>
               </div>
            </div>
          </div>
        )}
      </AppModal>
    </div>
    
  );
}
