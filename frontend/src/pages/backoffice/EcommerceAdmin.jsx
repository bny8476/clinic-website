import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { fadeIn } from '../../components/ui/motion';
import { axiosPrivate } from '../../api/axios';



const EcommerceAdmin = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    stock: '',
    category: 'WELLNESS'
  });

  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axiosPrivate.get('/ecommerce/products');
        setProducts(res.data);
      } catch (err) {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      toast.error('Name and price are required');
      return;
    }
    
    const newProduct = {
      ...productForm,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      status: Number(productForm.stock) > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'
    };
    
    try {
      const res = await axiosPrivate.post('/ecommerce/products', newProduct);
      setProducts([res.data, ...products]);
      toast.success('Product added successfully');
      setShowAdd(false);
      setProductForm({ name: '', price: '', stock: '', category: 'WELLNESS' });
    } catch (err) {
      toast.error('Failed to add product');
    }
  };

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/backoffice" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-indigo-600" />
            eCommerce Admin
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Manage over-the-counter products available for online purchase.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : 'Add Product'}
        </Button>
      </div>

      {showAdd && (
        <Card className="border-indigo-100 mb-6">
          <Card.Header className="bg-indigo-50 border-b border-indigo-100">
            <h2 className="text-lg font-bold text-indigo-900">Add New Product</h2>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Product Name" required id="name">
                  <input id="name" type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="input-field" required />
                </FormField>
                <FormField label="Category" required id="category">
                  <select id="category" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="input-field">
                    <option value="WELLNESS">Wellness & Vitamins</option>
                    <option value="MEDICAL_SUPPLIES">Medical Supplies</option>
                    <option value="DEVICES">Devices & Monitors</option>
                    <option value="PERSONAL_CARE">Personal Care</option>
                  </select>
                </FormField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Price ($)" required id="price">
                  <input id="price" type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="input-field" required />
                </FormField>
                <FormField label="Initial Stock" required id="stock">
                  <input id="stock" type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="input-field" required />
                </FormField>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary">Save Product</Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      )}

      <Card>
        <Card.Body className="p-0">
          {products.length === 0 ? (
            <div className="p-12">
              <EmptyState icon={Package} title="No Products" description="No products are currently listed in the store." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-4 border-b border-slate-200">Product</th>
                    <th className="p-4 border-b border-slate-200">Category</th>
                    <th className="p-4 border-b border-slate-200 text-right">Price</th>
                    <th className="p-4 border-b border-slate-200 text-right">Stock</th>
                    <th className="p-4 border-b border-slate-200 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-[var(--color-navy-900)] flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-400 shrink-0">
                          <Package size={16} />
                        </div>
                        {product.name}
                      </td>
                      <td className="p-4 text-slate-600 font-medium">
                        <span className="bg-slate-100 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">
                          {product.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-700">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-bold ${product.stock > 10 ? 'text-emerald-600' : product.stock > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                          product.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {product.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
    </motion.div>
    
  );
};

export default EcommerceAdmin;
