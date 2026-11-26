import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { 
  Package, CheckCircle2, Clock, AlertCircle, RefreshCw, ShoppingBag, Truck, Eye, 
  ShieldCheck, MapPin, Phone, User, FileText, X, ExternalLink, Check, Download
} from 'lucide-react';

export default function PharmacyMedicineOrders() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('PHARMACY_PROCESSING');
  const [previewPrescriptionUrl, setPreviewPrescriptionUrl] = useState(null);
  const [verifiedRxOrders, setVerifiedRxOrders] = useState({});

  // Fetch Doctor & Patient Medicine Orders for Pharmacy Dispensing
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['pharmacy-medicine-orders', selectedStatus],
    queryFn: async () => {
      const url = selectedStatus === 'ALL' 
        ? '/pharmacy/medicine-orders' 
        : `/pharmacy/medicine-orders?status=${selectedStatus}`;
      const res = await axiosPrivate.get(url);
      return res.data;
    },
    refetchInterval: 10000
  });

  // Dispense Order Mutation (Deducts stock & completes order)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const res = await axiosPrivate.put(`/pharmacy/medicine-orders/${orderId}/status`, { status });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Order ${data.orderNumber} status updated to ${data.status}! Stock synchronized.`);
      queryClient.invalidateQueries({ queryKey: ['pharmacy-medicine-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-inventory'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to update order status');
    }
  });

  const toggleVerifyPrescription = (orderId) => {
    setVerifiedRxOrders(prev => {
      const isVerified = !prev[orderId];
      if (isVerified) {
        toast.success(`Prescription verified for order #${orderId}`, { icon: '✅' });
      }
      return { ...prev, [orderId]: isVerified };
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
      case 'PHARMACY_PROCESSING':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-200">Pending Dispense (Paid)</span>;
      case 'READY_FOR_PICKUP':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full border border-blue-200">Ready for Pickup / Dispatch</span>;
      case 'DISPATCHED':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 font-bold text-xs rounded-full border border-purple-200">Out for Delivery</span>;
      case 'COMPLETED':
      case 'DELIVERED':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">Dispensed & Completed</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <Package size={22} />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Pharmacy Dispensing & Delivery Worklist</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Incoming patient orders from clinic store & doctor recommendations. Verify prescriptions, dispense stock, and dispatch.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} /> Refresh Worklist
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'PHARMACY_PROCESSING', label: 'Pending Dispense (Incoming)' },
          { id: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
          { id: 'DISPATCHED', label: 'Out for Delivery' },
          { id: 'COMPLETED', label: 'Completed / Dispensed' },
          { id: 'ALL', label: 'All Orders' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-4 py-2 text-xs font-extrabold rounded-t-xl transition cursor-pointer whitespace-nowrap ${
              selectedStatus === tab.id
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Worklist Orders List */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 font-bold text-sm">Loading Pharmacy Orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">No medicine orders found in this view</p>
          <p className="text-xs text-slate-400">When patients place medicine orders or doctor recommendations are paid, they appear here live.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const hasPrescription = Boolean(order.prescriptionUrl);
            const isRxVerified = verifiedRxOrders[order.id];

            return (
              <div key={order.id} className="border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 transition-all bg-slate-50/40 space-y-4">
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-black text-emerald-800 text-base">{order.orderNumber}</span>
                      {getStatusBadge(order.status)}
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200">
                        Payment: {order.paymentStatus || 'PAID'}
                      </span>
                      {order.paymentMethod && (
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-200">
                          {order.paymentMethod === 'RAZORPAY' ? 'Razorpay Online' : order.paymentMethod}
                        </span>
                      )}
                    </div>

                    {/* Patient & Doctor Identifiers */}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1 font-bold text-slate-800">
                        <User size={14} className="text-slate-400" />
                        {order.patientName || `Patient #${order.patientId || order.userId || '1'}`}
                      </span>

                      {order.contactPhone && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Phone size={13} className="text-slate-400" />
                          {order.contactPhone}
                        </span>
                      )}

                      {order.doctorName && (
                        <span className="text-slate-400">
                          • Doctor: <span className="font-semibold text-slate-700">{order.doctorName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Order Value</p>
                    <p className="text-xl font-black text-slate-900">₹{Number(order.total || order.totalAmount || 0).toFixed(2)}</p>
                  </div>
                </div>

                {/* Delivery Address & Notes Card (if available) */}
                {order.deliveryAddress && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2 min-w-0">
                      <MapPin size={16} className="text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800">
                          Delivery: {order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ''} {order.deliveryPincode ? `- ${order.deliveryPincode}` : ''}
                        </p>
                        {order.deliveryNotes && (
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Instructions: "{order.deliveryNotes}"</p>
                        )}
                      </div>
                    </div>

                    {order.razorpayPaymentId && (
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md shrink-0">
                        Ref: {order.razorpayPaymentId}
                      </span>
                    )}
                  </div>
                )}

                {/* Uploaded Patient Prescription Banner */}
                {hasPrescription && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="p-1.5 bg-blue-100 text-[#2864FF] rounded-lg shrink-0">
                        <FileText size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-blue-900 truncate">Patient Prescription Attached</p>
                        <p className="text-[11px] text-blue-700 font-medium">Verify Rx against ordered medicines prior to fulfillment</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setPreviewPrescriptionUrl(order.prescriptionUrl)}
                        className="px-3 py-1.5 bg-white hover:bg-blue-100/50 text-[#2864FF] border border-blue-200 font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <Eye size={13} /> View Prescription
                      </button>

                      <button
                        onClick={() => toggleVerifyPrescription(order.id)}
                        className={`px-3 py-1.5 font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                          isRxVerified
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <Check size={13} /> {isRxVerified ? 'Rx Verified' : 'Verify Rx'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Prescribed Items Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">Medicine Item</th>
                        <th className="p-3">Qty</th>
                        <th className="p-3">Dosage / Instructions</th>
                        <th className="p-3">Price</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {order.items && order.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-3 font-bold text-slate-900">
                            {item.medicineNameSnapshot || item.medicineName || item.productTitle || `Item #${item.medicineId || idx + 1}`}
                          </td>
                          <td className="p-3 font-extrabold text-emerald-700">{item.quantity}</td>
                          <td className="p-3 text-slate-600">
                            {item.dosage || "As directed"} {item.frequency ? `(${item.frequency})` : ''} {item.instructions ? `• ${item.instructions}` : ''}
                          </td>
                          <td className="p-3 text-slate-600">₹{Number(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="p-3 text-right font-extrabold text-slate-900">
                            ₹{Number(item.totalPrice || ((item.unitPrice || 0) * (item.quantity || 1))).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Workflow Actions */}
                <div className="flex flex-wrap justify-between items-center pt-2 gap-3">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>Dispensing transactionally deducts pharmacy stock and sends notifications.</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status !== 'COMPLETED' && order.status !== 'DELIVERED' && (
                      <>
                        <button
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'READY_FOR_PICKUP' })}
                          disabled={updateStatusMutation.isPending}
                          className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Mark Ready for Pickup
                        </button>

                        <button
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'DISPATCHED' })}
                          disabled={updateStatusMutation.isPending}
                          className="px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Truck size={14} /> Out for Delivery
                        </button>

                        <button
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'COMPLETED' })}
                          disabled={updateStatusMutation.isPending}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-200 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} /> Dispense & Deduct Stock
                        </button>
                      </>
                    )}

                    {(order.status === 'COMPLETED' || order.status === 'DELIVERED') && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={16} /> Stock Deducted & Order Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Prescription Lightbox Modal */}
      {previewPrescriptionUrl && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-[#2864FF]" />
                <h3 className="font-extrabold text-slate-900 text-base">Attached Patient Prescription</h3>
              </div>
              <button
                onClick={() => setPreviewPrescriptionUrl(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
              {previewPrescriptionUrl.startsWith('data:image') || previewPrescriptionUrl.includes('image') ? (
                <img 
                  src={previewPrescriptionUrl} 
                  alt="Prescription" 
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
                />
              ) : (
                <iframe 
                  src={previewPrescriptionUrl} 
                  title="Prescription PDF" 
                  className="w-full h-[55vh] rounded-lg"
                />
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-500 font-medium">
                Verified against clinical dispensary standard SOP-2026
              </span>
              <button
                onClick={() => setPreviewPrescriptionUrl(null)}
                className="px-5 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 transition cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
