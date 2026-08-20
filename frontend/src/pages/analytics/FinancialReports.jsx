import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import dayjs from 'dayjs';



const FinancialReports = () => {
  const [period, setPeriod] = useState(dayjs().format('YYYY-MM')); // Current month

  // We could fetch P&L statement here or detailed revenue stats.
  // Using the /finance/pnl endpoint we built earlier.
  
  const startDate = `${period}-01`;
  const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD');

  const { data: pnlStatement, isLoading } = useQuery({
    queryKey: ['pnlStatement', startDate, endDate],
    queryFn: async () => {
      const res = await axiosPrivate.get('/finance/pnl', {
        params: { startDate, endDate }
      });
      return res.data;
    },
    retry: false
  });

  return (
    
    <div className="p-6 max-w-7xl mx-auto font-sans text-slate-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Financial Reports</h1>
          <p className="text-sm text-slate-500">Comprehensive Profit & Loss and Revenue Tracking.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="month" 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-slate-200 bg-white rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-indigo-500"
          />
          <button className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded shadow-sm text-sm font-semibold flex items-center gap-1 transition">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12 text-slate-400">Loading financial data...</div>
      ) : !pnlStatement ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-400">
          <IndianRupee size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">No Financial Data Available</p>
          <p className="text-sm mt-1">Select a different period or check ledger entries.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl shadow-sm">
              <h3 className="text-emerald-800 text-sm font-bold uppercase tracking-wider mb-1">Total Revenue</h3>
              <p className="text-3xl font-bold text-emerald-600">₹{pnlStatement.totalRevenue?.toLocaleString() || '0'}</p>
            </div>
            
            <div className="bg-rose-50 border border-rose-100 p-5 rounded-xl shadow-sm">
              <h3 className="text-rose-800 text-sm font-bold uppercase tracking-wider mb-1">Total Expenses</h3>
              <p className="text-3xl font-bold text-rose-600">₹{pnlStatement.totalExpenses?.toLocaleString() || '0'}</p>
            </div>

            <div className={`border p-5 rounded-xl shadow-sm ${pnlStatement.netProfit >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className="text-slate-800 text-sm font-bold uppercase tracking-wider mb-1">Net Profit / Loss</h3>
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-bold ${pnlStatement.netProfit >= 0 ? 'text-indigo-700' : 'text-slate-700'}`}>
                  ₹{pnlStatement.netProfit?.toLocaleString() || '0'}
                </p>
                {pnlStatement.netProfit > 0 && <TrendingUp size={24} className="text-indigo-500" />}
                {pnlStatement.netProfit < 0 && <TrendingDown size={24} className="text-slate-500" />}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-slate-400" />
              P&L Breakdown
            </h2>
            
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="font-semibold text-emerald-700 mb-2 border-b border-slate-100 pb-1">Revenue Sources</h3>
                {Object.entries(pnlStatement.revenueBreakdown || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm py-1">
                    <span className="text-slate-600 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-slate-800">₹{value.toLocaleString()}</span>
                  </div>
                ))}
                {Object.keys(pnlStatement.revenueBreakdown || {}).length === 0 && (
                  <div className="text-sm text-slate-400 italic">No revenue entries</div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-rose-700 mb-2 border-b border-slate-100 pb-1">Expense Sources</h3>
                {Object.entries(pnlStatement.expenseBreakdown || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm py-1">
                    <span className="text-slate-600 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-slate-800">₹{value.toLocaleString()}</span>
                  </div>
                ))}
                {Object.keys(pnlStatement.expenseBreakdown || {}).length === 0 && (
                  <div className="text-sm text-slate-400 italic">No expense entries</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
};

export default FinancialReports;
