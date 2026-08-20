import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function QuickOrderModal({ isOpen, onClose, medicine, onSuccess }) {
  const [vendors, setVendors] = useState([
    { id: 1, name: 'Apex Pharma Distributors' },
    { id: 2, name: 'MedLife Wholesale' },
    { id: 3, name: 'Global Health Supplies' },
  ]);
  
  const [formData, setFormData] = useState({
    vendorId: '',
    quantity: '',
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'Normal',
    remarks: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (medicine) {
      setFormData(prev => ({
        ...prev,
        quantity: medicine.reorderQty || medicine.reorderLevel || 100,
        priority: medicine.status === 'CRITICAL' ? 'Urgent' : 'Normal'
      }));
    }
  }, [medicine]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendorId) {
      toast.error('Please select a vendor');
      return;
    }

    setIsSubmitting(true);
    try {
      // Mock API call
      // In a real app: await api.post('/pharmacy/purchase-orders', { ...formData, medicineId: medicine.id })
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Purchase order raised for ${medicine.name}`);
      onSuccess(medicine.name);
      onClose();
    } catch (error) {
      toast.error('Failed to raise order. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="quick-order-form"
        disabled={isSubmitting}
        className="px-4 py-2 text-sm font-medium text-white bg-[#1E2A5E] rounded-lg hover:bg-[#1E2A5E]/90 disabled:opacity-50 flex items-center gap-2"
      >
        {isSubmitting ? 'Raising Order...' : 'Raise Purchase Order'}
      </button>
    </>
  );

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Purchase Order"
      footer={footer}
    >
      <form id="quick-order-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-md">
            <ShoppingBag className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900">{medicine?.name}</h4>
            <p className="text-xs text-blue-700 mt-0.5">Current Stock: {medicine?.current} | Category: {medicine?.category}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Select Vendor
            </label>
            <div className="relative">
              <select
                required
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm"
              >
                <option value="">Choose a supplier...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <Truck className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Quantity to Order
              </label>
              <input
                type="number"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Expected Delivery Date
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Remarks (Optional)
            </label>
            <textarea
              rows="2"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Any specific instructions..."
            ></textarea>
          </div>
        </div>

        {formData.priority === 'Urgent' && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-[11px] font-bold text-red-700 uppercase tracking-wide">High Priority: This will be marked as an urgent requirement.</p>
          </div>
        )}
      </form>
    </AppModal>
  );
}
