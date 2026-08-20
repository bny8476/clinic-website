import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';



export default function ProductCatalog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['ecommerce-catalog'],
    queryFn: async () => {
      const response = await axiosPrivate.get('/ecommerce/products');
      return response.data || [];
    }
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId) => {
      await axiosPrivate.post('/ecommerce/cart/items', {
        productId,
        quantity: 1,
        cartType: 'CART'
      });
    },
    onSuccess: () => {
      toast.success('Added to cart');
      queryClient.invalidateQueries(['ecommerce-cart']);
    },
    onError: () => {
      toast.error('Failed to add to cart');
    }
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', ...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-navy-900)]">Pharmacy & Wellness</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Premium healthcare products, verified and delivered.</p>
        </div>
        <button 
          onClick={() => navigate('/patient/ecommerce/cart')}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all shadow-md active:scale-95"
        >
          <ShoppingBag className="w-5 h-5" />
          View Cart
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all shadow-sm"
            placeholder="Search medicines, devices, wellness..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === cat 
                  ? 'bg-[var(--color-navy-900)] text-white shadow-md' 
                  : 'bg-white text-[var(--color-navy-900)] border border-gray-200 hover:border-[var(--color-primary)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
            >
              <div className="relative aspect-w-4 aspect-h-3 bg-gray-50">
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} alt={product.title} className="object-cover w-full h-48" />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-blue-50 text-[var(--color-primary)]">
                    <ShieldCheck className="w-12 h-12 opacity-50" />
                  </div>
                )}
                
                {product.prescriptionRequired && (
                  <div className="absolute top-3 left-3 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-md font-bold flex items-center gap-1 shadow-sm">
                    <AlertTriangle className="w-3 h-3" /> Rx Required
                  </div>
                )}
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3 h-3 text-[var(--color-text-muted)]" />
                  <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">{product.category}</span>
                </div>
                
                <h3 className="text-lg font-bold text-[var(--color-navy-900)] leading-tight mb-1">{product.title}</h3>
                
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-[var(--color-primary)]">₹{product.price}</span>
                    {product.mrp && product.mrp > product.price && (
                      <span className="ml-2 text-sm text-gray-400 line-through">₹{product.mrp}</span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => addToCartMutation.mutate(product.id)}
                    disabled={addToCartMutation.isPending}
                    className="w-10 h-10 rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-white transition-colors disabled:opacity-50"
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!isLoading && filteredProducts.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <ShieldCheck className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-[var(--color-navy-900)]">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or category filters.</p>
        </div>
      )}
    </div>
    
  );
}
