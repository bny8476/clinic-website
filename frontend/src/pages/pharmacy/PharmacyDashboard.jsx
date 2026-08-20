import { useQuery } from '@tanstack/react-query';
import api from '../../utils/pharmacy/api';
import KPICard from '../../components/ui/KPICard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeIn } from '../../components/ui/motion';
import { 
  Package, Database, ShoppingCart, FileText, AlertOctagon, 
  ChevronDown, Calendar, PlusCircle, ArrowRightLeft, 
  FileOutput, ArrowDownToLine, Settings2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {


  ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, 
  CartesianGrid, PieChart, Pie, Cell
} from 'recharts';



export default function PharmacyDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['pharmacy-kpis'],
    queryFn: () => api.get('/dashboard').then(r => r.data?.data || {}).catch(() => ({})),
    retry: false
  });

  // Mock data for charts and tables to perfectly match the design
  const stockOverviewData = [
    { name: '1 May', value: 12000 },
    { name: '5 May', value: 19000 },
    { name: '9 May', value: 24000 },
    { name: '13 May', value: 20000 },
    { name: '17 May', value: 27000 },
    { name: '21 May', value: 24560 },
  ];

  const stockSummaryData = [
    { name: 'In Stock', value: 876, color: '#10b981' },
    { name: 'Low Stock', value: 32, color: '#f59e0b' },
    { name: 'Out of Stock', value: 24, color: '#ef4444' },
    { name: 'Expired', value: 7, color: '#8b5cf6' },
  ];

  const lowStockAlerts = [
    { name: 'Paracetamol 650mg', type: 'Tablet', stock: 15, min: 50 },
    { name: 'Amoxicillin 500mg', type: 'Capsule', stock: 8, min: 30 },
    { name: 'Cetirizine 10mg', type: 'Tablet', stock: 12, min: 25 },
    { name: 'Salbutamol 100mcg', type: 'Inhaler', stock: 5, min: 20 },
    { name: 'Pantoprazole 40mg', type: 'Tablet', stock: 10, min: 20 },
  ];

  const recentlyAdded = [
    { name: 'Azithromycin 500mg', type: 'Tablet', category: 'Antibiotic', mfg: 'Cipla Ltd.', batch: 'AZ50023', exp: '31 Dec 2025', stock: 120, price: '$2.50', status: 'In Stock' },
    { name: 'Vitamin D3 60000 IU', type: 'Capsule', category: 'Vitamins', mfg: 'Sun Pharma', batch: 'VD360023', exp: '30 Nov 2025', stock: 85, price: '$3.20', status: 'In Stock' },
    { name: 'Metformin 500mg', type: 'Tablet', category: 'Diabetes', mfg: 'Mankind Pharma', batch: 'MF50023', exp: '30 Sep 2025', stock: 200, price: '$1.10', status: 'In Stock' },
    { name: 'Losartan 50mg', type: 'Tablet', category: 'Cardiovascular', mfg: 'Zydus Cadila', batch: 'LS50023', exp: '31 Aug 2025', stock: 60, price: '$1.80', status: 'Low Stock' },
    { name: 'Omeprazole 20mg', type: 'Capsule', category: 'Gastric', mfg: 'Dr. Reddy\'s', batch: 'OM20023', exp: '30 Jul 2025', stock: 25, price: '$1.40', status: 'Low Stock' },
  ];

  const expiryAlerts = [
    { name: 'Doxycycline 100mg', exp: '15 Jun 2024', days: 25 },
    { name: 'Ranitidine 150mg', exp: '22 Jun 2024', days: 32 },
    { name: 'Albendazole 400mg', exp: '05 Jul 2024', days: 45 },
  ];

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
            value="1,248"
            trend={{ value: "8.5%", isPositive: true }}
            subtext="from last month"
            colorToken="info"
          />
        </motion.div>

        <motion.div variants={fadeIn}>
          <KPICard 
            icon={Database}
            label="Total Stock Value"
            value="₹24,560.80"
            trend={{ value: "12.3%", isPositive: true }}
            subtext="from last month"
            colorToken="info"
          />
        </motion.div>

        <motion.div variants={fadeIn}>
          <KPICard 
            icon={ShoppingCart}
            label="Total Sales (Today)"
            value="₹1,245.30"
            trend={{ value: "6.7%", isPositive: true }}
            subtext="from yesterday"
            colorToken="info"
          />
        </motion.div>

        <motion.div variants={fadeIn}>
          <KPICard 
            icon={FileText}
            label="Low Stock Items"
            value="32"
            trend={{ value: "5", isPositive: false }}
            subtext="from yesterday"
            colorToken="warning"
          />
        </motion.div>

        <motion.div variants={fadeIn}>
          <KPICard 
            icon={AlertOctagon}
            label="Expired Items"
            value="7"
            trend={{ value: "2", isPositive: false }}
            subtext="from yesterday"
            colorToken="danger"
          />
        </motion.div>
      </motion.div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-6 shrink-0">
        
        {/* Stock Overview Chart */}
        <div className="xl:col-span-5 bg-white rounded-xl p-6 border border-[var(--color-border)] shadow-sm">
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
        <div className="xl:col-span-3 bg-white rounded-xl p-6 border border-[var(--color-border)] shadow-sm">
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
              <span className="text-[24px] font-black text-[var(--color-text)]">1,248</span>
              <span className="text-[12px] text-[var(--color-text-muted)] font-bold">Total Items</span>
            </div>
          </div>
          <div className="mt-2 space-y-2.5">
            {stockSummaryData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[var(--color-text)] font-bold">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-[var(--color-text)]">{item.value}</span>
                  <span className="text-[var(--color-text-muted)] w-10 text-right font-bold">({(item.value / 1248 * 100).toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="xl:col-span-4 bg-white rounded-xl p-6 border border-[var(--color-border)] shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[var(--color-text)] text-[16px]">Low Stock Alert</h3>
            <button className="text-[var(--color-navy-800)] text-[12px] font-bold hover:underline">View All</button>
          </div>
          <div className="flex-1 space-y-4">
            {lowStockAlerts.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between group bg-slate-50 p-3 rounded-lg border border-[var(--color-border)]">
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
          className="xl:col-span-6 bg-white rounded-xl p-6 border border-[var(--color-border)] shadow-sm overflow-hidden"
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
                  <motion.tr key={idx} variants={fadeIn} className="hover:bg-slate-50 transition-colors">
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
        <div className="xl:col-span-3 bg-white rounded-xl p-6 border border-[var(--color-border)] shadow-sm">
          <h3 className="font-bold text-[var(--color-text)] text-[16px] mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/pharmacy/medicine-master" className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-[var(--color-border)] group">
              <div className="w-10 h-10 rounded-full bg-[var(--color-info-bg)] text-[var(--color-navy-600)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <PlusCircle className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-[var(--color-text)] text-center">Add Medicine</span>
            </Link>
            <Link to="/pharmacy/purchase-orders" className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-[var(--color-border)] group">
              <div className="w-10 h-10 rounded-full bg-[var(--color-info-bg)] text-[var(--color-navy-600)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-[var(--color-text)] text-center">Purchase Order</span>
            </Link>
            <Link to="/pharmacy/medicine-stock" className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-[var(--color-border)] group">
              <div className="w-10 h-10 rounded-full bg-[var(--color-info-bg)] text-[var(--color-navy-600)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-[var(--color-text)] text-center">Stock Transfer</span>
            </Link>
            <Link to="/pharmacy/direct-pharmacy-sales" className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-[var(--color-border)] group">
              <div className="w-10 h-10 rounded-full bg-[var(--color-info-bg)] text-[var(--color-navy-600)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileOutput className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-[var(--color-text)] text-center">Sales Invoice</span>
            </Link>
            <Link to="/pharmacy/grnentry" className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-[var(--color-border)] group">
              <div className="w-10 h-10 rounded-full bg-[var(--color-info-bg)] text-[var(--color-navy-600)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowDownToLine className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-[var(--color-text)] text-center">GRN Entry</span>
            </Link>
            <Link to="/pharmacy/medicine-stock" className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-[var(--color-border)] group">
              <div className="w-10 h-10 rounded-full bg-[var(--color-info-bg)] text-[var(--color-navy-600)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Settings2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-[var(--color-text)] text-center">Stock Adjust</span>
            </Link>
          </div>
        </div>

        {/* Expiry Alert */}
        <div className="xl:col-span-3 bg-white rounded-xl p-6 border border-[var(--color-border)] shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[var(--color-text)] text-[16px]">Expiry Alert</h3>
            <button className="text-[var(--color-navy-800)] text-[12px] font-bold hover:underline">View All</button>
          </div>
          <div className="flex-1 space-y-5">
            {expiryAlerts.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between group p-3 rounded-lg border border-[var(--color-border)] bg-slate-50">
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
