import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import { ShoppingBag, ArrowLeft, Clock, CheckCircle2, ChevronRight, Eye } from 'lucide-react';

export default function PatientOrdersPage() {
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['patientOrders'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/orders/my');
      return res.data;
    }
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Pending</span>;
      case 'CONFIRMED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Confirmed</span>;
      case 'PROCESSING':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Processing</span>;
      case 'DELIVERED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Delivered</span>;
      case 'CANCELLED':
      case 'REJECTED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="bg-white border-b border-gray-200 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/medicines')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition cursor-pointer flex items-center gap-2 text-sm font-bold">
            <ArrowLeft size={18} /> Pharmacy Marketplace
          </button>
          <h1 className="text-xl font-black text-gray-900">My Medicine Orders</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {isLoading ? (
          <div className="p-16 text-center text-gray-500 font-bold">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-xl border border-gray-100">
            <ShoppingBag className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <h3 className="text-xl font-black text-gray-900">You haven't placed any medicine orders yet</h3>
            <p className="text-gray-500 text-sm mt-1">Browse our pharmacy marketplace to order authentic medicines online.</p>
            <button
              onClick={() => navigate('/medicines')}
              className="mt-6 px-8 py-3.5 bg-blue-600 text-white font-extrabold rounded-2xl text-sm hover:bg-blue-700 transition cursor-pointer shadow-lg shadow-blue-600/30"
            >
              Order Medicines Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/my-orders/${order.id}`)}
                className="bg-white rounded-3xl p-6 shadow-md hover:shadow-xl border border-gray-100 transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-blue-600 text-base">{order.orderNumber || `MED-${order.id}`}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'}
                  </p>
                  <p className="text-sm font-bold text-gray-800 mt-2">
                    {order.items && order.items.length > 0
                      ? order.items.map(i => i.medicineNameSnapshot || i.product?.title || 'Medicine').join(', ')
                      : 'Medicine Purchase Order'}
                  </p>
                </div>

                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400">Total Amount</p>
                    <p className="text-xl font-black text-gray-900">₹{order.totalAmount}</p>
                  </div>
                  <div className="p-3 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-600 rounded-2xl transition">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
