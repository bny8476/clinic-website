import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { format } from 'date-fns';



const fetchPnL = async (startDate, endDate, branchId) => {
  const params = new URLSearchParams({ startDate, endDate });
  if (branchId) params.append('branchId', branchId);
  const response = await axiosPrivate.get(`/v1/finance/pnl?${params.toString()}`);
  return response.data;
};

const PnLStatement = () => {
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const { data: pnlData, isLoading, isError } = useQuery({
    queryKey: ['pnl', dateRange.startDate, dateRange.endDate],
    queryFn: () => fetchPnL(dateRange.startDate, dateRange.endDate)
  });

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹ 0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 size={24} className="text-lime-700" /> Profit & Loss Statement (P&L)
        </h1>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar size={18} className="text-slate-500" />
          <input 
            type="date" 
            value={dateRange.startDate} 
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="text-sm outline-none bg-transparent"
          />
          <span className="text-slate-400">to</span>
          <input 
            type="date" 
            value={dateRange.endDate} 
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="text-sm outline-none bg-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Financial Rollup</h3>

        {isLoading ? (
          <div className="flex justify-center p-8">Loading P&L Data...</div>
        ) : isError ? (
          <div className="text-red-500 p-4 bg-red-50 rounded-lg">Failed to load P&L Statement. Please try again.</div>
        ) : pnlData ? (
          <div className="flex flex-col gap-3">
            <div className="p-4 bg-green-50 rounded-lg flex justify-between items-center border border-green-100">
              <span className="font-semibold text-green-800">Total Revenue (OPD + Pharmacy + Lab)</span>
              <span className="text-xl font-bold text-green-700">{formatCurrency(pnlData.totalRevenue)}</span>
            </div>

            <div className="p-4 bg-red-50 rounded-lg flex justify-between items-center border border-red-100">
              <span className="font-semibold text-red-800">Total Operating Expenses (Salaries + Stock + Rent)</span>
              <span className="text-xl font-bold text-red-700">- {formatCurrency(pnlData.totalExpenses)}</span>
            </div>

            <div className="h-px bg-slate-200 my-2" />

            <div className={`p-4 rounded-xl flex justify-between items-center ${pnlData.netProfit >= 0 ? 'bg-blue-50 border border-blue-100' : 'bg-orange-50 border border-orange-100'}`}>
              <span className={`font-bold text-lg ${pnlData.netProfit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                Net Operating Profit (EBITDA)
              </span>
              <span className={`text-2xl font-black ${pnlData.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {formatCurrency(pnlData.netProfit)}
              </span>
            </div>
            
            {(pnlData.revenueBreakdown?.length > 0 || pnlData.expenseBreakdown?.length > 0) && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-green-600"/> Revenue Breakdown</h4>
                  <ul className="space-y-2">
                    {pnlData.revenueBreakdown.map((item, i) => (
                      <li key={i} className="flex justify-between text-sm p-2 bg-slate-50 rounded border border-slate-100">
                        <span className="text-slate-600">{item.category}</span>
                        <span className="font-medium text-slate-900">{formatCurrency(item.amount)}</span>
                      </li>
                    ))}
                    {pnlData.revenueBreakdown.length === 0 && <li className="text-sm text-slate-500 italic">No revenue recorded</li>}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><TrendingDown size={16} className="text-red-600"/> Expense Breakdown</h4>
                  <ul className="space-y-2">
                    {pnlData.expenseBreakdown.map((item, i) => (
                      <li key={i} className="flex justify-between text-sm p-2 bg-slate-50 rounded border border-slate-100">
                        <span className="text-slate-600">{item.category}</span>
                        <span className="font-medium text-slate-900">{formatCurrency(item.amount)}</span>
                      </li>
                    ))}
                    {pnlData.expenseBreakdown.length === 0 && <li className="text-sm text-slate-500 italic">No expenses recorded</li>}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
    
  );
};

export default PnLStatement;
