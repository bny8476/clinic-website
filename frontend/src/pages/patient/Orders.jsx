import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { axiosPrivate as axios } from '../../api/axios';
import { format } from 'date-fns';
import { CheckCircle, Truck, Clock, Package, AlertCircle, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerChildren, fadeUp, listStagger } from '../../components/ui/motion';

import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/patient/orders');
        setOrders(response.data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'SHIPPED': return <Truck className="w-5 h-5 text-blue-500" />;
      case 'PROCESSING': 
      case 'PENDING': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-50 text-green-700 border-green-200';
      case 'SHIPPED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PROCESSING': 
      case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return <PageLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    
      <div className="space-y-6">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">My Orders</h2>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-emerald-50 flex items-center">
            <div className="p-3 bg-white rounded-lg shadow-sm mr-4 text-emerald-600">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Order History</h3>
              <p className="text-sm text-gray-600">Track your medical equipment, prescription refills, and wellness products.</p>
            </div>
          </div>
        </motion.div>

      <div>
        {orders.length === 0 ? (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              You haven't placed any orders for wellness products or medical equipment yet.
            </p>
          </motion.div>
        ) : (
          <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="space-y-6">
            {orders.map((order) => (
              <motion.div variants={listStagger} key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Order Placed: <span className="font-medium text-gray-900">{format(new Date(order.createdAt), 'MMMM d, yyyy')}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Order #: <span className="font-medium text-gray-900">ORD-{order.id.toString().padStart(6, '0')}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                      <p className="font-semibold text-gray-900">${order.totalAmount?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        {getStatusIcon(order.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClass(order.status)}`}>
                          {order.status}
                        </span>
                        {order.trackingNumber && (
                          <span className="text-sm text-gray-500">
                            Tracking: <span className="font-mono text-gray-900">{order.trackingNumber}</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-3 mt-6">
                        <h4 className="text-sm font-medium text-gray-900 border-b pb-2">Items</h4>
                        {order.items?.length > 0 ? (
                          order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{item.product?.name || `Product #${item.productId}`}</p>
                                  <p className="text-gray-500">Qty: {item.quantity}</p>
                                </div>
                              </div>
                              <p className="font-medium text-gray-900">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No items available for display.</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-full md:w-64 bg-gray-50 rounded-lg p-4 text-sm">
                      <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
                      <p className="text-gray-700 whitespace-pre-line mb-2">
                        {order.shippingAddress}
                      </p>
                      <p className="text-gray-700">
                        {order.shippingCity}, {order.postalCode}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
    
  );
}
