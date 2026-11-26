import React, { useState } from 'react';
import useAuthStore from '../../store/authStore';
import { axiosPrivate as axios } from '../../api/axios';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fadeUp, listStagger, staggerChildren } from '../../components/ui/motion';
import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Package,
  Pill,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import MedicineOrderInvoiceModal from '../../components/patient/MedicineOrderInvoiceModal';

export default function Orders() {
  const [activeTab, setActiveTab] = useState('MEDICINE'); // 'MEDICINE' | 'STORE'
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const user = useAuthStore((state) => state.user);

  // 1. Medicine Orders Query with 3-second realtime polling
  const {
    data: medicineOrders = [],
    isLoading: loadingMedicines,
    isRefetching: refetchingMedicines
  } = useQuery({
    queryKey: ['patientMedicineOrders', user?.id],
    queryFn: async () => {
      try {
        const res = await axios.get('/patient/medicines/my-orders');
        return Array.isArray(res.data) ? res.data : (res.data?.content || []);
      } catch (err) {
        try {
          const fallbackRes = await axios.get('/patient/medicine-orders');
          return Array.isArray(fallbackRes.data) ? fallbackRes.data : (fallbackRes.data?.content || []);
        } catch {
          return [];
        }
      }
    },
    enabled: !!user?.id,
    refetchInterval: 3000,
    staleTime: 1000
  });

  const [storageTick, setStorageTick] = useState(0);

  React.useEffect(() => {
    const handleStorage = () => setStorageTick((t) => t + 1);
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const displayedMedicineOrders = React.useMemo(() => {
    let list = Array.isArray(medicineOrders) ? [...medicineOrders] : [];
    try {
      const listRaw = localStorage.getItem('clinic_patient_medicine_orders');
      if (listRaw) {
        const parsedList = JSON.parse(listRaw);
        if (Array.isArray(parsedList)) {
          for (const item of parsedList) {
            const idx = list.findIndex(o => 
              (o.orderNumber && o.orderNumber === item.orderNumber) || 
              (o.id && String(o.id) === String(item.id))
            );
            if (idx >= 0) {
              list[idx] = { ...list[idx], ...item };
            } else {
              list.push(item);
            }
          }
        }
      }
      const saved = localStorage.getItem('latest_patient_medicine_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          const idx = list.findIndex(o => 
            (o.orderNumber && o.orderNumber === parsed.orderNumber) || 
            (o.id && String(o.id) === String(parsed.id))
          );
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...parsed };
          } else {
            list.unshift(parsed);
          }
        }
      }
    } catch (e) {
      console.warn('Error reading local orders in Orders.jsx', e);
    }
    return list;
  }, [medicineOrders, storageTick]);

  // 2. Equipment / Store Orders Query
  const {
    data: storeOrders = [],
    isLoading: loadingStore
  } = useQuery({
    queryKey: ['patientStoreOrders', user?.id],
    queryFn: async () => {
      try {
        const res = await axios.get('/patient/orders');
        return Array.isArray(res.data) ? res.data : (res.data?.content || []);
      } catch (err) {
        return [];
      }
    },
    enabled: !!user?.id
  });

  const getMedicineStage = (status) => {
    const s = (status || '').toUpperCase();
    if (['DELIVERED', 'COMPLETED'].includes(s)) return 4;
    if (['DISPATCHED', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP', 'SHIPPED'].includes(s)) return 3;
    if (['PHARMACY_PROCESSING', 'PROCESSING', 'VERIFIED', 'PACKED', 'CONFIRMED'].includes(s)) return 2;
    return 1; // PAID, COD_PENDING, PENDING, PLACED
  };

  const getMedicineStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (['DELIVERED', 'COMPLETED'].includes(s)) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        text: 'DELIVERED',
        icon: CheckCircle2
      };
    }
    if (['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(s)) {
      return {
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        text: 'OUT FOR DELIVERY',
        icon: Truck
      };
    }
    if (s === 'READY_FOR_PICKUP') {
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        text: 'READY FOR PICKUP',
        icon: Package
      };
    }
    if (['PHARMACY_PROCESSING', 'PROCESSING', 'VERIFIED', 'PACKED'].includes(s)) {
      return {
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        text: 'PHARMACY PACKAGING',
        icon: Clock
      };
    }
    return {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      text: s.replace(/_/g, ' ') || 'ORDER PLACED',
      icon: Clock
    };
  };

  if (loadingMedicines && loadingStore) {
    return <PageLoadingSkeleton />;
  }

  const stepsList = [
    { num: 1, label: 'Order Placed' },
    { num: 2, label: 'Rx Verified & Packed' },
    { num: 3, label: 'Dispatched / Ready' },
    { num: 4, label: 'Delivered' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header Banner */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Orders & Fulfillment Tracking</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor your prescription medicine shipments and health products with realtime clinic pharmacy updates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/patient/order-medicine"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <Pill className="w-4 h-4" />
            <span>Order Medicines</span>
          </Link>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('MEDICINE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'MEDICINE'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Medicine Orders</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'MEDICINE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {displayedMedicineOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('STORE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'STORE'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Equipment & Store Orders</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'STORE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {storeOrders.length}
          </span>
        </button>
      </div>

      {/* ── MEDICINE ORDERS TAB ────────────────────────────────────────────── */}
      {activeTab === 'MEDICINE' && (
        <div>
          {displayedMedicineOrders.length === 0 ? (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-2xl shadow-xs border border-slate-200 p-12 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Pill className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No Medicine Orders Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  You haven't ordered medicines from the clinic pharmacy. Browse our pharmacy catalog or order directly from your active prescriptions.
                </p>
              </div>
              <Link
                to="/patient/order-medicine"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Browse Medicines & Order</span>
              </Link>
            </motion.div>
          ) : (
            <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="space-y-6">
              {displayedMedicineOrders.map((order, orderIdx) => {
                const currentStage = getMedicineStage(order.orderStatus || order.status);
                const badge = getMedicineStatusBadge(order.orderStatus || order.status);
                const BadgeIcon = badge.icon;
                const itemsList = order.items || [];
                const totalAmt = order.total || order.totalAmount || 0;
                const orderUniqueKey = order.orderNumber || order.orderId || order.id || `medicine-order-${orderIdx}`;

                return (
                  <motion.div
                    variants={listStagger}
                    key={orderUniqueKey}
                    className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden"
                  >
                    {/* Order Top Bar */}
                    <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {order.orderNumber || `ORD-${order.id}`}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                              <BadgeIcon className="w-3 h-3" />
                              {badge.text}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Placed on {order.createdAt ? format(new Date(order.createdAt), 'MMMM d, yyyy • hh:mm a') : 'Recently'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tax Invoice</span>
                        </button>

                        <div className="text-right">
                          <p className="text-[11px] text-slate-500">Total Amount</p>
                          <p className="text-base font-bold text-slate-900">
                            ₹{Number(totalAmt).toLocaleString()}
                          </p>
                        </div>
                        <div className="pl-3 border-l border-slate-200 text-right">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            order.paymentMethod === 'COD' || order.paymentStatus === 'COD_PENDING'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {order.paymentMethod === 'COD' ? 'Cash On Delivery' : 'Paid Online (Razorpay)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stepper Progress Bar */}
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-blue-500/5">
                      <div className="grid grid-cols-4 gap-2 relative">
                        {stepsList.map((s) => {
                          const isDone = s.num <= currentStage;
                          const isCurrent = s.num === currentStage;
                          return (
                            <div key={s.num} className="flex flex-col items-center text-center space-y-1.5 relative z-10">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  isCurrent
                                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs'
                                    : isDone
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-200 text-slate-400'
                                }`}
                              >
                                {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                              </div>
                              <span
                                className={`text-[11px] font-bold ${
                                  isCurrent ? 'text-emerald-700' : isDone ? 'text-slate-800' : 'text-slate-400'
                                }`}
                              >
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-4">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                          style={{ width: `${Math.max(10, ((currentStage - 1) / 3) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Order Details & Items */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-8 space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-slate-500" />
                          <span>Dispensed Medicines ({itemsList.length})</span>
                        </h4>

                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
                          {itemsList.map((item, idx) => (
                            <div key={item.id || item.medicineId || `med-item-${idx}`} className="p-3 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">
                                    {item.medicineName || item.medicineNameSnapshot || `Item #${idx + 1}`}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    {item.dosage || item.frequency || 'As prescribed by doctor'} • Qty: {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-slate-900">
                                  ₹{Number(item.totalPrice || (item.unitPrice * item.quantity) || 0).toLocaleString()}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  ₹{Number(item.unitPrice || 0)} / unit
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Prescription Attached Info */}
                        {order.prescriptionId && (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-800">
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>Prescription Attached: <strong>#{order.prescriptionId}</strong></span>
                            {order.prescriptionUrl && (
                              <a
                                href={order.prescriptionUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-auto text-[11px] font-bold text-blue-700 underline hover:text-blue-900"
                              >
                                View Rx Document
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Delivery & Contact info */}
                      <div className="md:col-span-4 bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold border-b border-slate-200 pb-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>Delivery Address</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {order.deliveryAddress || 'Clinic Pickup / Patient Default Address'}
                          {order.deliveryCity && <><br />{order.deliveryCity}, {order.deliveryPincode}</>}
                        </p>
                        {order.contactPhone && (
                          <p className="text-[11px] text-slate-500 pt-1">
                            Contact: <span className="font-medium text-slate-800">{order.contactPhone}</span>
                          </p>
                        )}
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Pharmacy Status:</span>
                          <span className="font-bold text-emerald-700 uppercase">
                            {(order.orderStatus || order.status || 'Active').replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Official Pharmacy Tax Invoice Banner */}
                    <div className="border-t border-slate-100 bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-slate-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              Pharmacy Tax Invoice: {order.invoiceNumber || `INV-2026-${String(order.id || 9821).padStart(5, '0')}`}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              GSTIN: 27AABCE1234F1Z8
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Billed by <strong>Elixir Healthcare Pharmacy & Dispensary</strong> • Drug Lic: DL-2026-PH998 • Regd. Pharmacist Verified
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View & Download Invoice</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      )}

      {/* ── STORE / EQUIPMENT ORDERS TAB ──────────────────────────────────── */}
      {activeTab === 'STORE' && (
        <div>
          {storeOrders.length === 0 ? (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-2xl shadow-xs border border-slate-200 p-12 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Store Orders Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven't placed any orders for medical equipment or wellness products yet.
              </p>
            </motion.div>
          ) : (
            <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="space-y-6">
              {storeOrders.map((order, sIdx) => (
                <motion.div
                  variants={listStagger}
                  key={order.id || `store-order-${sIdx}`}
                  className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden"
                >
                  <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">
                        Order Placed: <span className="font-medium text-slate-900">{format(new Date(order.createdAt), 'MMMM d, yyyy')}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Order #: <span className="font-medium text-slate-900">ORD-{order.id.toString().padStart(6, '0')}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-0.5">Total Amount</p>
                      <p className="text-base font-bold text-slate-900">${order.totalAmount?.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200">
                            {order.status || 'CONFIRMED'}
                          </span>
                          {order.trackingNumber && (
                            <span className="text-xs text-slate-500">
                              Tracking: <span className="font-mono text-slate-900">{order.trackingNumber}</span>
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 pt-2">
                          {order.items?.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-50">
                              <span className="font-medium text-slate-800">{item.product?.name || `Product #${item.productId}`} (x{item.quantity})</span>
                              <span className="font-bold text-slate-900">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="w-full md:w-64 bg-slate-50 rounded-xl p-4 text-xs">
                        <h4 className="font-bold text-slate-900 mb-1">Shipping Address</h4>
                        <p className="text-slate-600">{order.shippingAddress}</p>
                        <p className="text-slate-600">{order.shippingCity}, {order.postalCode}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}
      {/* Official Pharmacy Tax Invoice Modal */}
      {selectedInvoiceOrder && (
        <MedicineOrderInvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
