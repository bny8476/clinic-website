import { useState } from 'react';
import { IndianRupee, FileText, CreditCard, RotateCcw } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSystem } from '../../context/pharmacy/SystemContext';
import { useConfig } from '../../context/pharmacy/ConfigContext';
import api from '../../utils/pharmacy/api';



const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="h-8 w-64 bg-slate-200 rounded"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="h-[400px] bg-slate-200 rounded-2xl"></div>
      <div className="h-[400px] bg-slate-200 rounded-2xl"></div>
    </div>
  </div>
);

export default function BillingDashboard() {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const navigate = useNavigate();

  const { systemData } = useSystem();
  const refreshIntervalSeconds = useConfig('dashboard_refresh_interval_seconds');
  const refreshInterval = (refreshIntervalSeconds ? Number(refreshIntervalSeconds) * 1000 : 60000);
  const currencySymbol = useConfig('currency_symbol') || '₹';

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['billing-kpis'],
    queryFn: () => api.get('/dashboard').then(r => r.data?.data || {}),
  });

  const { data: revSummary, isLoading: revenueLoading } = useQuery({
    queryKey: ['billing-revenue-summary'],
    queryFn: () => api.get('/dashboard/revenue-strip').then(r => r.data?.data || {}),
  });

  const { data: revenueChart = [] } = useQuery({
    queryKey: ['billing-revenue-trend'],
    queryFn: () => api.get('/dashboard/chart-data?days=7').then(r => r.data?.data || []),
    refetchInterval: refreshInterval,
  });

  const { data: recentBillsData, isLoading: billsLoading } = useQuery({
    queryKey: ['dashboard-recent-bills'],
    queryFn: () => api.get('/pharmacy/dashboard/recent-activities').then(r => r.data?.data || []),
    refetchInterval: refreshInterval,
  });

  const chartSales = Array.isArray(revenueChart)
    ? revenueChart.map(d => ({
        day: d.day_of_week || d.day || d.sale_date,
        sales: Number(d.daily_revenue || 0),
      }))
    : [];

  const isLoading = kpisLoading || revenueLoading || billsLoading;

  if (isLoading) return <DashboardSkeleton />;

  const recentBills = recentBillsData || [];
  const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';

  const quickActions = [
    { label: 'New Sale', icon: FileText, action: () => navigate('/pharmacy/direct-pharmacy-sales'), color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Credit Bills', icon: CreditCard, action: () => navigate('/pharmacy/medicine-credit-bills'), color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Process Return', icon: RotateCcw, action: () => navigate('/pharmacy/medicine-returns'), color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  return (
    
    <DashboardShell quickActions={quickActions}>
      <div className="flex-1 overflow-y-auto pr-2 pb-6 min-h-0 flex flex-col">
      <div className="flex flex-col gap-1 mb-8 mt-2">
        <h2 className="text-[28px] font-extrabold text-slate-900 m-0 tracking-tight">
          {systemData?.greeting || 'Welcome'}, here's your Billing Dashboard
        </h2>
        <p className="text-[14px] text-slate-500 font-medium m-0 mt-1.5">
          Financial overview and billing operations as of {new Date().toLocaleString('en-IN')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <KPICard
          title="Today's Revenue"
          value={`${currencySymbol} ${fmt(kpis?.todays_sales_revenue)}`}
          icon={IndianRupee}
          iconColor="blue"
          subtext={`${kpis?.todays_sales_revenue_growth || '0%'} vs yesterday`}
          trend={Number(kpis?.todays_sales_revenue_growth || 0) >= 0 ? 'up' : 'down'}
        />
        <KPICard
          title="Total Bills Today"
          value={`${fmt(kpis?.bills_today)}`}
          icon={FileText}
          iconColor="blue"
          subtext={`${kpis?.bills_today_growth || '0%'} vs yesterday`}
          trend={Number(kpis?.bills_today_growth || 0) >= 0 ? 'up' : 'down'}
        />
        <KPICard
          title="This Week's Revenue"
          value={`${currencySymbol} ${fmt(revSummary?.this_weeks_total)}`}
          icon={IndianRupee}
          iconColor="blue"
          subtext={`${revSummary?.this_weeks_total_growth || '0%'} vs last week`}
          trend={Number(revSummary?.this_weeks_total_growth || 0) >= 0 ? 'up' : 'down'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[400px]">
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[15px] font-bold text-gray-900">Sales Trend (Last 7 Days)</h3>
              <select className="text-[12px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500">
                <option>Revenue (₹)</option>
              </select>
            </div>
            <div className="w-full flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartSales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" name="Revenue (₹)" dot={{ r: 4, fill: '#fff', stroke: '#3B82F6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-[12px] font-semibold text-slate-700">Revenue (₹)</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-col h-full overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <h3 className="text-[15px] font-bold text-gray-900">Recent Transactions</h3>
              <button onClick={() => navigate('/sales')} className="text-[13px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">BILL NO</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">PATIENT</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">AMOUNT</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">STATUS</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBills.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-[13px] font-semibold text-slate-700">{row.billNumber}</td>
                      <td className="px-6 py-4 text-[13px] font-medium text-slate-600">{row.patientName}</td>
                      <td className="px-6 py-4 text-[13px] font-bold text-slate-900">₹ {fmt(row.netAmount)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold ${
                          row.status === 'PAID' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-500'
                        }`}>
                          {row.status === 'PAID' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => { setSelectedInvoice(row); setIsInvoiceModalOpen(true); }}
                          className="p-1.5 border border-slate-200 text-slate-400 rounded-lg hover:bg-slate-50 hover:text-slate-600 transition-colors inline-flex">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {recentBills.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-[13px] text-gray-400">No recent transactions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white text-[12px] font-medium text-slate-500 shrink-0">
              <span>Showing {recentBills.length > 0 ? 1 : 0} to {Math.min(5, recentBills.length)} of {recentBills.length} records</span>
              <div className="flex items-center gap-3">
                <select className="border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                  <option>10</option>
                  <option>20</option>
                </select>
                <div className="flex items-center gap-1">
                  <button className="p-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-400"><ArrowRight className="w-3.5 h-3.5 rotate-180" /></button>
                  <button className="p-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-400"><ArrowRight className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AppModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} maxWidth="sm:max-w-4xl" padding={false}>
        <PharmacyInvoice bill={selectedInvoice} onClose={() => setIsInvoiceModalOpen(false)} />
      </AppModal>
      </div>
    </DashboardShell>
    
  );
}
