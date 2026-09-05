import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { axiosPrivate } from '../../api/axios';
import { ArrowLeft, CheckCircle2, ShieldAlert, Truck, Lock } from 'lucide-react';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    shippingAddress: '',
    shippingCity: 'Main City',
    postalCode: '100001',
    prescriptionNotes: ''
  });

  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem('cartItems') || '[]');
      if (items.length === 0) {
        navigate('/cart');
      }
      setCartItems(items);
    } catch (e) {
      navigate('/cart');
    }
  }, [navigate]);

  const subtotal = cartItems.reduce((acc, item) => acc + ((item.price || 0) * item.quantity), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!formData.shippingAddress) {
      toast.error("Please enter delivery address");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientName: formData.patientName,
        phone: formData.phone,
        shippingAddress: formData.shippingAddress,
        shippingCity: formData.shippingCity,
        postalCode: formData.postalCode,
        prescriptionNotes: formData.prescriptionNotes,
        items: cartItems.map(i => ({
          medicineId: i.medicineId,
          quantity: i.quantity
        }))
      };

      const res = await axiosPrivate.post('/orders', payload);
      toast.success(`Order ${res.data.orderNumber} placed successfully!`);
      
      // Clear cart
      localStorage.removeItem('cartItems');

      // Navigate to order details
      navigate(`/my-orders/${res.data.orderId || res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="bg-white border-b border-gray-200 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/cart')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition cursor-pointer flex items-center gap-2 text-sm font-bold">
            <ArrowLeft size={18} /> Back to Cart
          </button>
          <span className="text-lg font-black text-gray-900">Secure Order Checkout</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Details & Address */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 space-y-4">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Truck className="text-blue-600" size={20} /> Delivery Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Patient Name *</label>
                  <input required type="text" placeholder="Rahul Kumar" className="w-full border border-gray-200 rounded-xl p-3 text-sm" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone *</label>
                  <input required type="tel" placeholder="+91 9876543210" className="w-full border border-gray-200 rounded-xl p-3 text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Shipping Address *</label>
                <textarea required rows={3} placeholder="Street, Flat/House No., Landmark, City, Pincode" className="w-full border border-gray-200 rounded-xl p-3 text-sm" value={formData.shippingAddress} onChange={e => setFormData({...formData, shippingAddress: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                  <input type="text" className="w-full border border-gray-200 rounded-xl p-3 text-sm" value={formData.shippingCity} onChange={e => setFormData({...formData, shippingCity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Postal Code</label>
                  <input type="text" className="w-full border border-gray-200 rounded-xl p-3 text-sm" value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Doctor Prescription Notes / File Reference</label>
                <input type="text" placeholder="e.g. Prescribed by Dr. Smith for 5 days" className="w-full border border-gray-200 rounded-xl p-3 text-sm" value={formData.prescriptionNotes} onChange={e => setFormData({...formData, prescriptionNotes: e.target.value})} />
              </div>
            </div>

            {/* Selected Items Breakdown */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 space-y-3">
              <h4 className="text-sm font-extrabold text-gray-900 border-b border-gray-100 pb-3">Selected Medicines ({cartItems.length})</h4>
              {cartItems.map((item) => (
                <div key={item.medicineId} className="flex justify-between items-center text-sm py-2">
                  <div>
                    <span className="font-bold text-gray-900">{item.medicineName}</span>
                    <span className="text-xs text-gray-500 block">Qty: {item.quantity} × ₹{item.price}</span>
                  </div>
                  <span className="font-black text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Submit Box */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 h-fit space-y-6">
            <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3">Payment Summary</h3>

            <div className="space-y-3 text-sm font-medium text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Fees</span>
                <span className="font-bold text-gray-900">₹{tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-black text-gray-900">
                <span>Grand Total</span>
                <span className="text-2xl text-blue-600">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 text-emerald-800 text-xs font-bold">
              <Lock className="text-emerald-600 shrink-0" size={18} />
              <span>Verified 256-Bit Encrypted Healthcare Checkout</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-black text-sm rounded-2xl transition cursor-pointer shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Placing Order...' : 'PLACE ORDER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
