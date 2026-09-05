import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, ArrowRight, ShieldAlert } from 'lucide-react';

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setCartItems(items);
    } catch (e) {
      setCartItems([]);
    }
  }, []);

  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem('cartItems', JSON.stringify(items));
  };

  const updateQuantity = (medicineId, delta) => {
    const updated = cartItems.map(item => {
      if (item.medicineId === medicineId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    saveCart(updated);
  };

  const removeItem = (medicineId) => {
    const updated = cartItems.filter(item => item.medicineId !== medicineId);
    saveCart(updated);
    toast.success("Item removed from cart");
  };

  const clearCart = () => {
    saveCart([]);
    toast.success("Cart cleared");
  };

  const subtotal = cartItems.reduce((acc, item) => acc + ((item.price || 0) * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% estimated tax
  const total = subtotal + tax;

  const rxRequired = cartItems.some(i => i.prescriptionRequired);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="bg-white border-b border-gray-200 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/medicines')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition cursor-pointer flex items-center gap-2 text-sm font-bold">
            <ArrowLeft size={18} /> Continue Shopping
          </button>
          <span className="text-lg font-black text-gray-900">Shopping Cart ({cartItems.length})</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-xl border border-gray-100">
            <ShoppingBag className="w-20 h-20 text-blue-300 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-900">Your Cart is Empty</h2>
            <p className="text-gray-500 text-sm mt-1">Browse our pharmacy marketplace to add authentic medicines to your cart.</p>
            <button
              onClick={() => navigate('/medicines')}
              className="mt-6 px-8 py-3.5 bg-blue-600 text-white font-extrabold rounded-2xl text-sm hover:bg-blue-700 transition cursor-pointer shadow-lg shadow-blue-600/30"
            >
              Explore Medicines
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {rxRequired && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-900 text-xs font-bold">
                  <ShieldAlert className="text-amber-600 shrink-0" size={20} />
                  <span>One or more items in your cart require a valid prescription at checkout.</span>
                </div>
              )}

              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                {cartItems.map((item) => (
                  <div key={item.medicineId} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300'}
                        alt={item.medicineName}
                        className="w-16 h-16 rounded-2xl object-cover bg-gray-50 border border-gray-100 shrink-0"
                      />
                      <div>
                        <h4 className="font-extrabold text-gray-900 text-base">{item.medicineName}</h4>
                        <p className="text-xs font-bold text-blue-600 mt-0.5">₹{item.price} each</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1">
                        <button onClick={() => updateQuantity(item.medicineId, -1)} className="p-1.5 hover:bg-white rounded-lg transition text-gray-600 cursor-pointer">
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-bold text-xs">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.medicineId, 1)} className="p-1.5 hover:bg-white rounded-lg transition text-gray-600 cursor-pointer">
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-gray-900 text-base">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>

                      <button onClick={() => removeItem(item.medicineId)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center px-2">
                <button onClick={clearCart} className="text-xs font-bold text-red-500 hover:underline cursor-pointer">
                  Clear Entire Cart
                </button>
              </div>
            </div>

            {/* Summary Box */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 h-fit space-y-6">
              <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-4">Order Summary</h3>

              <div className="space-y-3 text-sm font-medium text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (5%)</span>
                  <span className="font-bold text-gray-900">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-black text-gray-900">
                  <span>Total Payable</span>
                  <span className="text-xl text-blue-600">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl transition cursor-pointer shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
