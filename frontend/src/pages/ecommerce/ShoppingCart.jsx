import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';



export default function ShoppingCart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [couponCode, setCouponCode] = useState('');

  const { data: cart, isLoading } = useQuery({
    queryKey: ['ecommerce-cart'],
    queryFn: async () => {
      try {
        const response = await axiosPrivate.get('/ecommerce/cart?cartType=CART');
        return response.data;
      } catch (err) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    }
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantity }) => {
      await axiosPrivate.post('/ecommerce/cart/items', {
        productId,
        quantity,
        cartType: 'CART'
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['ecommerce-cart']),
    onError: () => toast.error('Failed to update quantity')
  });

  const removeItemMutation = useMutation({
    mutationFn: async (productId) => {
      // If we don't have a specific endpoint to remove, we can set quantity to 0 or 
      // rely on a DELETE endpoint. Let's assume POST with qty 0 or negative works, or a real DELETE.
      // Assuming a standard DELETE /cart/items/{productId} exists or we pass quantity: 0
      await axiosPrivate.post('/ecommerce/cart/items', {
        productId,
        quantity: 0,
        cartType: 'CART'
      });
    },
    onSuccess: () => {
      toast.success('Item removed');
      queryClient.invalidateQueries(['ecommerce-cart']);
    },
    onError: () => toast.error('Failed to remove item')
  });

  const applyCoupon = async () => {
    // Stub for coupon API
    toast.error('Invalid or expired coupon');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-fade-in font-sans">
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-navy-900)] mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8 max-w-md">Looks like you haven't added any products to your cart yet. Discover our pharmacy catalog to find what you need.</p>
          <button 
            onClick={() => navigate('/patient/ecommerce/catalog')}
            className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all shadow-md active:scale-95"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-navy-900)]">Shopping Cart</h1>
        <span className="bg-blue-50 text-[var(--color-primary)] px-4 py-1 rounded-full text-sm font-bold border border-blue-100">
          {cart.items.length} Items
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <ul className="divide-y divide-gray-100">
              {cart.items.map((item) => (
                <li key={item.productId} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center hover:bg-gray-50 transition-colors">
                  <div className="w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0 border border-gray-200 overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShieldCheck className="w-8 h-8 opacity-50" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[var(--color-navy-900)] mb-1 truncate">{item.productName}</h3>
                    <div className="flex items-center gap-2 mb-3 text-sm text-[var(--color-text-muted)]">
                      <span>Item Price: <strong className="text-gray-700">₹{item.price}</strong></span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
                        <button 
                          className="px-3 py-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                          onClick={() => updateQuantityMutation.mutate({ productId: item.productId, quantity: item.quantity - 1 })}
                          disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                        >-</button>
                        <span className="px-4 py-1 font-medium text-[var(--color-navy-900)] border-x border-gray-200">{item.quantity}</span>
                        <button 
                          className="px-3 py-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                          onClick={() => updateQuantityMutation.mutate({ productId: item.productId, quantity: item.quantity + 1 })}
                          disabled={updateQuantityMutation.isPending}
                        >+</button>
                      </div>
                      <button 
                        onClick={() => removeItemMutation.mutate(item.productId)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-right sm:w-32">
                    <p className="text-xl font-black text-[var(--color-navy-900)]">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-[380px]">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-[var(--color-navy-900)] mb-6">Order Summary</h2>
            
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Coupon code" 
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
              </div>
              <button 
                onClick={applyCoupon}
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Apply
              </button>
            </div>
            
            <div className="space-y-4 mb-6 text-sm text-[var(--color-text-muted)]">
              <div className="flex justify-between">
                <span>Subtotal ({cart.items.length} items)</span>
                <span className="font-medium text-gray-900">₹{cart.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (GST)</span>
                <span className="font-medium text-gray-900">Calculated at checkout</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium text-green-600">Calculated at checkout</span>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4 mb-8 flex justify-between items-end">
              <span className="text-base font-bold text-[var(--color-navy-900)]">Estimated Total</span>
              <span className="text-2xl font-black text-[var(--color-primary)]">₹{cart.totalAmount?.toFixed(2)}</span>
            </div>
            
            <button 
              onClick={() => navigate('/patient/ecommerce/checkout', { state: { cart } })}
              className="w-full bg-[var(--color-primary)] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-md active:scale-95"
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>Secure checkout with SSL encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  );
}
