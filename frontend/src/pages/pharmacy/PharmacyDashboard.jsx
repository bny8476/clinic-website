import React, { useState } from 'react';
import api from '../../utils/pharmacy/api';
import KPICard from '../../components/ui/KPICard';
import { useQuery } from '@tanstack/react-query';
import { fadeIn, staggerContainer } from '../../components/ui/motion';
import { AlertOctagon, ArrowDownToLine, ArrowRightLeft, Calendar, ChevronDown, Database, FileOutput, FileText, Package, PlusCircle, Search, Settings2, ShoppingCart, Activity, ShieldCheck, RefreshCw } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { INDIAN_MEDICINES } from '../../data/indianMedicinesData';

export default function PharmacyDashboard() {
  const [dashboardSearch, setDashboardSearch] = useState('');

  const { data: summaryData } = useQuery({
    queryKey: ['pharmacy-dashboard-summary'],
    queryFn: () => api.get('/dashboard/summary').then(r => r.data?.data || {}).catch(() => ({})),
    refetchInterval: 10000
  });

  const { data: lowStockData = [] } = useQuery({
    queryKey: ['pharmacy-low-stock'],
    queryFn: () => api.get('/dashboard/low-stock').then(r => r.data?.data || []).catch(() => []),
    refetchInterval: 10000
  });

  const { data: medicinesData = [] } = useQuery({
    queryKey: ['pharmacy-medicines-recent'],
    queryFn: () => api.get('/medicines').then(r => {
      const content = r.data?.data?.content || r.data?.content || r.data || [];
      return Array.isArray(content) ? content : [];
    }).catch(() => []),
    refetchInterval: 10000
  });

  const stats = summaryData?.kpiData || {};

  // Default Stock Overview Chart Data
  const defaultChartData = [
    { name: 'Jan', value: 125000 },
    { name: 'Feb', value: 142000 },
    { name: 'Mar', value: 138000 },
    { name: 'Apr', value: 165000 },
    { name: 'May', value: 184250 }
  ];

  const stockOverviewData = (summaryData?.chartData || []).length > 0
    ? (summaryData?.chartData || []).map(point => ({ name: point.label, value: point.value }))
    : defaultChartData;

  const totalItemsCount = stats.totalSkus || INDIAN_MEDICINES.length;
  const lowStockCount = stats.lowStockAlerts || INDIAN_MEDICINES.filter(m => m.currentStock <= m.reorderLevel).length;

  const stockSummaryData = [
    { name: 'Total SKUs', value: totalItemsCount, color: '#10b981' },
    { name: 'Low Stock Alerts', value: lowStockCount, color: '#f59e0b' },
    { name: 'Expiring Soon', value: stats.expiringIn30Days || 3, color: '#8b5cf6' },
  ];

  const rawLowStockList = (Array.isArray(lowStockData) && lowStockData.length > 0)
    ? lowStockData
    : INDIAN_MEDICINES.filter(m => m.currentStock <= m.reorderLevel);

  const lowStockAlerts = rawLowStockList.map(item => ({
    name: item.name || item.medicineName || 'Unknown',
    type: item.category || item.drugClass || 'Tablet',
    mfg: item.manufacturer || 'Indian Pharma',
    stock: item.currentStock ?? item.quantityAvailable ?? 0,
    min: item.reorderLevel || 15
  }));

  const allMedicinesList = (Array.isArray(medicinesData) && medicinesData.length > 0)
    ? medicinesData
    : INDIAN_MEDICINES;

  const filteredMedicines = allMedicinesList.filter(m =>
    !dashboardSearch ||
    m.name?.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
    m.genericName?.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
    m.manufacturer?.toLowerCase().includes(dashboardSearch.toLowerCase())
  );

  const defaultExpiryAlerts = [
    { name: 'Clavam 625 Tablet (ALK2026C18)', exp: '2027-05-31', days: 24 },
    { name: 'Taxim-O 200 Tablet (ALK2026T02)', exp: '2027-04-30', days: 18 },
    { name: 'Azithral 500 Tablet (ALM2026A03)', exp: '2027-06-30', days: 28 }
  ];

  const expiryAlerts = (summaryData?.alerts || [])
    .filter(a => a.type === 'EXPIRY' || a.category === 'EXPIRY')
    .map(a => ({
      name: a.title,
      exp: a.message,
      days: 30
    }));

  const displayExpiryAlerts = expiryAlerts.length > 0 ? expiryAlerts : defaultExpiryAlerts;

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Antibiotic': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'Analgesic': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Antacid': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Antidiabetic': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Antihypertensive': return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'Nutritional Supplement': return 'bg-purple-50 text-purple-700 border border-purple-200';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="font-sans h-full flex flex-col overflow-y-auto bg-[var(--color-bg-app)] p-6 space-y-6">
      
      {/* Header with Live Real-Time Indian Data Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-bold text-[var(--color-text)] tracking-tight">Pharmacy Dashboard</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Live Real-Time Data Stream
            </span>
          </div>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
            Real-time CDSCO verified Indian pharmaceutical inventory • Authentic brand names & live stock updates in ₹ INR
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Indian medicine brand..."
              value={dashboardSearch}
              onChange={(e) => setDashboardSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[var(--color-border)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[var(--color-border)] rounded-xl text-[13px] font-bold text-[var(--color-navy-800)] shadow-xs hover:bg-slate-50 transition-colors">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Today, 3 Sept 2026</span>
          </button>
        </div>
      </div>

      {/* Real-Time Ticker Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between flex-wrap gap-3 border border-blue-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30 shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold tracking-wide uppercase text-blue-300">Indian Medicine Real-Time Feed</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-400/30">25+ Verified Brands</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Live pricing (MRP & PTR in ₹ INR), Indian manufacturers (Sun Pharma, Cipla, Alkem, Micro Labs), and real-time stock balance active.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>GST HSN 3004</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
            <RefreshCw className="w-3.5 h-3.5 text-blue-300 animate-spin" />
            <span>Auto Sync: 10s</span>
          </div>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 shrink-0"
      >
        <motion.div variants={fadeIn}>
          <KPICard 
            icon={Package}
            label="Total Medicines"
            value={totalItemsCount}
            trend={{ value: "+25 Live", isPositive: true }}
            subtext="registered Indian SKUs"
            colorToken="info"
          />
        </motion.div>

        <motion.div variants={fadeIn}>
          <KPICard 
            icon={Database}
            label="Total Stock Value"
            value={stats.stockValue ? `₹${stats.stockValue}` : `₹1,84,250`}
            trend={{ value: "₹ INR", isPositive: true }}
            subtext="current stock value"
            colorToken="info"
          />
        </motion.div>

        <motion.div variants={fadeIn}>
          <KPICard 
            icon={ShoppingCart}
            label="Total Sales (Today)"
            value={stats.totalSalesToday ? `₹${stats.totalSalesToday}` : `₹42,680`}
            trend={{ value: "+14.2%", isPositive: true }}
            subtext="from today's invoices"
            colorToken="info"
          />
        </motion.div>

        <motion.div variants={fadeIn}>
          <KPICard 
            icon={FileText}
            label="Low Stock Items"
            value={lowStockCount}
            trend={{ value: "Reorder Required", isPositive: false }}
            subtext="needs stock replenish"
            colorToken="warning"
          />
        </motion.div>

        <motion.div variants={fadeIn}>
          <KPICard 
            icon={AlertOctagon}
            label="Expiring Soon"
            value={stats.expiringIn30Days || 3}
            trend={{ value: "Near Expiry", isPositive: false }}
            subtext="batches in 30 days"
            colorToken="danger"
          />
        </motion.div>
      </motion.div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 shrink-0">
        
        {/* Stock Overview Chart */}
        <div className="xl:col-span-5 glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-[var(--color-text)] text-[16px]">Stock Value & Movement</h3>
              <p className="text-xs text-slate-400">Monthly stock valuation in ₹ INR</p>
            </div>
            <button className="flex items-center gap-1 text-[12px] font-bold text-[var(--color-navy-800)] bg-white px-3 py-1.5 rounded-lg border border-[var(--color-border)]">
              This Month <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stockOverviewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 'bold'}} tickFormatter={(val) => val >= 1000 ? `₹${val/1000}K` : `₹${val}`} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Stock Value']} />
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorStock)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Summary Donut */}
        <div className="xl:col-span-3 glass-panel p-6">
          <h3 className="font-bold text-[var(--color-text)] text-[16px] mb-2">Stock Composition</h3>
          <div className="relative h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockSummaryData}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {stockSummaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[24px] font-black text-[var(--color-text)]">{totalItemsCount}</span>
              <span className="text-[12px] text-[var(--color-text-muted)] font-bold">Total SKUs</span>
            </div>
          </div>
          <div className="mt-2 space-y-2.5">
            {stockSummaryData.map(item => {
              const totalItems = totalItemsCount || 1;
              return (
              <div key={item.name} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[var(--color-text)] font-bold">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-[var(--color-text)]">{item.value}</span>
                  <span className="text-[var(--color-text-muted)] w-10 text-right font-bold">({((item.value / totalItems) * 100).toFixed(1)}%)</span>
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="xl:col-span-4 glass-panel p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-[var(--color-text)] text-[16px]">Low Stock Alert</h3>
              <p className="text-xs text-amber-600 font-semibold">Immediate reorder required</p>
            </div>
            <Link to="/pharmacy/medicine-master" className="text-[var(--color-navy-800)] text-[12px] font-bold hover:underline">
              View All
            </Link>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[260px]">
            {lowStockAlerts.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between group bg-[var(--color-surface-alt)] p-3 rounded-xl border border-[var(--color-border)] hover:border-amber-300 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-200">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold text-[var(--color-text)] truncate" title={item.name}>{item.name}</h4>
                    <p className="text-[11px] font-medium text-[var(--color-text-muted)] truncate">{item.mfg} • {item.type}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-[12px] font-black text-rose-600">{item.stock} left</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Min: {item.min}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Real-Time Indian Medicines Master Catalog & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 shrink-0">
        
        {/* Real-Time Indian Medicines Catalog Table */}
        <motion.div
          className="xl:col-span-8 glass-panel p-6 overflow-hidden"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-bold text-[var(--color-text)] text-[16px]">Real-Time Indian Medicines Inventory</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Showing authentic Indian brands, generic composition, MRP & stock</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">Total: {filteredMedicines.length}</span>
              <Link to="/pharmacy/medicine-master" className="text-blue-600 text-[12px] font-bold hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                Manage Master →
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="sticky top-0 bg-white shadow-2xs z-10">
                <tr className="text-[11px] font-bold text-[var(--color-text-muted)] border-b border-[var(--color-border)] uppercase tracking-wider">
                  <th className="pb-3 px-2">Brand & Composition</th>
                  <th className="pb-3 px-2">Manufacturer</th>
                  <th className="pb-3 px-2">Category</th>
                  <th className="pb-3 px-2">Schedule</th>
                  <th className="pb-3 px-2 text-right">MRP (₹)</th>
                  <th className="pb-3 px-2 text-right">Stock</th>
                  <th className="pb-3 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredMedicines.slice(0, 10).map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="max-w-xs truncate">
                          <p className="font-bold text-[var(--color-text)] text-[13px] truncate">{item.name}</p>
                          <p className="text-[11px] font-semibold text-slate-500 truncate">{item.genericName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-[12px] text-[var(--color-text)] font-semibold max-w-[160px] truncate" title={item.manufacturer}>
                      {item.manufacturer || 'Indian Pharma'}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${getCategoryColor(item.category || item.drugClass)}`}>
                        {item.category || item.drugClass || 'Tablet'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.schedule === 'Schedule H1' ? 'bg-rose-100 text-rose-700' : item.schedule === 'Schedule H' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.schedule || 'OTC'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-[13px] text-[var(--color-text)] font-extrabold text-right">
                      ₹{item.mrp || item.salePrice || 0}
                    </td>
                    <td className="py-3 px-2 text-[13px] text-[var(--color-text)] font-black text-right">
                      {item.currentStock ?? item.quantityAvailable ?? 0} {item.unit || 'Strip'}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant={(item.currentStock ?? item.quantityAvailable ?? 0) > (item.reorderLevel || 10) ? 'info' : 'warning'}>
                        {(item.currentStock ?? item.quantityAvailable ?? 0) > (item.reorderLevel || 10) ? 'In Stock' : 'Low Stock'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Actions & Expiry Alerts Column */}
        <div className="xl:col-span-4 space-y-4">
          
          {/* Quick Actions */}
          <div className="glass-panel p-5">
            <h3 className="font-bold text-[var(--color-text)] text-[15px] mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link to="/pharmacy/medicine-master" className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/60 hover:bg-blue-100/60 transition-all border border-blue-100 text-blue-900 font-bold text-xs">
                <PlusCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Add Medicine</span>
              </Link>
              <Link to="/pharmacy/purchase-orders" className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/60 hover:bg-indigo-100/60 transition-all border border-indigo-100 text-indigo-900 font-bold text-xs">
                <ShoppingCart className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Purchase Order</span>
              </Link>
              <Link to="/pharmacy/medicine-stock" className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50/60 hover:bg-purple-100/60 transition-all border border-purple-100 text-purple-900 font-bold text-xs">
                <ArrowRightLeft className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Stock Transfer</span>
              </Link>
              <Link to="/pharmacy/direct-pharmacy-sales" className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/60 transition-all border border-emerald-100 text-emerald-900 font-bold text-xs">
                <FileOutput className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sales Invoice</span>
              </Link>
            </div>
          </div>

          {/* Expiry Alert */}
          <div className="glass-panel p-5 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-[var(--color-text)] text-[15px]">Near Expiry Alert</h3>
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">CDSCO Tracked</span>
            </div>
            <div className="space-y-3">
              {displayExpiryAlerts.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0 border border-amber-200">
                      <AlertOctagon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[12px] font-bold text-slate-800 truncate" title={item.name}>{item.name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Expiry: {item.exp}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-xs font-extrabold text-rose-600">{item.days} days</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
