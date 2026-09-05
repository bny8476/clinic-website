import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { axiosPublic } from '../../api/axios';
import { ShieldAlert, CheckCircle2, Star, ShoppingBag, ArrowLeft, Plus, Minus, AlertCircle, Truck, Package } from 'lucide-react';

export default function MedicineDetailsPage() {
  const { medicineId } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const { data: med, isLoading } = useQuery({
    queryKey: ['medicineDetails', medicineId],
    queryFn: async () => {
      const res = await axiosPublic.get(`/medicines/${medicineId}`);
      return res.data;
    }
  });

  const addToCart = (buyNow = false) => {
    let currentCart = [];
    try {
      currentCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    } catch (e) {}

    const existingIndex = currentCart.findIndex(item => item.medicineId === med.id);
    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += quantity;
    } else {
      currentCart.push({
        medicineId: med.id,
        medicineName: med.title || med.medicineName,
        price: med.discountPrice || med.price,
        originalPrice: med.price,
        image: med.medicineImage || med.imageUrl,
        prescriptionRequired: med.prescriptionRequired,
        quantity: quantity
      });
    }

    localStorage.setItem('cartItems', JSON.stringify(currentCart));
    toast.success(`${med.title || med.medicineName} added to cart!`);

    if (buyNow) {
      navigate('/cart');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">Loading Medicine Details...</div>;
  }

  if (!med) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-red-500">Medicine Not Found</div>;
  }

  const discountPercent = med.discountPrice && med.price > med.discountPrice
    ? Math.round(((med.price - med.discountPrice) / med.price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => navigate('/medicines')} 
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-bold text-gray-500">Back to Pharmacy Marketplace</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Prescription Required Banner */}
        {med.prescriptionRequired && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-4 mb-8 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-amber-500 text-white rounded-2xl shrink-0">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h4 className="font-extrabold text-amber-900 text-base">Prescription Required for this Medicine</h4>
              <p className="text-xs text-amber-700 mt-0.5">Please ensure you have a valid doctor's prescription ready during checkout.</p>
            </div>
          </div>
        )}

        {/* Main Details Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image Column */}
          <div className="flex flex-col items-center">
            <div className="w-full h-80 sm:h-96 rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center p-4 relative shadow-inner">
              <img
                src={med.medicineImage || med.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'}
                alt={med.title || med.medicineName}
                className="max-h-full object-contain"
              />
              {discountPercent > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Details Column */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold uppercase tracking-wider border border-blue-100">
                  {med.category || 'Pain Relief'}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  {med.stockQuantity > 0 ? '● In Stock' : 'Out of Stock'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mt-3 tracking-tight">{med.title || med.medicineName}</h1>
              <p className="text-base font-semibold text-gray-500 mt-1">Generic: {med.genericName || 'Paracetamol'} | Brand: {med.brandName || 'Aurelian Care'}</p>
              <p className="text-xs text-gray-400 mt-0.5">Manufacturer: {med.manufacturer || 'Approved Pharma Ltd'}</p>

              {/* Price Row */}
              <div className="flex items-baseline gap-4 mt-6">
                <span className="text-4xl font-black text-gray-900">₹{med.discountPrice || med.price}</span>
                {discountPercent > 0 && (
                  <span className="text-xl font-bold text-gray-400 line-through">₹{med.price}</span>
                )}
                <span className="text-xs font-bold text-gray-500">Taxes Included</span>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mt-6">
                <span className="text-sm font-bold text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-200 rounded-2xl bg-gray-50 p-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="p-2 hover:bg-white rounded-xl text-gray-700 transition cursor-pointer"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-extrabold text-sm">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)} 
                    className="p-2 hover:bg-white rounded-xl text-gray-700 transition cursor-pointer"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                <button
                  onClick={() => addToCart(false)}
                  disabled={med.stockQuantity <= 0}
                  className="py-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-sm rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 border border-blue-200"
                >
                  <ShoppingBag size={18} /> Add to Cart
                </button>
                <button
                  onClick={() => addToCart(true)}
                  disabled={med.stockQuantity <= 0}
                  className="py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl transition cursor-pointer shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications Tabs / Grid */}
        <div className="mt-10 bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 space-y-6">
          <h3 className="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-4">Product Specifications & Medical Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div>
              <h4 className="font-bold text-blue-600 uppercase text-xs tracking-wider mb-2">Description & Uses</h4>
              <p className="text-gray-600 leading-relaxed">{med.detailedDescription || med.description || 'Full therapeutic form for daily medical treatment.'}</p>
            </div>
            <div>
              <h4 className="font-bold text-blue-600 uppercase text-xs tracking-wider mb-2">Dosage & Composition</h4>
              <p className="text-gray-600 leading-relaxed">{med.composition || 'Active Pharmaceutical Ingredient'} • {med.dosageForm || 'Tablet'} ({med.strength || '500 mg'})</p>
            </div>
            <div>
              <h4 className="font-bold text-blue-600 uppercase text-xs tracking-wider mb-2">Warnings & Precautions</h4>
              <p className="text-gray-600 leading-relaxed">{med.warnings || 'Keep out of reach of children. Consult doctor before use if pregnant.'}</p>
            </div>
            <div>
              <h4 className="font-bold text-blue-600 uppercase text-xs tracking-wider mb-2">Storage Instructions</h4>
              <p className="text-gray-600 leading-relaxed">{med.storageInstructions || 'Store in a cool, dry place below 30°C away from direct sunlight.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
