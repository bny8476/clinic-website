import { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usePatientMedicineFeed } from '../../hooks/usePatientMedicineFeed';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition, staggerChildren, listStagger, fadeUp } from '../../components/ui/motion';

// Mock data (kept for fallback)
const categories = [
  "All Medicines", "Pain Relief", "Antibiotics", "Vitamins & Supplements", 
  "Diabetes Care", "Heart Care", "Ayurveda", "More >"
];

export default function OrderMedicine() {
  const [activeCategory, setActiveCategory] = useState("All Medicines");
  const [cart, setCart] = useState([]);
  const queryClient = useQueryClient();

  // Fetch medicines
  const { data: medicines = [], isLoading } = useQuery({
    queryKey: ['patientMedicines'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/patient/medicines`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch medicines');
      return response.json();
    }
  });

  // Setup real-time updates
  usePatientMedicineFeed((event) => {
    toast('Medicine catalog updated!', { icon: '🔄' });
    queryClient.invalidateQueries(['patientMedicines']);
  });

  // Create Order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderRequest) => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/patient/medicines/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderRequest)
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Failed to place order');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.success("Order placed successfully!");
        setCart([]);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const addToCart = (med) => {
    setCart(prev => {
      const existing = prev.find(item => item.medicineId === med.id);
      if (existing) {
        if (existing.quantity >= med.stockQuantity) {
            toast.error("Not enough stock available");
            return prev;
        }
        return prev.map(item => 
          item.medicineId === med.id 
            ? { ...item, quantity: item.quantity + 1, price: (item.quantity + 1) * med.price }
            : item
        );
      }
      if (med.stockQuantity <= 0) {
          toast.error("Out of stock");
          return prev;
      }
      return [...prev, { 
        medicineId: med.id, 
        name: med.name, 
        unit: med.unit, 
        price: med.price, 
        originalPrice: med.price, 
        quantity: 1, 
        stockQuantity: med.stockQuantity,
        imageUrl: med.imageUrl 
      }];
    });
    toast.success(`${med.name} added to cart`);
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.medicineId === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        if (newQuantity > item.stockQuantity) {
            toast.error("Cannot exceed available stock");
            return item;
        }
        return { ...item, quantity: newQuantity, price: item.originalPrice * newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.medicineId !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const deliveryCharges = 20.00;
  const packagingCharges = 10.00;
  const totalAmount = subtotal + deliveryCharges + packagingCharges;

  return (
    <motion.div 
      className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-slate-50/50 min-h-screen"
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      
      {/* Page Header */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#3B28CC] shadow-sm">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight leading-none mb-1.5">Order Medicine</h1>
            <p className="text-slate-500 text-sm font-medium">Search and order medicines delivered to your doorstep</p>
          </div>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div variants={fadeUp} className="bg-white p-3 rounded-2xl border border-slate-200 mb-6 flex flex-wrap gap-3 items-center shadow-sm">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search medicines by name, salt or brand..." 
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3B28CC] focus:border-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <div className="relative min-w-[160px]">
          <select className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white focus:outline-none appearance-none cursor-pointer">
            <option>All Categories</option>
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
        <div className="relative min-w-[160px]">
          <select className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white focus:outline-none appearance-none cursor-pointer">
            <option>All Brands</option>
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
        <button className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
          <Filter size={16} /> Filter
        </button>
      </motion.div>

      {/* Categories */}
      <motion.div variants={fadeUp} className="flex gap-2.5 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {categories.map((cat, idx) => (
          <button 
            key={idx}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm ${
              activeCategory === cat 
                ? 'bg-[#3B28CC] text-white border-transparent' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column - Medicine List */}
        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Popular Medicines</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <select className="text-sm border border-slate-200 bg-white rounded-lg px-3 py-2 pr-8 font-semibold text-slate-700 focus:outline-none appearance-none cursor-pointer shadow-sm">
                  <option>Sort by: Relevance</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
              <div className="flex bg-slate-100/80 rounded-lg p-1 border border-slate-200/60 shadow-inner">
                <button className="p-1.5 bg-white rounded shadow-sm text-[#3B28CC]">
                  <LayoutGrid size={16} />
                </button>
                <button className="p-1.5 text-slate-400 hover:text-slate-600 transition">
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          <motion.div 
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden min-h-[300px] relative"
          >
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-[#3B28CC] rounded-full animate-spin"></div>
              </div>
            )}
            
            {!isLoading && medicines.length === 0 && (
              <div className="p-10 text-center text-slate-500 font-medium">
                No medicines available from your doctors right now.
              </div>
            )}
            
            {medicines.map(med => (
              <motion.div 
                key={med.id} 
                variants={listStagger}
                whileHover={{ backgroundColor: 'var(--color-surface)' }}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between transition gap-4"
              >
                <div className="flex items-center gap-5 sm:gap-6">
                  <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shrink-0 shadow-sm flex items-center justify-center p-2">
                    {med.imageUrl ? (
                        <img src={med.imageUrl} alt={med.name} className="max-w-full max-h-full object-contain mix-blend-multiply rounded-md" />
                    ) : (
                        <div className="text-slate-300"><ShoppingBag size={32}/></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-[17px] mb-1">{med.name}</h3>
                    <p className="text-sm font-medium text-slate-500 mb-1">{med.description || "No composition info"}</p>
                    <p className="text-xs font-semibold text-emerald-600 mb-2.5">Stock: {med.stockQuantity}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full mt-2 sm:mt-0">
                  <div className="text-left sm:text-right min-w-[100px]">
                    <p className="font-extrabold text-slate-900 text-[19px]">₹{med.price.toFixed(2)}</p>
                    <p className="text-[13px] font-medium text-slate-500">{med.unit || "1 unit"}</p>
                  </div>
                  <button 
                    onClick={() => addToCart(med)}
                    disabled={med.stockQuantity <= 0}
                    className={`flex items-center gap-2 px-5 py-2.5 border rounded-xl text-sm font-bold shadow-sm shrink-0 transition ${
                      med.stockQuantity <= 0 
                        ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                        : 'border-indigo-200 text-[#3B28CC] hover:bg-indigo-50 hover:border-indigo-300 bg-white'
                    }`}
                  >
                    <ShoppingBag size={16} /> {med.stockQuantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-8 text-sm font-medium text-slate-500">
            <p>Showing 1 to 8 of 48 medicines</p>
            <div className="flex items-center gap-1.5">
              <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition shadow-sm"><ChevronLeft size={18} /></button>
              <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#3B28CC] text-white font-bold shadow-md">1</button>
              <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-transparent text-slate-600 hover:bg-slate-50 font-bold transition">2</button>
              <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-transparent text-slate-600 hover:bg-slate-50 font-bold transition">3</button>
              <span className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold tracking-widest">...</span>
              <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-transparent text-slate-600 hover:bg-slate-50 font-bold transition">6</button>
              <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition shadow-sm"><ChevronRight size={18} /></button>
            </div>
          </div>

          {/* Features Footer */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 mb-8 pb-4">
            <div className="flex items-center gap-3.5 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-50/80 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/50">
                <Truck size={20} />
              </div>
              <div>
                <p className="text-[13px] font-extrabold text-slate-900 mb-0.5">Fast Delivery</p>
                <p className="text-[11px] font-medium text-slate-500 leading-tight">Quick delivery to your doorstep</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-indigo-50/80 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[13px] font-extrabold text-slate-900 mb-0.5">Secure Payment</p>
                <p className="text-[11px] font-medium text-slate-500 leading-tight">100% secure & encrypted</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-50/80 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/50">
                <RefreshCcw size={20} />
              </div>
              <div>
                <p className="text-[13px] font-extrabold text-slate-900 mb-0.5">Easy Returns</p>
                <p className="text-[11px] font-medium text-slate-500 leading-tight">Simple return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-indigo-50/80 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50">
                <HeadphonesIcon size={20} />
              </div>
              <div>
                <p className="text-[13px] font-extrabold text-slate-900 mb-0.5">24/7 Support</p>
                <p className="text-[11px] font-medium text-slate-500 leading-tight">We are always here to help</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Cart */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-[100px]">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                Your Cart <span className="text-slate-500 font-semibold text-[15px]">({cart.length} Items)</span>
              </h2>
              <button 
                onClick={() => setCart([])}
                className="text-xs font-bold text-red-500 hover:text-red-600 transition"
              >
                Clear Cart
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="p-5 flex gap-4 hover:bg-slate-50/30 transition">
                  <div className="w-[60px] h-[60px] bg-slate-50 rounded-xl border border-slate-100 shrink-0 flex items-center justify-center p-1.5 shadow-sm">
                    <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain mix-blend-multiply rounded" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-[14px] leading-tight mb-1">{item.name}</h4>
                        <p className="text-xs font-medium text-slate-400 mb-3">{item.unit || "1 unit"}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.medicineId)} className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                        <button 
                          onClick={() => updateQuantity(item.medicineId, -1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-[13px] font-bold text-slate-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.medicineId, 1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="font-extrabold text-slate-900 text-[15px]">₹{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="p-10 text-center text-slate-400 text-sm font-medium">
                  Your cart is empty.
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="bg-white">
                <div className="p-4 mx-4 mt-2 mb-2 rounded-xl border border-indigo-100 bg-indigo-50/50">
                  <button className="w-full flex items-center justify-between text-[#3B28CC] text-[13px] font-bold hover:text-indigo-800 transition">
                    <span className="flex items-center gap-2"><ShoppingBag size={15}/> Apply Coupon</span>
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="p-5 pt-3 space-y-3.5 border-t border-slate-100 text-[13px] font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="text-slate-900 font-bold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span className="flex items-center gap-1.5">Delivery Charges <Info size={13} className="text-slate-400"/></span>
                    <span className="text-slate-900 font-bold">₹{deliveryCharges.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Packaging Charges</span>
                    <span className="text-slate-900 font-bold">₹{packagingCharges.toFixed(2)}</span>
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-extrabold text-slate-900 text-[15px]">Total Amount</span>
                    <span className="font-extrabold text-slate-900 text-xl">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-5 pt-2">
                  <button 
                    onClick={() => {
                      createOrderMutation.mutate({
                        items: cart.map(item => ({
                          medicineId: item.medicineId,
                          quantity: item.quantity
                        }))
                      });
                    }}
                    disabled={createOrderMutation.isPending}
                    className="w-full bg-[#3B28CC] hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(59,40,204,0.39)] transition flex items-center justify-center gap-2 text-[15px]"
                  >
                    {createOrderMutation.isPending ? 'Processing...' : 'Proceed to Checkout'} <span className="font-light">→</span>
                  </button>
                  <p className="text-center text-emerald-600 text-[12px] font-bold mt-3.5">
                    You will save ₹10.00 on this order
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Genuine Badge */}
          <div className="mt-5 bg-[#f0fdf4] rounded-2xl p-5 flex gap-4 border border-emerald-100 shadow-sm items-start">
            <CheckCircle2 className="text-emerald-600 shrink-0 w-6 h-6 mt-0.5" />
            <div>
              <p className="font-extrabold text-emerald-950 text-[14px] mb-1">100% Genuine Medicines</p>
              <p className="text-emerald-700/90 text-[12px] font-medium leading-relaxed pr-2">
                All medicines are verified and sourced from licensed pharmacies.
              </p>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
