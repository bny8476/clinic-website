import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Search, ShoppingBag, ShieldAlert, ChevronRight, ArrowUpDown, Plus, ShoppingCart, ChevronLeft } from 'lucide-react';
import { axiosPublic } from '../../api/axios';

export default function MedicineMarketplace() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [rxRequiredFilter, setRxRequiredFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const pageSize = 12;

  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cartItems') || '[]');
    } catch (e) {
      return [];
    }
  });

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const { data, isLoading } = useQuery({
    queryKey: ['publicMedicines', debouncedSearch, selectedCategory, rxRequiredFilter, sortBy, page],
    queryFn: async () => {
      let params = new URLSearchParams();
      if (debouncedSearch) params.append('q', debouncedSearch);
      if (selectedCategory && selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (rxRequiredFilter !== 'ALL') params.append('rxRequired', rxRequiredFilter === 'RX');
      params.append('sortBy', sortBy);
      params.append('page', page.toString());
      params.append('size', pageSize.toString());

      const res = await axiosPublic.get(`/medicines?${params.toString()}`);
      return res.data;
    }
  });

  const medicines = data?.content || (Array.isArray(data) ? data : []);
  const totalElements = data?.totalElements != null ? data.totalElements : medicines.length;
  const totalPages = data?.totalPages != null ? data.totalPages : Math.ceil(totalElements / pageSize);

  const startRecord = totalElements > 0 ? page * pageSize + 1 : 0;
  const endRecord = Math.min((page + 1) * pageSize, totalElements);

  const addToCart = (med) => {
    const existingIndex = cartItems.findIndex(item => item.medicineId === med.id);
    let updated;
    if (existingIndex > -1) {
      updated = [...cartItems];
      updated[existingIndex].quantity += 1;
    } else {
      updated = [...cartItems, {
        medicineId: med.id,
        medicineName: med.title || med.medicineName,
        price: med.discountPrice || med.price,
        originalPrice: med.price,
        image: med.medicineImage || med.imageUrl,
        prescriptionRequired: med.prescriptionRequired,
        quantity: 1
      }];
    }
    setCartItems(updated);
    toast.success(`${med.title || med.medicineName} added to cart!`);
  };

  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const categories = [
    'ALL', 'Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Vitamins & Supplements', 'Diabetes Care'
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white py-12 px-4 sm:px-8 shadow-md relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <span className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-blue-100 border border-white/20">
              Healthcare E-Commerce
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold mt-3 tracking-tight">Pharmacy Marketplace</h1>
            <p className="text-blue-100 text-sm md:text-base mt-2 max-w-xl">
              Browse authentic, doctor-curated medicines, wellness products, and healthcare essentials delivered to your doorstep.
            </p>
          </div>
          <button
            onClick={() => navigate('/cart')}
            className="group bg-white text-blue-700 hover:bg-blue-50 px-6 py-3.5 rounded-2xl font-bold flex items-center gap-3 shadow-xl transition cursor-pointer shrink-0"
          >
            <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>View Cart</span>
            {totalCartCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-full">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        {/* Search & Filter Controls */}
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search medicine name, generic composition, brand, manufacturer..."
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-medium w-full md:w-auto">
                <ArrowUpDown size={16} className="text-gray-500 shrink-0" />
                <select
                  value={sortBy}
                  onChange={e => { setSortBy(e.target.value); setPage(0); }}
                  className="bg-transparent focus:outline-none text-gray-800 font-bold text-sm cursor-pointer"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-2 no-scrollbar">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2 shrink-0">Categories:</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setPage(0); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Pagination Metadata Bar */}
        <div className="flex justify-between items-center mb-4 text-xs font-bold text-slate-500 px-2">
          <span>
            {totalElements > 0 ? `Showing ${startRecord} to ${endRecord} of ${totalElements} medicines` : 'No medicines found'}
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                disabled={page === 0}
                className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span>Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm animate-pulse space-y-4">
                <div className="h-44 bg-gray-200 rounded-2xl" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : medicines.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
            <ShoppingBag className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No medicines found</h3>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your search keywords or category filters.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('ALL'); setPage(0); }}
              className="mt-6 px-6 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl text-sm hover:bg-blue-100 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {medicines.map((med) => {
              const discountPercent = med.discountPrice && med.price > med.discountPrice
                ? Math.round(((med.price - med.discountPrice) / med.price) * 100)
                : 0;

              return (
                <motion.div
                  key={med.id}
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-3xl p-5 border border-gray-100 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Image & Badges */}
                  <div className="relative mb-4 overflow-hidden rounded-2xl bg-slate-50 h-48 flex items-center justify-center">
                    {med.medicineImage || med.imageUrl ? (
                      <img
                        src={med.medicineImage || med.imageUrl}
                        alt={med.title || med.medicineName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <ShoppingBag size={36} className="text-slate-300 mb-1" />
                        <span className="text-xs font-bold text-slate-400">{med.brandName || med.manufacturer || 'Pharmaceutical'}</span>
                      </div>
                    )}
                    {discountPercent > 0 && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow">
                        {discountPercent}% OFF
                      </span>
                    )}
                    {med.prescriptionRequired && (
                      <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow flex items-center gap-1">
                        <ShieldAlert size={12} /> Rx Required
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      {med.category || 'Medicine'}
                    </span>
                    <h3 className="font-extrabold text-gray-900 text-lg mt-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {med.title || med.medicineName}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium line-clamp-1 mt-0.5">
                      {med.genericName ? `Generic: ${med.genericName}` : (med.brandName || 'Authentic Formulation')}
                    </p>

                    {/* Stock Status */}
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className={`font-bold ${med.stockQuantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {med.stockQuantity > 0 ? `● In Stock (${med.stockQuantity})` : 'Out of Stock'}
                      </span>
                    </div>

                    {/* Price Block */}
                    <div className="flex items-baseline gap-2 mt-4">
                      <span className="text-2xl font-black text-gray-900">₹{med.discountPrice || med.price}</span>
                      {discountPercent > 0 && (
                        <span className="text-sm font-semibold text-gray-400 line-through">₹{med.price}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/medicines/${med.id}`)}
                      className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition cursor-pointer text-center"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => addToCart(med)}
                      disabled={med.stockQuantity <= 0}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-blue-600/20"
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
