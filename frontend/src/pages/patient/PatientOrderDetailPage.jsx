import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { ArrowLeft, CheckCircle2, Clock, Package, Truck, ShieldCheck } from 'lucide-react';

export default function PatientOrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['patientOrderDetail', orderId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/orders/${orderId}`);
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">Loading Order Details...</div>;
  }

  if (!order) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-red-500">Order Not Found</div>;
  }

  const stages = [
    { key: 'PENDING', label: 'Order Placed' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'PACKED', label: 'Packed' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'DELIVERED', label: 'Delivered' }
  ];

  const currentStageIndex = stages.findIndex(s => s.key === (order.status || 'PENDING'));
  const activeIndex = currentStageIndex > -1 ? currentStageIndex : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="bg-white border-b border-gray-200 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/my-orders')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">Order #{order.orderNumber || order.id}</h1>
            <p className="text-xs text-gray-500">Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Order Timeline Progress */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100">
          <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-8">Order Status Tracking</h3>
          
          <div className="relative flex items-center justify-between">
            {/* Connecting Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 z-0 transition-all duration-500" 
              style={{ width: `${(activeIndex / (stages.length - 1)) * 100}%` }}
            />

            {stages.map((stage, idx) => {
              const isCompleted = idx <= activeIndex;
              const isCurrent = idx === activeIndex;

              return (
                <div key={stage.key} className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-all ${
                    isCompleted ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-white text-gray-400 border border-gray-300'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={18} /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-bold mt-2 text-center max-w-[80px] ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 space-y-4">
            <h4 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3">Purchased Items</h4>
            <div className="divide-y divide-gray-100">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-extrabold text-gray-900">{item.medicineNameSnapshot || item.product?.title || 'Medicine'}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.unitPrice}</p>
                    </div>
                    <p className="font-bold text-gray-900">₹{item.totalPrice}</p>
                  </div>
                ))
              ) : (
                <div className="py-4 text-sm font-medium text-gray-700">1x Medicine Item (₹{order.totalAmount})</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 h-fit space-y-4">
            <h4 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3">Delivery Address</h4>
            <p className="text-xs font-bold text-gray-800">{order.shippingAddress || 'Default Patient Address'}</p>
            <p className="text-xs text-gray-500">{order.shippingCity} - {order.postalCode}</p>

            <div className="border-t border-gray-100 pt-4 space-y-2 text-xs font-medium text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">₹{order.subtotal || order.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax & Discount</span>
                <span className="font-bold text-gray-900">₹{order.taxAmount || 0}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between text-base font-black text-gray-900">
                <span>Total Amount</span>
                <span className="text-xl text-blue-600">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
