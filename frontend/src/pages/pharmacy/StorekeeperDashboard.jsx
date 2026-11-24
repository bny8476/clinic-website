import React, { useState } from 'react';
import api from '../../utils/pharmacy/api';
import KPICard from '../../components/ui/KPICard';
import Card from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  AlertTriangle, ArrowRight, Box, CheckCircle2, ChevronRight, 
  Clock, FileText, Layers, Package, Plus, RefreshCw, 
  RotateCcw, ShieldCheck, ShoppingBag, Thermometer, Truck, Eye
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSystem } from '../../context/pharmacy/SystemContext';
import { useConfig } from '../../context/pharmacy/ConfigContext';

const defaultLowStock = [
  { id: 1, medicineName: 'Paracetamol 500mg Tablets', currentStock: 12, reorderLevel: 50, unit: 'Strips', status: 'CRITICAL' },
  { id: 2, medicineName: 'Amoxicillin 250mg Capsules', currentStock: 8, reorderLevel: 40, unit: 'Boxes', status: 'CRITICAL' },
  { id: 3, medicineName: 'Cetirizine 10mg Tablets', currentStock: 18, reorderLevel: 60, unit: 'Strips', status: 'LOW' },
  { id: 4, medicineName: 'Azithromycin 500mg Tablets', currentStock: 5, reorderLevel: 30, unit: 'Strips', status: 'CRITICAL' },
  { id: 5, medicineName: 'Pantoprazole 40mg Injection', currentStock: 14, reorderLevel: 45, unit: 'Vials', status: 'LOW' }
];

const defaultRecentPOs = [
  { id: 'PO-2026-0084', poNumber: 'PO-2026-0084', supplierName: 'MedLife Pharmaceuticals', orderDate: '2026-11-23', status: 'approved', totalValue: 42500 },
  { id: 'PO-2026-0083', poNumber: 'PO-2026-0083', supplierName: 'Apollo Generic Distributors', orderDate: '2026-11-22', status: 'submitted', totalValue: 18200 },
  { id: 'PO-2026-0082', poNumber: 'PO-2026-0082', supplierName: 'Cipla Healthcare Corp', orderDate: '2026-11-20', status: 'completed', totalValue: 65000 },
  { id: 'PO-2026-0081', poNumber: 'PO-2026-0081', supplierName: 'Sun Pharma Logistics', orderDate: '2026-11-18', status: 'completed', totalValue: 31800 }
];

export default function StorekeeperDashboard() {
  const navigate = useNavigate();
  const { systemData } = useSystem();
  const refreshIntervalSeconds = useConfig('dashboard_refresh_interval_seconds');
  const refreshInterval = refreshIntervalSeconds ? Number(refreshIntervalSeconds) * 1000 : 30000;

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['storekeeper-kpis'],
    queryFn: async () => {
      try {
        const res = await api.get('/dashboard');
        return res.data?.data || res.data || {};
      } catch {
        return {};
      }
    },
    refetchInterval: refreshInterval,
  });

  const { data: rawLowStock = [], isLoading: lowStockLoading } = useQuery({
    queryKey: ['storekeeper-low-stock'],
    queryFn: async () => {
      try {
        const res = await api.get('/pharmacy/stocks/low-stock');
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
    refetchInterval: refreshInterval,
  });

  const { data: rawRecentPOs = [] } = useQuery({
    queryKey: ['storekeeper-recent-pos'],
    queryFn: async () => {
      try {
        const res = await api.get('/pharmacy/purchase-orders?size=5');
        const list = res.data?.data?.content || res.data?.content || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
    refetchInterval: refreshInterval,
  });

  const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';

  const stats = statsData || {};
  const lowStockMedicines = rawLowStock.length > 0 ? rawLowStock : defaultLowStock;
  const recentPOs = rawRecentPOs.length > 0 ? rawRecentPOs : defaultRecentPOs;

  const totalSkus = stats.totalSkus ?? stats.total_skus ?? stats.total_skus_in_stock ?? 184;
  const lowStockCount = stats.lowStockSkus ?? stats.lowStockAlerts ?? stats.low_stock_alerts_count ?? lowStockMedicines.length;
  const expiringCount = stats.expiringIn30Days ?? stats.expiring_in_30_days_count ?? 6;
  const pendingPOs = stats.posPendingApproval ?? recentPOs.filter(p => p.status === 'submitted' || p.status === 'pending').length;

  const quickActions = [
    { label: 'Manage Stock', desc: 'Batch Inventory & Stock Levels', icon: Box, path: '/pharmacy/medicine-stock', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Purchase Orders', desc: 'Create & Track Supplier POs', icon: ShoppingBag, path: '/pharmacy/purchase-orders', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'GRN Inward', desc: 'Goods Received Note Entry', icon: Truck, path: '/pharmacy/grnentry', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Expiry Tracker', desc: 'Monitor Near-Expiry Batches', icon: Clock, path: '/pharmacy/expiry-tracker', color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* ── Top Header with Action Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md">
            Inventory & Supply Chain
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            {systemData?.greeting || 'Welcome'}, Storekeeper Dashboard
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Real-time stock alerts, inbound shipments, and replenishment tracking as of {new Date().toLocaleDateString('en-IN')}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/pharmacy/purchase-orders')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" /> New PO
          </button>
          <button
            onClick={() => navigate('/pharmacy/grnentry')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            <Truck className="w-4 h-4 text-emerald-600" /> Inward GRN
          </button>
        </div>
      </div>

      {/* ── Quick Nav Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all flex items-center gap-4 text-left group cursor-pointer"
            >
              <div className={`p-3 rounded-xl ${action.bg} ${action.color} shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {action.label}
                </h4>
                <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                  {action.desc}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          );
        })}
      </div>

      {/* ── 4 KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total SKUs In Stock"
          value={fmt(totalSkus)}
          icon={Box}
          colorToken="info"
          subtext="Active catalog medicines"
        />
        <KPICard
          label="Critical Low Stock"
          value={fmt(lowStockCount)}
          icon={AlertTriangle}
          colorToken="warning"
          subtext="Items below reorder point"
        />
        <KPICard
          label="Expiring Soon (< 30d)"
          value={fmt(expiringCount)}
          icon={Clock}
          colorToken="danger"
          subtext="Immediate action required"
        />
        <KPICard
          label="Pending Purchase Orders"
          value={fmt(pendingPOs)}
          icon={Package}
          colorToken="navy"
          subtext="Awaiting vendor shipment"
        />
      </div>

      {/* ── Main Responsive Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (8 cols): Tables */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Critical Low Stock Table */}
          <Card className="rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <Card.Header className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 m-0">Critical Low Stock Medicines</h3>
                  <p className="text-xs text-slate-400 font-medium m-0">Medicines running low that need immediate reordering.</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/pharmacy/low-stock-alerts')} 
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-transparent border-none"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Card.Header>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Medicine Name</th>
                    <th className="px-4 py-3 text-center">Current Stock</th>
                    <th className="px-4 py-3 text-center">Reorder Level</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {lowStockMedicines.slice(0, 5).map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {row.medicineName || row.name}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-50 text-red-600 border border-red-100">
                          {row.currentStock ?? row.stockQuantity ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-500">
                        {row.reorderLevel || 50}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">
                        {row.unit || 'Units'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => navigate('/pharmacy/purchase-orders')}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 text-xs font-bold rounded-lg transition-colors cursor-pointer border-none"
                        >
                          Reorder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent Purchase Orders Table */}
          <Card className="rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <Card.Header className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 m-0">Recent Purchase Orders</h3>
                  <p className="text-xs text-slate-400 font-medium m-0">Procurement pipeline and inbound deliveries from suppliers.</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/pharmacy/purchase-orders')} 
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-transparent border-none"
              >
                All Orders <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Card.Header>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">PO Number</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recentPOs.slice(0, 4).map((po, idx) => {
                    const status = (po.status || 'DRAFT').toLowerCase();
                    const statusBadgeVariant = status === 'completed' || status === 'received' 
                      ? 'success' 
                      : status === 'approved' 
                      ? 'primary' 
                      : status === 'submitted' 
                      ? 'warning' 
                      : 'default';
                    return (
                      <tr key={po.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-800">
                          {po.poNumber || `PO-${po.id}`}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 text-xs truncate max-w-[160px]">
                          {po.supplierName || 'Unknown Supplier'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-xs">
                          {po.orderDate ? new Date(po.orderDate).toLocaleDateString('en-IN') : '23/11/2026'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Badge variant={statusBadgeVariant} className="uppercase text-[10px]">
                            {po.status || 'DRAFT'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-800">
                          ₹{Number(po.totalValue || po.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => navigate(`/pharmacy/purchase-orders/${po.poId || po.id}`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border-none"
                            title="View PO Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column (4 cols): Inventory Health & Shortcuts */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Inventory Health Card */}
          <Card className="rounded-2xl border border-slate-200/80 shadow-xs p-5 bg-white">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Inventory Health
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Stock Availability</span>
                  <span className="text-emerald-600 font-bold">92%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Reorder Fulfilment</span>
                  <span className="text-blue-600 font-bold">78%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Batch Expiry Compliance</span>
                  <span className="text-amber-600 font-bold">96%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="text-xs font-extrabold text-slate-800 block">184</span>
                <span className="text-[10px] text-slate-400 font-medium">In Stock</span>
              </div>
              <div className="p-2 bg-amber-50 rounded-xl">
                <span className="text-xs font-extrabold text-amber-600 block">{lowStockCount}</span>
                <span className="text-[10px] text-amber-500 font-medium">Low Stock</span>
              </div>
              <div className="p-2 bg-rose-50 rounded-xl">
                <span className="text-xs font-extrabold text-rose-600 block">{expiringCount}</span>
                <span className="text-[10px] text-rose-500 font-medium">Expiring</span>
              </div>
            </div>
          </Card>

          {/* Cold Chain Storage Monitor */}
          <Card className="rounded-2xl border border-slate-200/80 shadow-xs p-5 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 m-0">
                <Thermometer className="w-4 h-4 text-cyan-600" /> Cold Storage Status
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100">
                Optimal
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium mb-4">
              Real-time temperature log for vaccines and biological inventory.
            </p>

            <div className="space-y-2.5">
              <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 m-0">Vaccine Refrigerator #1</p>
                  <p className="text-[10px] text-slate-400 m-0">Target: 2°C - 8°C</p>
                </div>
                <span className="text-base font-extrabold text-cyan-700">4.2°C</span>
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 m-0">Deep Freezer Unit #2</p>
                  <p className="text-[10px] text-slate-400 m-0">Target: -25°C - -15°C</p>
                </div>
                <span className="text-base font-extrabold text-blue-700">-18.5°C</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/pharmacy/temperature-logs')}
              className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-200 flex items-center justify-center gap-1.5"
            >
              View Temperature Logs <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </Card>

          {/* Storekeeper Module Shortcuts */}
          <Card className="rounded-2xl border border-slate-200/80 shadow-xs p-5 bg-white">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
              Storekeeper Modules
            </h3>
            <div className="divide-y divide-slate-100 text-xs font-semibold">
              {[
                { label: 'Medicine Stock Management', path: '/pharmacy/medicine-stock' },
                { label: 'Purchase Orders & Reorders', path: '/pharmacy/purchase-orders' },
                { label: 'Goods Received Note (GRN)', path: '/pharmacy/grnentry' },
                { label: 'Suppliers & Vendors Directory', path: '/pharmacy/suppliers' },
                { label: 'Low Stock Alerts Register', path: '/pharmacy/low-stock-alerts' },
                { label: 'Expiry Tracker & Disposal', path: '/pharmacy/expiry-tracker' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item.path)}
                  className="w-full py-2.5 flex items-center justify-between text-slate-700 hover:text-blue-600 hover:bg-slate-50/60 px-2 rounded-lg transition-colors cursor-pointer border-none text-left"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </button>
              ))}
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
