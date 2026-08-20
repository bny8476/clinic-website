import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';



export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const cart = location.state?.cart;

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  
  // Hardcoded address for demonstration, a real app would fetch from Address API
  const [addressId] = useState(1);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Create Order
      const orderRes = await axiosPrivate.post('/ecommerce/checkout', {
        addressId,
        paymentMethod,
        notes
      });
      
      const order = orderRes.data;

      // Step 2: Simulate Payment
      await axiosPrivate.post('/ecommerce/payments/mock', {
        orderId: order.id,
        amount: order.totalAmount,
        status: 'SUCCESS'
      });

      return order;
    },
    onSuccess: () => {
      toast.success('Order placed successfully!');
      navigate('/patient/ecommerce/catalog', { replace: true });
    },
    onError: () => {
      toast.error('Checkout failed. Please try again.');
    }
  });

  if (!cart) {
    navigate('/patient/ecommerce/cart');
    return null;
  }

  return (
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">
      <div className="flex items-center gap-2 text-[var(--color-navy-900)] mb-8">
        <ShieldCheck className="w-8 h-8 text-[var(--color-primary)]" />
        <h1 className="text-3xl font-extrabold tracking-tight">Secure Checkout</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Details */}
        <div className="flex-1 space-y-6">
          
          {/* Delivery Address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Delivery Address</h2>
            </div>
            <div className="p-6">
              <div className="border border-[var(--color-primary)] bg-blue-50 rounded-xl p-4 flex justify-between items-start">
                <div>
                  <p className="font-bold text-[var(--color-navy-900)] mb-1">John Doe (Default)</p>
                  <p className="text-sm text-gray-600 mb-1">123 Health Ave, Apt 4B</p>
                  <p className="text-sm text-gray-600">New Delhi, DL 110001</p>
                  <p className="text-sm text-gray-600 mt-2 font-medium">Ph: +91 9876543210</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
            </div>
          </div>

          {/* Delivery Options */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Delivery Options</h2>
            </div>
            <div className="p-6">
              <div className="border border-gray-200 rounded-xl p-4 flex gap-4">
                <input type="radio" className="mt-1" defaultChecked name="delivery" />
                <div>
                  <p className="font-bold text-[var(--color-navy-900)]">Standard Delivery (₹50)</p>
                  <p className="text-sm text-gray-500">Estimated delivery in 1-2 days</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Notes (Optional)</label>
                <textarea 
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  rows="2"
                  placeholder="e.g. Please call before arriving"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Payment Method</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={`border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors ${paymentMethod === 'UPI' ? 'border-[var(--color-primary)] bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} />
                <span className="font-bold text-[var(--color-navy-900)]">UPI / QR</span>
              </label>
              <label className={`border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors ${paymentMethod === 'CARD' ? 'border-[var(--color-primary)] bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} />
                <span className="font-bold text-[var(--color-navy-900)]">Credit / Debit Card</span>
              </label>
            </div>
          </div>
          
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:w-[380px]">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-[var(--color-navy-900)] mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {cart.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate mr-2 flex-1">{item.quantity}x {item.productName}</span>
                  <span className="font-medium text-[var(--color-navy-900)]">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-100 pt-4 space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">₹{cart.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-green-600">₹50.00</span>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4 mb-8 flex justify-between items-end">
              <span className="text-base font-bold text-[var(--color-navy-900)]">Total to Pay</span>
              <span className="text-2xl font-black text-[var(--color-primary)]">₹{(cart.totalAmount + 50).toFixed(2)}</span>
            </div>
            
            <button 
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
              className="w-full bg-[var(--color-primary)] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-md disabled:opacity-50"
            >
              {checkoutMutation.isPending ? 'Processing...' : 'Place Order & Pay'}
            </button>
            
            <p className="mt-4 text-center text-xs text-gray-500">
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
    
  );
}
