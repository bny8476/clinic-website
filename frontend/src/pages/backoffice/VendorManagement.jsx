import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fadeIn } from '../../components/ui/motion';
import { axiosPrivate } from '../../api/axios';



const VendorManagement = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    category: 'PHARMACEUTICALS'
  });

  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await axiosPrivate.get('/backoffice/inventory/suppliers');
        setVendors(res.data);
      } catch (err) {
        toast.error('Failed to load vendors');
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!vendorForm.name || !vendorForm.email) {
      toast.error('Name and email are required');
      return;
    }
    
    const newVendor = {
      ...vendorForm,
      status: 'ACTIVE'
    };
    
    try {
      const res = await axiosPrivate.post('/backoffice/inventory/suppliers', newVendor);
      setVendors([res.data, ...vendors]);
      toast.success('Vendor added successfully');
      setShowAdd(false);
      setVendorForm({ name: '', contactPerson: '', email: '', phone: '', category: 'PHARMACEUTICALS' });
    } catch (err) {
      toast.error('Failed to add vendor');
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
            <Truck className="w-7 h-7 text-indigo-600" />
            Vendor Management
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Manage suppliers, procurement contacts, and vendor performance.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : 'Add Vendor'}
        </Button>
      </div>

      {showAdd && (
        <Card className="border-indigo-100 mb-6">
          <Card.Header className="bg-indigo-50 border-b border-indigo-100">
            <h2 className="text-lg font-bold text-indigo-900">Add New Vendor</h2>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Company Name" required id="name">
                  <input id="name" type="text" value={vendorForm.name} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} className="input-field" required />
                </FormField>
                <FormField label="Vendor Category" required id="category">
                  <select id="category" value={vendorForm.category} onChange={e => setVendorForm({...vendorForm, category: e.target.value})} className="input-field">
                    <option value="PHARMACEUTICALS">Pharmaceuticals</option>
                    <option value="MEDICAL_EQUIPMENT">Medical Equipment</option>
                    <option value="LAB_SUPPLIES">Lab Supplies</option>
                    <option value="OFFICE_SUPPLIES">Office Supplies</option>
                  </select>
                </FormField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Contact Person" id="contact">
                  <input id="contact" type="text" value={vendorForm.contactPerson} onChange={e => setVendorForm({...vendorForm, contactPerson: e.target.value})} className="input-field" />
                </FormField>
                <FormField label="Email Address" required id="email">
                  <input id="email" type="email" value={vendorForm.email} onChange={e => setVendorForm({...vendorForm, email: e.target.value})} className="input-field" required />
                </FormField>
                <FormField label="Phone Number" id="phone">
                  <input id="phone" type="tel" value={vendorForm.phone} onChange={e => setVendorForm({...vendorForm, phone: e.target.value})} className="input-field" />
                </FormField>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary">Save Vendor</Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      )}

      <Card>
        <Card.Body className="p-0">
          {vendors.length === 0 ? (
            <div className="p-12">
              <EmptyState icon={Building2} title="No Vendors" description="No vendors are currently registered." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-4 border-b border-slate-200">Company Name</th>
                    <th className="p-4 border-b border-slate-200">Category</th>
                    <th className="p-4 border-b border-slate-200">Contact Person</th>
                    <th className="p-4 border-b border-slate-200">Contact Details</th>
                    <th className="p-4 border-b border-slate-200 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.map(vendor => (
                    <tr key={vendor.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-[var(--color-navy-900)] flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                          <Building2 size={16} />
                        </div>
                        {vendor.name}
                      </td>
                      <td className="p-4 text-slate-600 font-medium">
                        <span className="bg-slate-100 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">
                          {vendor.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700">{vendor.contactPerson}</td>
                      <td className="p-4 text-slate-600">
                        <div>{vendor.email}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{vendor.phone}</div>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                          vendor.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {vendor.status}
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

export default VendorManagement;
