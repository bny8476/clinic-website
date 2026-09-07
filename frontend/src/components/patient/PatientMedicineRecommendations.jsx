import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { ShoppingBag, CreditCard, CheckCircle2, Clock, Pill, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export default function PatientMedicineRecommendations() {
  const queryClient = useQueryClient();
  const [processingOrderId, setProcessingOrderId] = useState(null);

  // Fetch Doctor Recommended Medicine Orders for current patient
  const { data: recommendations = [], isLoading, refetch } = useQuery({
    queryKey: ['patient-recommendations'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/patient/medicine-recommendations');
      return res.data;
    }
  });

  // Add recommendation to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (orderId) => {
      const res = await axiosPrivate.post(`/patient/medicine-orders/${orderId}/cart`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Order ${data.orderNumber} added to Cart!`);
      queryClient.invalidateQueries(['patient-recommendations']);
      queryClient.invalidateQueries(['patient-cart']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to add order to cart');
    }
  });

  // Checkout order mutation
  const checkoutMutation = useMutation({
    mutationFn: async (orderId) => {
      const res = await axiosPrivate.post(`/medicine-orders/${orderId}/checkout`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Order ${data.orderNumber} checked out! Proceed to payment.`);
      queryClient.invalidateQueries(['patient-recommendations']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Checkout failed');
    }
  });

  // Process payment mutation
  const payMutation = useMutation({
    mutationFn: async (orderId) => {
      setProcessingOrderId(orderId);
      const res = await axiosPrivate.post(`/medicine-orders/${orderId}/payment`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Payment successful for Order ${data.orderNumber}! Pharmacy is now processing your order.`);
      queryClient.invalidateQueries(['patient-recommendations']);
      queryClient.invalidateQueries(['patientOrders']);
      setProcessingOrderId(null);
    },
    onError: (err) => {
      setProcessingOrderId(null);
      toast.error(err.response?.data?.message || err.message || 'Payment processing failed');
    }
  });

  const handleBuyNow = async (order) => {
    try {
      if (order.status === 'CREATED' || order.status === 'PATIENT_REVIEWED') {
        await addToCartMutation.mutateAsync(order.id);
        await checkoutMutation.mutateAsync(order.id);
      } else if (order.status === 'CART_ADDED') {
        await checkoutMutation.mutateAsync(order.id);
      }
      await payMutation.mutateAsync(order.id);
    } catch (e) {
      // Handled in onError
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CREATED':
      case 'PATIENT_REVIEWED':
        return <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">Doctor Recommended</span>;
      case 'CART_ADDED':
        return <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">In Cart</span>;
      case 'PENDING_PAYMENT':
        return <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200">Payment Pending</span>;
      case 'PAID':
      case 'PHARMACY_PROCESSING':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1"><CheckCircle2 size={12} /> Pharmacy Processing</span>;
      case 'READY_FOR_PICKUP':
        return <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-full border border-teal-200">Ready for Pickup</span>;
      case 'DISPATCHED':
        return <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-200">Out for Delivery</span>;
      case 'DELIVERED':
      case 'COMPLETED':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">Completed</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">{status}</span>;
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-bold text-sm">Loading Doctor Recommended Medicines...</div>;
  }

  if (recommendations.length === 0) {
    return null; // Hide banner if no recommendations exist
  }

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl mb-8 relative overflow-hidden">
      {/* Decorative background pulse */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-indigo-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
              <Sparkles size={20} />
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">Doctor Recommended Medicine Sales</h2>
          </div>
          <p className="text-xs text-indigo-200 mt-1 font-medium">
            Your consulting doctor has recommended medicines directly for your ongoing treatment plan.
          </p>
        </div>

        <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 text-xs font-bold rounded-xl border border-indigo-400/30">
          {recommendations.length} Orders
        </span>
      </div>

      <div className="space-y-4">
        {recommendations.map((order) => {
          const isPaid = order.status === 'PAID' || order.status === 'PHARMACY_PROCESSING' || order.status === 'COMPLETED' || order.status === 'READY_FOR_PICKUP';
          const isPending = processingOrderId === order.id;

          return (
            <div
              key={order.id}
              className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 hover:border-white/30 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-indigo-300 text-sm">{order.orderNumber}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Recommended by <span className="font-bold text-white">Dr. {order.doctorName || 'Doctor'}</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-medium text-indigo-200">Total Amount</p>
                  <p className="text-xl font-black text-white">₹{order.totalAmount}</p>
                </div>
              </div>

              {/* Items breakdown */}
              <div className="bg-slate-900/60 rounded-xl p-3.5 border border-white/10 space-y-2">
                <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Prescribed Items</p>
                <div className="divide-y divide-white/5 text-xs">
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center text-slate-200">
                      <div>
                        <span className="font-bold text-white">{item.medicineNameSnapshot || item.productTitle}</span>
                        <span className="text-slate-400 text-[11px] ml-2">
                          Qty: {item.quantity} · {item.dosage} ({item.frequency})
                        </span>
                      </div>
                      <span className="font-semibold text-indigo-200">₹{item.totalPrice}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-2 text-xs text-indigo-200">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>Real DB catalog stock verified & revalidated</span>
                </div>

                {!isPaid ? (
                  <button
                    onClick={() => handleBuyNow(order)}
                    disabled={isPending || payMutation.isPending}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isPending ? (
                      'Processing Payment...'
                    ) : (
                      <>
                        <CreditCard size={16} /> Add to Cart & Pay ₹{order.totalAmount}
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 size={16} /> Paid — Dispatched to Pharmacy
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
