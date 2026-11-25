import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import logger from '../../utils/logger';
import ErrorBanner from '../../components/pharmacy/ui/ErrorBanner';
import TableSkeleton from '../../components/pharmacy/ui/TableSkeleton';
import Pagination from '../../components/ui/Pagination';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'react-hot-toast';
import { useStockStore } from '../../store/useStockStore';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Boxes, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Layers, 
  Loader2, 
  PackagePlus, 
  PackageX, 
  Plus, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  ShoppingCart, 
  Truck, 
  X 
} from 'lucide-react';

export default function LowStockAlerts() {
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL'); // 'ALL' | 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW'
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const {
    lowStockItems: items,
    lowStockLoading: isLoading,
    lowStockError: isError,
    lowStockFetching: isFetching,
    lowStockPage: page,
    lowStockTotalElements: totalElements,
    setLowStockPage: goToPage,
    fetchLowStockAlerts: refetch
  } = useStockStore(useShallow(state => ({
    lowStockItems: state.lowStockItems,
    lowStockLoading: state.lowStockLoading,
    lowStockError: state.lowStockError,
    lowStockFetching: state.lowStockFetching,
    lowStockPage: state.lowStockPage,
    lowStockTotalElements: state.lowStockTotalElements,
    setLowStockPage: state.setLowStockPage,
    fetchLowStockAlerts: state.fetchLowStockAlerts
  })));

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Real-time polling every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch(true).then(() => {
        setLastUpdated(new Date());
      }).catch(() => {
        logger.warn('Low stock polling failed');
      });
    }, 30000);

    return () => clearInterval(intervalId);
  }, [refetch]);

  const handleManualRefresh = () => {
    refetch(true).then(() => {
      setLastUpdated(new Date());
      toast.success('Low stock alerts refreshed');
    }).catch(() => {
      toast.error('Failed to refresh data');
    });
  };

  // Helper calculations
  const getItemStock = (item) => {
    return Number(item.currentStock ?? item.stockQuantity ?? item.quantity ?? 0);
  };

  const getItemReorderLevel = (item) => {
    return Number(item.reorderLevel ?? 0);
  };

  const getDeficit = (item) => {
    const stock = getItemStock(item);
    const rlvl = getItemReorderLevel(item);
    return Math.max(0, rlvl - stock);
  };

  const getItemSeverity = (item) => {
    const stock = getItemStock(item);
    const rlvl = getItemReorderLevel(item);
    if (stock === 0) return 'OUT_OF_STOCK';
    if (rlvl > 0 && stock <= Math.ceil(rlvl * 0.5)) return 'CRITICAL';
    return 'LOW';
  };

  // Categories list for dropdown
  const categories = useMemo(() => {
    const set = new Set();
    items.forEach(it => {
      if (it.category?.trim()) set.add(it.category.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  // KPI Metrics Calculation
  const kpiCounts = useMemo(() => {
    let outOfStock = 0;
    let critical = 0;
    let low = 0;

    items.forEach(it => {
      const sev = getItemSeverity(it);
      if (sev === 'OUT_OF_STOCK') outOfStock++;
      else if (sev === 'CRITICAL') critical++;
      else low++;
    });

    return {
      total: items.length,
      outOfStock,
      critical,
      low
    };
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const sev = getItemSeverity(item);

      // Severity filter
      if (severityFilter !== 'ALL' && sev !== severityFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const medName = (item.medicineName || item.name || '').toLowerCase();
        const genName = (item.genericName || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        const supp = (item.supplierName || item.supplierVendor || '').toLowerCase();

        return medName.includes(query) || 
               genName.includes(query) || 
               cat.includes(query) || 
               supp.includes(query);
      }

      return true;
    });
  }, [items, severityFilter, categoryFilter, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold flex-shrink-0 border border-amber-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Low Stock Alerts Register</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live depletion monitoring, safety buffer replenishment, and purchase reorder triggers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-nowrap shrink-0 overflow-x-auto">
          {/* Last updated badge */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/70 px-3.5 py-2 rounded-xl text-xs text-slate-500 font-medium whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated: <strong className="text-slate-700">{lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong></span>
          </div>

          <button 
            onClick={handleManualRefresh} 
            disabled={isFetching}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200/80 cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap"
            title="Refresh stock levels"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-amber-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate('/pharmacy/purchase-orders')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer border-none whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Metric Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Low Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Alerts</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{kpiCounts.total}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">SKUs below safety buffer</div>
          </div>
          <div className="w-11 h-11 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Out of Stock (Stock = 0) */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs bg-rose-50/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" /> Out of Stock
            </div>
            <div className="text-2xl font-extrabold text-rose-700 mt-1">{kpiCounts.outOfStock}</div>
            <div className="text-[11px] text-rose-600/80 mt-0.5">Critical zero stock count</div>
          </div>
          <div className="w-11 h-11 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
            <PackageX className="w-5 h-5" />
          </div>
        </div>

        {/* Critically Low (<= 50% Reorder Level) */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs bg-amber-50/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Severe Depletion
            </div>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">{kpiCounts.critical}</div>
            <div className="text-[11px] text-amber-700/80 mt-0.5">Stock ≤ 50% reorder mark</div>
          </div>
          <div className="w-11 h-11 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock (51% - 100% Reorder Level) */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs bg-blue-50/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <PackagePlus className="w-3.5 h-3.5" /> Reorder Suggested
            </div>
            <div className="text-2xl font-extrabold text-blue-700 mt-1">{kpiCounts.low}</div>
            <div className="text-[11px] text-blue-700/80 mt-0.5">Prepare indent or PO</div>
          </div>
          <div className="w-11 h-11 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Search and Filter Controls ────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="flex-1 relative min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search medicine name, generic salt, or supplier…"
              className="w-full pl-10 pr-9 py-2.5 text-sm font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none placeholder:text-slate-400 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setSeverityFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                severityFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              All ({kpiCounts.total})
            </button>

            <button
              onClick={() => setSeverityFilter('OUT_OF_STOCK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                severityFilter === 'OUT_OF_STOCK'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              Out of Stock ({kpiCounts.outOfStock})
            </button>

            <button
              onClick={() => setSeverityFilter('CRITICAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                severityFilter === 'CRITICAL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Critical ({kpiCounts.critical})
            </button>

            <button
              onClick={() => setSeverityFilter('LOW')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                severityFilter === 'LOW'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
              }`}
            >
              Low Stock ({kpiCounts.low})
            </button>
          </div>
        </div>

        {/* Filter results info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <span className="font-bold text-slate-700">{filteredItems.length}</span> of {items.length} alerted items
            {severityFilter !== 'ALL' && <span className="ml-1 text-slate-600">filtered by <strong className="uppercase">{severityFilter}</strong></span>}
            {categoryFilter !== 'ALL' && <span className="ml-1 text-slate-600">in category <strong className="text-slate-700">{categoryFilter}</strong></span>}
          </div>
          {(searchTerm || severityFilter !== 'ALL' || categoryFilter !== 'ALL') && (
            <button 
              onClick={() => { setSearchTerm(''); setSeverityFilter('ALL'); setCategoryFilter('ALL'); }} 
              className="text-amber-700 hover:underline font-semibold cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* ── Table Card Container ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {isError ? (
          <div className="p-6">
            <ErrorBanner onRetry={refetch} />
          </div>
        ) : isLoading ? (
          <div className="p-8">
            <TableSkeleton rows={6} columns={7} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3.5">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {items.length === 0 ? 'All Inventory Levels are Healthy!' : 'No items match your filter criteria'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {items.length === 0 
                ? 'No medicines are currently at or below their reorder threshold buffer.' 
                : 'Try adjusting your search terms or clearing the selected severity category.'}
            </p>
            {items.length > 0 && (
              <button
                onClick={() => { setSearchTerm(''); setSeverityFilter('ALL'); setCategoryFilter('ALL'); }}
                className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Medicine & Formulation</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current Stock vs Reorder Level</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Required Deficit</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Alert Status</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Preferred Supplier</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, idx) => {
                  const stock = getItemStock(item);
                  const reorderLevel = getItemReorderLevel(item);
                  const deficit = getDeficit(item);
                  const severity = getItemSeverity(item);
                  const isZero = stock === 0;
                  const ratio = reorderLevel > 0 ? Math.min(100, Math.round((stock / reorderLevel) * 100)) : 0;

                  return (
                    <tr 
                      key={item.id || idx}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isZero 
                          ? 'bg-rose-50/20' 
                          : severity === 'CRITICAL' 
                          ? 'bg-amber-50/15' 
                          : ''
                      }`}
                    >
                      {/* Medicine Info */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-sm text-slate-800">
                          {item.medicineName || item.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {item.genericName && (
                            <span className="text-[11px] text-slate-500">
                              {item.genericName}
                            </span>
                          )}
                          {item.unit && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                              {item.unit}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                          {item.category || 'General Pharma'}
                        </span>
                      </td>

                      {/* Stock vs Reorder Level with Progress Bar */}
                      <td className="px-4 py-4 min-w-[200px]">
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className={isZero ? 'text-rose-600 font-extrabold' : 'text-slate-800'}>
                            {stock} {item.unit || 'units'}
                          </span>
                          <span className="text-slate-400 font-medium text-[11px]">
                            Reorder: {reorderLevel}
                          </span>
                        </div>
                        
                        {/* Progress meter */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              isZero 
                                ? 'bg-rose-500 w-0' 
                                : ratio <= 50 
                                ? 'bg-amber-500' 
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.max(5, ratio)}%` }}
                          />
                        </div>

                        {item.unitsPerPack > 1 && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            = {stock * item.unitsPerPack} loose units ({item.unitsPerPack}/pack)
                          </div>
                        )}
                      </td>

                      {/* Deficit */}
                      <td className="px-4 py-4 text-right">
                        <div className="text-sm font-extrabold text-rose-600">
                          +{deficit.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          to reach buffer
                        </div>
                      </td>

                      {/* Alert Status Badge */}
                      <td className="px-4 py-4 text-center">
                        {isZero ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertOctagon className="w-3 h-3 text-rose-600" /> OUT OF STOCK
                          </span>
                        ) : severity === 'CRITICAL' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> CRITICAL ({ratio}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <Clock className="w-3 h-3 text-blue-600" /> LOW STOCK
                          </span>
                        )}
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-4">
                        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[140px]">
                            {item.supplierName || item.supplierVendor || 'Primary Supplier'}
                          </span>
                        </div>
                        {item.lastUpdated && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Restocked {new Date(item.lastUpdated).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => navigate('/pharmacy/purchase-orders')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border-none"
                          title="Generate Purchase Order"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>Reorder</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {totalElements > 20 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              totalRecords={totalElements}
              currentPage={page + 1}
              pageSize={20}
              onPageChange={(p) => goToPage(p - 1)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
