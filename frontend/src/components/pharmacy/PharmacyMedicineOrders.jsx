import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Package, CheckCircle2, Clock, AlertCircle, RefreshCw, ShoppingBag, Truck, Eye, ShieldCheck } from 'lucide-react';

export default function PharmacyMedicineOrders() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('PHARMACY_PROCESSING');

  // Fetch Paid Doctor Medicine Orders for Pharmacy Dispensing
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
      toast.success(`Order ${data.orderNumber} status updated to ${data.status}! Stock deducted.`);
      queryClient.invalidateQueries(['pharmacy-medicine-orders']);
      queryClient.invalidateQueries(['pharmacy-inventory']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to update order status');
    }
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
      case 'PHARMACY_PROCESSING':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-200">Paid - Pending Dispense</span>;
      case 'READY_FOR_PICKUP':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full border border-blue-200">Ready for Pickup</span>;
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
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Package size={20} />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Doctor Medicine Orders — Dispensing Worklist</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Fulfill doctor recommended medicine orders paid by patients. Stock is deducted transactionally upon dispensing.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw size={14} /> Refresh Worklist
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'PHARMACY_PROCESSING', label: 'Pending Dispense (Paid)' },
          { id: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
          { id: 'COMPLETED', label: 'Completed / Dispensed' },
          { id: 'ALL', label: 'All Sales Orders' }
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
        <div className="p-12 text-center text-slate-400 font-bold text-sm">Loading Pharmacy Dispensing Orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">No doctor medicine orders in this view</p>
          <p className="text-xs text-slate-400 mt-1">When patients pay for doctor-recommended medicines, orders will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 transition-all bg-slate-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-emerald-700 text-base">{order.orderNumber}</span>
                    {getStatusBadge(order.status)}
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200">
                      Payment: {order.paymentStatus || 'PAID'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Patient ID: <span className="font-bold text-slate-800">PAT-{order.userId}</span> | Doctor ID: <span className="font-bold text-slate-800">DOC-{order.doctorId}</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400">Total Paid</p>
                  <p className="text-xl font-black text-slate-900">₹{order.totalAmount}</p>
                </div>
              </div>

              {/* Prescribed Items Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-500 font-bold uppercase border-b border-slate-200">
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
                      <tr key={idx}>
                        <td className="p-3 font-bold">{item.medicineNameSnapshot || item.productTitle}</td>
                        <td className="p-3 font-bold text-emerald-700">{item.quantity}</td>
                        <td className="p-3 text-slate-600">{item.dosage} ({item.frequency}) for {item.duration}</td>
                        <td className="p-3">₹{item.unitPrice}</td>
                        <td className="p-3 text-right font-bold">₹{item.totalPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-between items-center pt-2 gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Clicking 'Dispense' transactionally deducts stock and logs inventory movement.</span>
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
          ))}
        </div>
      )}
    </div>
  );
}
