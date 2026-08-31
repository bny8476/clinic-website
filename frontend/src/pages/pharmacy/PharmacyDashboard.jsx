import api from '../../utils/pharmacy/api';
import KPICard from '../../components/ui/KPICard';
import { useQuery } from '@tanstack/react-query';
import { fadeIn, staggerContainer } from '../../components/ui/motion';
import { AlertOctagon, ArrowDownToLine, ArrowRightLeft, Calendar, ChevronDown, Database, FileOutput, FileText, Package, PlusCircle, Settings2, ShoppingCart, Sun } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';

export default function PharmacyDashboard() {
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
      return Array.isArray(content) ? content.slice(0, 5) : [];
    }).catch(() => []),
    refetchInterval: 10000
  });

  const stats = summaryData?.kpiData || {};

  // Mock data for charts and tables to perfectly match the design
  const stockOverviewData = (summaryData?.chartData || []).map(point => ({
    name: point.label,
    value: point.value
  }));

  const stockSummaryData = [
    { name: 'Total SKUs', value: stats.totalSkus || 0, color: '#10b981' },
    { name: 'Low Stock Alerts', value: stats.lowStockAlerts || 0, color: '#f59e0b' },
    { name: 'Expiring Soon', value: stats.expiringIn30Days || 0, color: '#8b5cf6' },
  ];

  const lowStockAlerts = lowStockData.map(item => ({
    name: item.medicineName || 'Unknown',
    type: item.category || 'General',
    stock: item.quantityAvailable || 0,
    min: item.reorderLevel || 0
  }));

  const recentlyAdded = medicinesData.map(m => ({
    name: m.name,
    type: m.unit || 'Unit',
    category: m.category || 'General',
    mfg: m.manufacturer || 'Unknown',
    batch: m.barcode || 'N/A',
    exp: 'N/A',
    stock: m.currentStock || 0,
    price: `$${m.salePrice || m.mrp || 0}`,
    status: (m.currentStock > (m.reorderLevel || 0)) ? 'In Stock' : 'Low Stock'
  }));

  const expiryAlerts = (summaryData?.alerts || [])
    .filter(a => a.type === 'EXPIRY' || a.category === 'EXPIRY')
    .map(a => ({
      name: a.title,
      exp: a.message,
      days: 30
    }));

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock': return 'bg-blue-100 text-blue-700';
      case 'Low Stock': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-[var(--color-text-muted)]';
    }
  };

  const getCategoryColor = (cat) => {
    switch(cat) {
      case 'Antibiotic': return 'bg-indigo-50 text-indigo-700';
      case 'Vitamins': return 'bg-blue-50 text-[var(--color-navy-800)]';
      case 'Diabetes': return 'bg-blue-50 text-[var(--color-navy-800)]';
      case 'Cardiovascular': return 'bg-rose-50 text-rose-700';
      case 'Gastric': return 'bg-amber-50 text-amber-700';
      default: return 'bg-slate-50 text-[var(--color-text-muted)]';
    }
  };

  return (
    
    <div className="font-sans h-full flex flex-col overflow-y-auto bg-[var(--color-bg-app)] p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-[24px] font-bold text-[var(--color-text)] tracking-tight">Dashboard</h1>
          <p className="text-[14px] text-[var(--color-text-muted)] mt-1">Overview of your pharmacy inventory and sales</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[var(--color-border)] rounded-lg text-[13px] font-bold text-[var(--color-navy-800)] shadow-sm hover:bg-[var(--color-navy-800)] hover:text-white transition-colors">
          <Calendar className="w-4 h-4" />
          Today, 21 May 2024
          <ChevronDown className="w-4 h-4 ml-2" />
        </button>
      </div>

      {/* 5 KPI Cards */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 shrink-0"
      >
        <motion.div variants={fadeIn}>
          <KPICard 
            icon={Package}
            label="Total Medicines"
            value={stats.totalSkus || 0}
            trend={{ value: "N/A", isPositive: true }}
            subtext="registered items"
            colorToken="info"
          />
        </motion.div>

        <motion.div variants={fadeIn}>
          <KPICard 
            icon={Database}
            label="Total Stock Value"
            value={`₹${stats.stockValue || 0}`}
            trend={{ value: "N/A", isPositive: true }}
            subtext="current value"
            colorToken="info"
          />
        </motion.div>

        <motion.div variants={fadeIn}>
          <KPICard 
            icon={ShoppingCart}
            label="Total Sales (Today)"
            value={`₹${stats.totalSalesToday || stats.todayRevenue || 0}`}
            trend={{ value: "N/A", isPositive: true }}
            subtext="from today's bills"
            colorToken="info"
          />
        </motion.div>

        <motion.div variants={fadeIn}>
          <KPICard 
            icon={FileText}
            label="Low Stock Items"
            value={stats.lowStockAlerts || stats.lowStockSkus || stats.lowStockItems || 0}
            trend={{ value: "Check", isPositive: false }}
            subtext="needs attention"
            colorToken="warning"
          />
        </motion.div>

        <motion.div variants={fadeIn}>
          <KPICard 
            icon={AlertOctagon}
            label="Expiring Soon"
            value={stats.expiringIn30Days || 0}
            trend={{ value: "30 Days", isPositive: false }}
            subtext="items near expiry"
            colorToken="danger"
          />
        </motion.div>
      </motion.div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-6 shrink-0">
        
        {/* Stock Overview Chart */}
        <div className="xl:col-span-5 glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[var(--color-text)] text-[16px]">Stock Overview</h3>
            <button className="flex items-center gap-1 text-[12px] font-bold text-[var(--color-navy-800)] bg-white px-3 py-1.5 rounded-lg border border-[var(--color-border)]">
              This Month <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stockOverviewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 'bold'}} tickFormatter={(val) => val >= 1000 ? `${val/1000}K` : val} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorStock)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Summary Donut */}
        <div className="xl:col-span-3 glass-panel p-6">
          <h3 className="font-bold text-[var(--color-text)] text-[16px] mb-2">Stock Summary</h3>
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
              <span className="text-[24px] font-black text-[var(--color-text)]">{stats.totalSkus || 0}</span>
              <span className="text-[12px] text-[var(--color-text-muted)] font-bold">Total Items</span>
            </div>
          </div>
          <div className="mt-2 space-y-2.5">
            {stockSummaryData.map(item => {
              const totalItems = stats.totalSkus || 1; // Prevent div by 0
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
            <h3 className="font-bold text-[var(--color-text)] text-[16px]">Low Stock Alert</h3>
            <button className="text-[var(--color-navy-800)] text-[12px] font-bold hover:underline">View All</button>
          </div>
          <div className="flex-1 space-y-4">
            {lowStockAlerts.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between group bg-[var(--color-surface-alt)] p-3 rounded-lg border border-[var(--color-border)] data-grid-row">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 bg-[var(--color-info-bg)] rounded-full flex items-center justify-center text-[var(--color-navy-600)] shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold text-[var(--color-text)] group-hover:text-[var(--color-navy-800)] transition-colors truncate" title={item.name}>{item.name}</h4>
                    <p className="text-[11px] font-medium text-[var(--color-text-muted)] mt-0.5 truncate">{item.type}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-[12px] font-black text-rose-600">Stock: {item.stock}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] font-bold">Min: {item.min}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 shrink-0">
        
        {/* Recently Added Medicines */}
        <motion.div
          className="xl:col-span-6 glass-panel p-6 overflow-hidden"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[var(--color-text)] text-[16px]">Recently Added Medicines</h3>
            <button className="text-[var(--color-navy-800)] text-[12px] font-bold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead>
                <tr className="text-[11px] font-bold text-[var(--color-text-muted)] border-b border-[var(--color-border)] uppercase tracking-wider">
                  <th className="pb-3 px-2">Medicine Name</th>
                  <th className="pb-3 px-2">Category</th>
                  <th className="pb-3 px-2">Manufacturer</th>
                  <th className="pb-3 px-2">Batch No.</th>
                  <th className="pb-3 px-2">Expiry Date</th>
                  <th className="pb-3 px-2 text-right">Stock</th>
                  <th className="pb-3 px-2 text-right">Price</th>
                  <th className="pb-3 px-2 text-center">Status</th>
                </tr>
              </thead>
              <motion.tbody
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="divide-y divide-[var(--color-border)]"
              >
                {recentlyAdded.map((item, idx) => (
                  <motion.tr key={idx} variants={fadeIn} className="data-grid-row">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[var(--color-info-bg)] rounded-full flex items-center justify-center text-[var(--color-navy-600)] shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[var(--color-text)] text-[13px]">{item.name}</p>
                          <p className="text-[11px] font-medium text-[var(--color-text-muted)]">{item.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wide ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-[12px] text-[var(--color-text)] font-medium">{item.mfg}</td>
                    <td className="py-3 px-2 text-[12px] text-[var(--color-text-muted)] font-bold">{item.batch}</td>
                    <td className="py-3 px-2 text-[12px] text-[var(--color-text-muted)] font-bold">{item.exp}</td>
                    <td className="py-3 px-2 text-[13px] text-[var(--color-text)] font-black text-right">{item.stock}</td>
                    <td className="py-3 px-2 text-[13px] text-[var(--color-text)] font-black text-right">{item.price}</td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant={item.status === 'In Stock' ? 'info' : 'warning'}>
                        {item.status}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="xl:col-span-3 glass-panel p-6">
          <h3 className="font-bold text-[var(--color-text)] text-[16px] mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/pharmacy/medicine-master" className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:shadow-lg transition-all border border-slate-200/60 group data-grid-row">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 text-center">Add Medicine</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/pharmacy/purchase-orders" className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:shadow-lg transition-all border border-slate-200/60 group data-grid-row">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 text-center">Purchase Order</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/pharmacy/medicine-stock" className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:shadow-lg transition-all border border-slate-200/60 group data-grid-row">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 text-center">Stock Transfer</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/pharmacy/direct-pharmacy-sales" className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:shadow-lg transition-all border border-slate-200/60 group data-grid-row">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileOutput className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 text-center">Sales Invoice</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/pharmacy/grnentry" className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:shadow-lg transition-all border border-slate-200/60 group data-grid-row">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 text-center">GRN Entry</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/pharmacy/medicine-stock" className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:shadow-lg transition-all border border-slate-200/60 group data-grid-row">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Settings2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 text-center">Stock Adjust</span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Expiry Alert */}
        <div className="xl:col-span-3 glass-panel p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[var(--color-text)] text-[16px]">Expiry Alert</h3>
            <button className="text-[var(--color-navy-800)] text-[12px] font-bold hover:underline">View All</button>
          </div>
          <div className="flex-1 space-y-5">
            {expiryAlerts.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between group p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] data-grid-row">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 bg-[var(--color-info-bg)] rounded-full flex items-center justify-center text-[var(--color-navy-600)] shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[12px] font-bold text-[var(--color-text)] group-hover:text-[var(--color-navy-800)] transition-colors truncate" title={item.name}>{item.name}</h4>
                    <p className="text-[10px] text-[var(--color-text-muted)] font-medium mt-0.5 truncate">Expiry: {item.exp}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className={`text-[14px] font-black ${item.days < 30 ? 'text-rose-600' : 'text-amber-500'}`}>{item.days}</p>
                  <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${item.days < 30 ? 'text-rose-500' : 'text-amber-400'}`}>Days Left</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
    
  );
}
