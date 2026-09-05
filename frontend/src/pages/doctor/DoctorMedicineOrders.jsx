import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import Modal from '../../components/ui/Modal';
import { ShoppingBag, Clock, CheckCircle, Package, Truck, AlertCircle, Eye, RefreshCw } from 'lucide-react';

export default function DoctorMedicineOrders() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['doctorOrders', activeTab],
    queryFn: async () => {
      const url = activeTab === 'ALL' ? '/doctor/orders' : `/doctor/orders?status=${activeTab}`;
      const res = await axiosPrivate.get(url);
      return res.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const res = await axiosPrivate.patch(`/doctor/orders/${orderId}/status`, { status });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Order status updated to ${data.status || 'new status'}`);
      queryClient.invalidateQueries(['doctorOrders']);
      if (selectedOrder) {
        setSelectedOrder(prev => ({ ...prev, status: data.status }));
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message)
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
      case 'REJECTED':
      case 'CANCELLED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">Rejected</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const tabs = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'CONFIRMED', label: 'Confirmed' },
    { id: 'PROCESSING', label: 'Processing' },
    { id: 'DELIVERED', label: 'Completed' },
    { id: 'CANCELLED', label: 'Cancelled' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Medicine Orders Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage patient medicine purchases, fulfillments, and status updates.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 font-medium">Loading medicine orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">No orders found in this category</p>
            <p className="text-xs text-gray-400 mt-1">When patients place medicine orders, they will appear here in real-time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Medicines</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 font-bold text-blue-600">{order.orderNumber || `MED-${order.id}`}</td>
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{order.patientName || `Patient #${order.userId}`}</div>
                      <div className="text-xs text-gray-500">ID: PAT-{order.userId}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800">
                        {order.items && order.items.length > 0
                          ? order.items.map(i => i.medicineNameSnapshot || i.product?.title || 'Medicine').join(', ')
                          : '1 Medicine Item'}
                      </div>
                      <div className="text-xs text-gray-400">Qty: {order.items ? order.items.reduce((acc, i) => acc + (i.quantity || 1), 0) : 1}</div>
                    </td>
                    <td className="p-4 font-bold text-gray-900">₹{order.totalAmount}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {order.paymentStatus || 'PAID'}
                      </span>
                    </td>
                    <td className="p-4">{getStatusBadge(order.status)}</td>
                    <td className="p-4 text-xs text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailsModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl transition flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <Eye size={14} /> View Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details & Action Modal */}
      {selectedOrder && (
        <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`Order Details: ${selectedOrder.orderNumber || selectedOrder.id}`}>
          <div className="space-y-6 pt-2">
            {/* Patient & Delivery Card */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-400 uppercase font-bold text-[10px]">Patient Information</p>
                <p className="font-bold text-gray-900 text-sm mt-1">{selectedOrder.patientName || `Patient #${selectedOrder.userId}`}</p>
                <p className="text-gray-500">Patient ID: PAT-{selectedOrder.userId}</p>
              </div>
              <div>
                <p className="text-gray-400 uppercase font-bold text-[10px]">Delivery Information</p>
                <p className="font-medium text-gray-800 mt-1">{selectedOrder.shippingAddress || 'Clinic Pickup / Home Delivery'}</p>
                <p className="text-gray-500">{selectedOrder.shippingCity} - {selectedOrder.postalCode}</p>
              </div>
            </div>

            {/* Medicine Items List */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Order Items</h4>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-bold text-gray-900">{item.medicineNameSnapshot || item.product?.title || 'Medicine'}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.unitPrice}</p>
                      </div>
                      <p className="font-bold text-gray-900">₹{item.totalPrice}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-sm text-gray-600 font-medium">1x Medicine Item (₹{selectedOrder.totalAmount})</div>
                )}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex justify-between items-center text-sm font-bold">
              <span>Grand Total</span>
              <span className="text-lg text-blue-600">₹{selectedOrder.totalAmount}</span>
            </div>

            {/* Status Workflow Action Buttons */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-3">Update Order Status</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: 'CONFIRMED' })}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  Confirm Order
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: 'PROCESSING' })}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  Process / Pack
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: 'DELIVERED' })}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  Mark Delivered
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: 'REJECTED' })}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Reject Order
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
