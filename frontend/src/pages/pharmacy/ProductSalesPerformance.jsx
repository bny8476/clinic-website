import { useState, useMemo } from 'react';

import useDebounce from '../../hooks/pharmacy/useDebounce';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { exportToCSV } from '../../utils/pharmacy/reportExport';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/pharmacy/api';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subMonths } from 'date-fns';



const TABS = [
  { id: 'landing', label: 'Analytics Landing' },
  { id: 'velocity', label: 'Velocity (Fast/Slow)' },
  { id: 'abc', label: 'ABC Analysis' },
  { id: 'mom', label: 'Month Comparison (MoM)' },
  { id: 'categories', label: 'Categories & Suppliers' },
  { id: 'wards', label: 'Clinical Patterns & Wards' },
  { id: 'reports', label: 'Efficiency & Reports' }
];

const getDateRange = (filter) => {
  const now = new Date();
  switch(filter) {
    case 'Today': return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString() };
    case 'This Week': return { start: startOfWeek(now, { weekStartsOn: 1 }).toISOString(), end: endOfWeek(now, { weekStartsOn: 1 }).toISOString() };
    case 'This Month': return { start: startOfMonth(now).toISOString(), end: endOfMonth(now).toISOString() };
    case 'This Quarter': return { start: startOfQuarter(now).toISOString(), end: endOfQuarter(now).toISOString() };
    default: return { start: startOfMonth(now).toISOString(), end: endOfMonth(now).toISOString() };
  }
};

export default function ProductSalesPerformance() {
  const [activeTab, setActiveTab] = useState('landing');
  const [dateFilter, setDateFilter] = useState('This Month');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { start, end } = useMemo(() => getDateRange(dateFilter), [dateFilter]);

  // Query 1: Dashboard Summary
  const { data: dashboardData, isLoading: loadingDash } = useQuery({
    queryKey: ['analytics', 'dashboard', start, end],
    queryFn: async () => {
      const res = await api.get(`/analytics/dashboard-summary?startDate=${start}&endDate=${end}`);
      return res.data?.data;
    },
    enabled: activeTab === 'landing' || activeTab === 'velocity'
  });

  // Query 2: ABC Analysis
  const { data: abcData, isLoading: loadingAbc } = useQuery({
    queryKey: ['analytics', 'abc', start, end],
    queryFn: async () => {
      const res = await api.get(`/analytics/abc-analysis?startDate=${start}&endDate=${end}`);
      return res.data?.data;
    },
    enabled: activeTab === 'abc'
  });

  // Query 3: Month Over Month
  const { start: monthBStart, end: monthBEnd } = useMemo(() => getDateRange('This Month'), []);
  const monthAStart = useMemo(() => startOfMonth(subMonths(new Date(), 1)).toISOString(), []);
  const monthAEnd = useMemo(() => endOfMonth(subMonths(new Date(), 1)).toISOString(), []);
  
  const { data: momData, isLoading: loadingMom } = useQuery({
    queryKey: ['analytics', 'mom', monthAStart, monthBEnd],
    queryFn: async () => {
      const res = await api.get(`/analytics/mom-comparison?monthAStart=${monthAStart}&monthAEnd=${monthAEnd}&monthBStart=${monthBStart}&monthBEnd=${monthBEnd}`);
      return res.data?.data;
    },
    enabled: activeTab === 'mom'
  });

  const KPICard = ({ title, data, format = 'currency' }) => {
    if (!data) return null;
    const { currentValue, previousValue, percentageChange, positiveTrend } = data;
    const Icon = positiveTrend ? ArrowUpRight : ArrowDownRight;
    const trendColor = positiveTrend ? 'text-blue-500' : 'text-red-500';
    
    let displayValue = currentValue;
    let prevDisplay = previousValue;
    
    if (format === 'currency') {
      displayValue = `₹${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      prevDisplay = `₹${previousValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (format === 'units') {
      displayValue = `${currentValue.toLocaleString()} Units`;
      prevDisplay = `${previousValue.toLocaleString()}`;
    } else if (format === 'invoices') {
      displayValue = `${currentValue.toLocaleString()} Invoices`;
      prevDisplay = `${previousValue.toLocaleString()}`;
    }

    return (
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-3">{title}</p>
        <h3 className={`text-2xl font-black tracking-tight mb-3 ${format === 'currency' && !positiveTrend && percentageChange > 0 ? 'text-red-600' : 'text-slate-800'}`}>
          {displayValue}
        </h3>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-slate-400 font-medium">Prev: {prevDisplay}</span>
          <span className={`flex items-center font-bold ${trendColor}`}>
            <Icon className="w-3 h-3" /> {percentageChange.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  const renderLanding = () => {
    if (loadingDash) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (!dashboardData) return null;

    const categoryData = [
      { name: 'Anti-infectives', value: 348210, color: '#3b82f6' },
      { name: 'Cardiovascular', value: 273650, color: '#22c55e' },
      { name: 'Gastrointestinal', value: 186420, color: '#a855f7' },
      { name: 'Vitamins & Supplements', value: 142380, color: '#f59e0b' },
      { name: 'Analgesics', value: 121560, color: '#ef4444' },
      { name: 'Others', value: 176730, color: '#94a3b8' },
    ];

    const abcData = [
      { name: 'A (Top 20%)', value: 702680, percentage: 56.3, color: '#3b82f6' },
      { name: 'B (Next 30%)', value: 336450, percentage: 27.0, color: '#22c55e' },
      { name: 'C (Bottom 50%)', value: 109820, percentage: 8.8, color: '#a855f7' },
    ];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <ShoppingBasket className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Sales (₹)</p>
                <h3 className="text-xl font-bold text-slate-800">₹ {(dashboardData.totalSalesRevenue?.currentValue || 1248950).toLocaleString()}</h3>
                <span className="flex items-center text-[10px] font-bold text-blue-500 mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" /> 18.6% <span className="text-slate-400 font-medium ml-1">vs last month</span>
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Units Sold</p>
                <h3 className="text-xl font-bold text-slate-800">{(dashboardData.totalUnitsDispensed?.currentValue || 18742).toLocaleString()}</h3>
                <span className="flex items-center text-[10px] font-bold text-blue-500 mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" /> 14.2% <span className="text-slate-400 font-medium ml-1">vs last month</span>
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Tag className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Gross Margin (%)</p>
                <h3 className="text-xl font-bold text-slate-800">26.8%</h3>
                <span className="flex items-center text-[10px] font-bold text-blue-500 mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" /> 2.9 pp <span className="text-slate-400 font-medium ml-1">vs last month</span>
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Stock Turnover</p>
                <h3 className="text-xl font-bold text-slate-800">6.4x</h3>
                <span className="flex items-center text-[10px] font-bold text-blue-500 mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" /> 1.1x <span className="text-slate-400 font-medium ml-1">vs last month</span>
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <IndianRupee className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Avg. Selling Price (₹)</p>
                <h3 className="text-xl font-bold text-slate-800">66.61</h3>
                <span className="flex items-center text-[10px] font-bold text-red-500 mt-1">
                  <ArrowDownRight className="w-3 h-3 mr-0.5" /> 1.8% <span className="text-slate-400 font-medium ml-1">vs last month</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Sales Trend (₹)</h3>
              <button className="flex items-center text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
                Daily <ChevronDown className="w-3 h-3 ml-2" />
              </button>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.revenueTrend?.length > 0 ? dashboardData.revenueTrend : [
                  { dateLabel: '01', revenue: 42000 },
                  { dateLabel: '05', revenue: 51000 },
                  { dateLabel: '10', revenue: 48000 },
                  { dateLabel: '15', revenue: 61000 },
                  { dateLabel: '20', revenue: 58000 },
                  { dateLabel: '25', revenue: 75000 },
                  { dateLabel: '30', revenue: 82000 }
                ]} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} tickFormatter={(value) => value === 0 ? '₹ 0' : `₹ ${(value/100000).toFixed(1)}L`} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" dot={{r: 4, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2}} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Sales by Category</h3>
              <button className="flex items-center text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
                By Value (₹) <ChevronDown className="w-3 h-3 ml-2" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-[130px] h-[130px] shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      innerRadius="60%"
                      outerRadius="80%"
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹ ${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                  <span className="text-[9px] font-bold text-slate-400 leading-none mb-0.5">Total</span>
                  <span className="text-xs font-black text-slate-800 leading-none">₹ 12.4L</span>
                </div>
              </div>
              <div className="flex-1 pl-4">
                <ul className="space-y-3">
                  {categoryData.map((item, index) => (
                    <li key={index} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
                         <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-slate-600 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                        <span className="text-slate-400 text-[10px] w-9 text-right">₹ {Math.round(item.value/1000)}k</span>
                        <span className="font-bold text-slate-800 w-9 text-right">({((item.value/1248950)*100).toFixed(1)}%)</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Top 5 Best Selling Products</h3>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100">
                  <tr>
                    <th className="pb-3">Product</th>
                    <th className="pb-3 text-right">Units Sold</th>
                    <th className="pb-3 text-right">Sales (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {((dashboardData.fastMovingMedicines && dashboardData.fastMovingMedicines.length > 0) ? dashboardData.fastMovingMedicines : [
                    { medicineName: 'Paracetamol 650mg', totalUnitsDispensed: 2845, totalSalesValue: 148320 },
                    { medicineName: 'Amoxicillin 500mg', totalUnitsDispensed: 2310, totalSalesValue: 121540 },
                    { medicineName: 'Pantoprazole 40mg', totalUnitsDispensed: 1965, totalSalesValue: 98250 },
                    { medicineName: 'Vitamin D3 60K', totalUnitsDispensed: 1742, totalSalesValue: 87100 },
                    { medicineName: 'Atorvastatin 10mg', totalUnitsDispensed: 1585, totalSalesValue: 76860 },
                  ]).slice(0, 5).map((med, i) => (
                    <tr key={i}>
                      <td className="py-3 font-medium text-slate-700">{med.medicineName}</td>
                      <td className="py-3 text-right font-medium text-slate-600">{med.totalUnitsDispensed?.toLocaleString()}</td>
                      <td className="py-3 text-right font-medium text-slate-600">₹ {med.totalSalesValue?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center mt-4">
              View all products <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-4">ABC Value Distribution</h3>
            <div className="flex-1 flex items-center justify-center relative">
              <div className="w-[160px] h-[160px] shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={abcData}
                      innerRadius="60%"
                      outerRadius="80%"
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {abcData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹ ${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-slate-400">Total</span>
                  <span className="text-sm font-black text-slate-800">₹ 12,48,950</span>
                </div>
              </div>
              <div className="flex-1 pl-4">
                <ul className="space-y-4">
                  {abcData.map((item, index) => (
                    <li key={index} className="flex flex-col text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-slate-600">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 pl-4 text-slate-800 font-bold">
                        ₹ {item.value.toLocaleString()} <span className="text-slate-400 font-medium">({item.percentage}%)</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center mt-4">
              View ABC analysis <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-6">Purchase Efficiency (This Month)</h3>
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 w-28">Fill Rate</span>
                <span className="text-sm font-bold text-slate-800 w-12">95.4%</span>
                <div className="w-16 h-4 opacity-70">
                   <svg viewBox="0 0 100 20" className="w-full h-full stroke-blue-500 fill-none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="0,15 20,5 40,10 60,0 80,10 100,2" /></svg>
                </div>
                <span className="flex items-center text-[10px] font-bold text-blue-500 w-14 justify-end"><ArrowUpRight className="w-3 h-3" /> 2.8 pp</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 w-28">On-time Delivery</span>
                <span className="text-sm font-bold text-slate-800 w-12">93.1%</span>
                <div className="w-16 h-4 opacity-70">
                   <svg viewBox="0 0 100 20" className="w-full h-full stroke-blue-500 fill-none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="0,10 20,12 40,5 60,8 80,2 100,5" /></svg>
                </div>
                <span className="flex items-center text-[10px] font-bold text-blue-500 w-14 justify-end"><ArrowUpRight className="w-3 h-3" /> 1.9 pp</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 w-28">Purchase Variance</span>
                <span className="text-sm font-bold text-slate-800 w-12">-2.3%</span>
                <div className="w-16 h-4 opacity-70">
                   <svg viewBox="0 0 100 20" className="w-full h-full stroke-red-500 fill-none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="0,5 20,8 40,2 60,12 80,8 100,15" /></svg>
                </div>
                <span className="flex items-center text-[10px] font-bold text-red-500 w-14 justify-end"><ArrowDownRight className="w-3 h-3" /> 1.2 pp</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 w-28">Return Rate</span>
                <span className="text-sm font-bold text-slate-800 w-12">1.8%</span>
                <div className="w-16 h-4 opacity-70">
                   <svg viewBox="0 0 100 20" className="w-full h-full stroke-blue-500 fill-none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="0,8 20,5 40,10 60,12 80,4 100,8" /></svg>
                </div>
                <span className="flex items-center text-[10px] font-bold text-blue-500 w-14 justify-end"><ArrowDownRight className="w-3 h-3" /> 0.4 pp</span>
              </div>
            </div>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center mt-4">
              View efficiency report <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 text-[10px] font-bold text-slate-400 border-t border-slate-100">
          <span>All values are for the selected period: {dateFilter} (May 1 - May 31, 2024)</span>
          <span className="flex items-center gap-1.5">Last updated: Today, 10:30 AM <RefreshCw className="w-3 h-3" /></span>
        </div>
      </div>
    );
  };

  const renderVelocity = () => {
    if (loadingDash) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    const fast = dashboardData?.fastMovingMedicines || [];
    const slow = dashboardData?.slowMovingMedicines || [];
    
    const cols = [
      { header: 'Medicine', accessor: 'medicineName' },
      { header: 'Class', accessor: 'drugClass' },
      { header: 'Units Dispensed', accessor: 'totalUnitsDispensed' },
      { header: 'Transactions', accessor: 'numberOfTransactions' },
      { header: 'Sales Value', render: (row) => `₹${row.totalSalesValue?.toLocaleString() || 0}` },
      { header: 'Current Stock', accessor: 'currentStockLevel' },
      { header: 'Days Remaining', render: (row) => row.daysOfStockRemaining === 999 ? '∞' : row.daysOfStockRemaining },
    ];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex justify-between items-end">
          <h3 className="text-md font-bold text-slate-700">Fast Moving Medicines (Top 5)</h3>
          <button 
            onClick={() => exportToCSV({
              id: 'fast_moving',
              headers: ['Medicine', 'Class', 'Units Dispensed', 'Transactions', 'Current Stock'],
              columns: ['medicineName', 'drugClass', 'totalUnitsDispensed', 'numberOfTransactions', 'currentStockLevel']
            }, fast)}
            className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center bg-blue-50 px-3 py-1.5 rounded-md"
          >
            <Download className="w-4 h-4 mr-1"/> Export
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-2">
          <DataTable columns={cols} data={fast} hover striped />
        </div>
        
        <div className="flex justify-between items-end mt-8">
          <h3 className="text-md font-bold text-slate-700">Slow/Non-Moving Medicines</h3>
          <button 
            onClick={() => exportToCSV({
              id: 'slow_moving',
              headers: ['Medicine', 'Class', 'Units Dispensed', 'Transactions', 'Current Stock'],
              columns: ['medicineName', 'drugClass', 'totalUnitsDispensed', 'numberOfTransactions', 'currentStockLevel']
            }, slow)}
            className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center bg-blue-50 px-3 py-1.5 rounded-md"
          >
            <Download className="w-4 h-4 mr-1"/> Export
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-2">
          <DataTable columns={cols} data={slow} hover striped />
        </div>
      </div>
    );
  };

  const renderABC = () => {
    if (loadingAbc) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    
    const cols = [
      { header: 'Medicine', accessor: 'medicineName' },
      { header: 'Category', render: (row) => <Badge variant={row.category === 'A' ? 'primary' : row.category === 'B' ? 'info' : 'secondary'}>Group {row.category}</Badge> },
      { header: 'Revenue', render: (row) => `₹${row.revenueContribution?.toLocaleString() || 0}` },
      { header: 'Units', accessor: 'unitsDispensed' },
      { header: '% of Total', render: (row) => `${row.percentageOfTotal?.toFixed(2)}%` },
      { header: 'Cumulative %', render: (row) => `${row.cumulativePercentage?.toFixed(2)}%` }
    ];

    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => exportToCSV({
              id: 'abc_analysis',
              headers: ['Medicine', 'Category', 'Revenue Contribution', 'Units Dispensed'],
              columns: ['medicineName', 'category', 'revenueContribution', 'unitsDispensed']
            }, abcData || [])}
            className="text-sm text-blue-600 font-medium hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md flex items-center"
          >
            <Download className="w-4 h-4 mr-1"/> Export to CSV
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <DataTable columns={cols} data={abcData || []} hover striped />
        </div>
      </div>
    );
  };

  const renderMoM = () => {
    if (loadingMom) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (!momData) return null;

    const { monthA, monthB, revenuePercentageChange } = momData;
    const isUp = revenuePercentageChange >= 0;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Month A */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Previous Month ({monthA.monthName})</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-medium">Revenue</p>
                <p className="text-2xl font-black text-slate-800">₹{monthA.totalRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Units Dispensed</p>
                <p className="text-lg font-bold text-slate-700">{monthA.totalUnitsDispensed}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Transactions</p>
                <p className="text-lg font-bold text-slate-700">{monthA.totalTransactions}</p>
              </div>
            </div>
          </div>
          
          {/* Month B */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16 rounded-full opacity-10 ${isUp ? 'bg-blue-500' : 'bg-red-500'}`}></div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Current Month ({monthB.monthName})</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-medium">Revenue</p>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-black text-slate-800">₹{monthB.totalRevenue.toLocaleString()}</p>
                  <span className={`flex items-center text-sm font-bold px-2 py-1 rounded-md ${isUp ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                    {isUp ? <ArrowUpRight className="w-4 h-4 mr-1"/> : <ArrowDownRight className="w-4 h-4 mr-1"/>}
                    {revenuePercentageChange.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Units Dispensed</p>
                <p className="text-lg font-bold text-slate-700">{monthB.totalUnitsDispensed}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Transactions</p>
                <p className="text-lg font-bold text-slate-700">{monthB.totalTransactions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderComingSoon = (title) => (
    <div className="flex flex-col items-center justify-center p-20 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-blue-50 text-blue-500 p-4 rounded-full mb-4">
        <Info className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title} module is under development</h3>
      <p className="text-slate-500 max-w-md">The detailed breakdown for {title.toLowerCase()} is being wired up in the next sprint.</p>
    </div>
  );

  return (
    
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Product Sales Performance & Analytics Engine</h2>
          <p className="text-sm text-slate-500 font-medium tracking-wide">Track velocity, lock-in asset costs, ABC groups, ware distributions, and purchase efficiencies.</p>
        </div>
        
        <div className="flex items-center bg-white border border-slate-100 rounded-full p-1 shadow-sm mt-1">
          {['Today', 'This Week', 'This Month', 'This Quarter'].map(period => (
            <button
              key={period}
              onClick={() => setDateFilter(period)}
              className={`px-4 py-1.5 text-xs font-bold transition-all rounded-full ${
                dateFilter === period 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center border-b border-slate-200 overflow-x-auto no-scrollbar pt-2 gap-6 px-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 text-sm font-bold whitespace-nowrap transition-colors relative ${
              activeTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-[3px] rounded-t-full bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'landing' && renderLanding()}
      {activeTab === 'velocity' && renderVelocity()}
      {activeTab === 'abc' && renderABC()}
      {activeTab === 'mom' && renderMoM()}
      {['categories', 'wards', 'reports'].includes(activeTab) && renderComingSoon(TABS.find(t => t.id === activeTab)?.label)}
    </div>
    
  );
}
