import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { axiosPrivate } from '../../api/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Package, Plus, Search, Trash2, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export default function ManageMedicines() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [medicineToDelete, setMedicineToDelete] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  const [formData, setFormData] = useState({
    medicineName: '',
    genericName: '',
    brandName: '',
    manufacturer: '',
    category: 'Pain Relief',
    composition: '',
    dosageForm: 'Tablet',
    strength: '500 mg',
    packSize: '10 Tablets per Strip',
    unit: 'Strip',
    description: '',
    detailedDescription: '',
    indications: '',
    usageInstructions: '',
    warnings: '',
    precautions: '',
    sideEffects: '',
    storageInstructions: '',
    prescriptionRequired: false,
    price: '',
    discountPrice: '',
    taxPercentage: 0,
    stockQuantity: '',
    minimumStockLevel: 10,
    medicineImage: '',
    status: 'ACTIVE'
  });

  const queryClient = useQueryClient();

  const { data: medicines = [], isLoading } = useQuery({
    queryKey: ['doctorMedicines'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/doctor/medicines');
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const url = editingMedicine ? `/doctor/medicines/${editingMedicine.id}` : `/doctor/medicines`;
      const method = editingMedicine ? axiosPrivate.put : axiosPrivate.post;
      const res = await method(url, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success(`Medicine ${editingMedicine ? 'updated' : 'added'} successfully`);
      queryClient.invalidateQueries(['doctorMedicines']);
      queryClient.invalidateQueries(['publicMedicines']);
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosPrivate.delete(`/doctor/medicines/${id}`);
    },
    onSuccess: () => {
      toast.success('Medicine deactivated successfully');
      queryClient.invalidateQueries(['doctorMedicines']);
      setMedicineToDelete(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setMedicineToDelete(null);
    }
  });

  const openModal = (med = null) => {
    if (med) {
      setEditingMedicine(med);
      setFormData({
        medicineName: med.medicineName || med.name || '',
        genericName: med.genericName || '',
        brandName: med.brandName || '',
        manufacturer: med.manufacturer || '',
        category: med.category || 'Pain Relief',
        composition: med.composition || '',
        dosageForm: med.dosageForm || 'Tablet',
        strength: med.strength || '500 mg',
        packSize: med.packSize || '',
        unit: med.unit || 'Strip',
        description: med.description || '',
        detailedDescription: med.detailedDescription || '',
        indications: med.indications || '',
        usageInstructions: med.usageInstructions || '',
        warnings: med.warnings || '',
        precautions: med.precautions || '',
        sideEffects: med.sideEffects || '',
        storageInstructions: med.storageInstructions || '',
        prescriptionRequired: !!med.prescriptionRequired,
        price: med.price || '',
        discountPrice: med.discountPrice || '',
        taxPercentage: med.taxPercentage || 0,
        stockQuantity: med.stockQuantity || 0,
        minimumStockLevel: med.minimumStockLevel || 10,
        medicineImage: med.medicineImage || med.imageUrl || '',
        status: med.status || 'ACTIVE'
      });
    } else {
      setEditingMedicine(null);
      setFormData({
        medicineName: '',
        genericName: '',
        brandName: '',
        manufacturer: '',
        category: 'Pain Relief',
        composition: '',
        dosageForm: 'Tablet',
        strength: '500 mg',
        packSize: '10 Tablets per Strip',
        unit: 'Strip',
        description: '',
        detailedDescription: '',
        indications: '',
        usageInstructions: '',
        warnings: '',
        precautions: '',
        sideEffects: '',
        storageInstructions: '',
        prescriptionRequired: false,
        price: '',
        discountPrice: '',
        taxPercentage: 0,
        stockQuantity: 100,
        minimumStockLevel: 10,
        medicineImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
        status: 'ACTIVE'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMedicine(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const filteredMedicines = medicines.filter(m => {
    const q = searchFilter.toLowerCase();
    return (m.medicineName || m.name || '').toLowerCase().includes(q) ||
           (m.genericName || '').toLowerCase().includes(q) ||
           (m.category || '').toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Medicine Master Management</h1>
          <p className="text-sm text-gray-500 mt-1">Add, update, and manage medicines available in patient e-commerce.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus size={20} /> Add Medicine
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search medicine name, generic name, category..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Medicine Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 font-medium">Loading Medicine Master...</div>
        ) : filteredMedicines.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">No medicines found</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Medicine" to create a new medicine entry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="p-4">Medicine</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Prescription</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredMedicines.map((med) => (
                  <tr key={med.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={med.medicineImage || med.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300'} 
                          alt={med.medicineName || med.name}
                          className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0" 
                        />
                        <div>
                          <div className="font-bold text-gray-900">{med.medicineName || med.name}</div>
                          <div className="text-xs text-gray-500 font-medium">{med.genericName} • {med.dosageForm || 'Tablet'} {med.strength}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {med.category || 'General'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-900">₹{med.discountPrice || med.price}</div>
                      {med.discountPrice && med.price > med.discountPrice && (
                        <div className="text-xs text-gray-400 line-through">₹{med.price}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 font-bold ${med.stockQuantity > 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {med.stockQuantity > 10 ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                        {med.stockQuantity} {med.unit || 'units'}
                      </span>
                    </td>
                    <td className="p-4">
                      {med.prescriptionRequired ? (
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                          <ShieldAlert size={13} /> Rx Required
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 w-fit block">
                          OTC / Free
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${med.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                        {med.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(med)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setMedicineToDelete(med)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingMedicine ? "Edit Medicine" : "Add New Medicine to E-Commerce"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Medicine Name *</label>
              <input required type="text" placeholder="e.g. Paracetamol 500 mg" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500" value={formData.medicineName} onChange={e => setFormData({...formData, medicineName: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Generic Name</label>
              <input type="text" placeholder="e.g. Paracetamol" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500" value={formData.genericName} onChange={e => setFormData({...formData, genericName: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Brand Name</label>
              <input type="text" placeholder="e.g. Dolo 650" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={formData.brandName} onChange={e => setFormData({...formData, brandName: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Manufacturer</label>
              <input type="text" placeholder="e.g. Micro Labs Ltd" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
              <select className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="Pain Relief">Pain Relief</option>
                <option value="Antibiotics">Antibiotics</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Vitamins & Supplements">Vitamins & Supplements</option>
                <option value="Diabetes Care">Diabetes Care</option>
                <option value="Cold & Cough">Cold & Cough</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Dosage Form</label>
              <input type="text" placeholder="e.g. Tablet / Syrup / Injection" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={formData.dosageForm} onChange={e => setFormData({...formData, dosageForm: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Strength</label>
              <input type="text" placeholder="e.g. 500 mg" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Pack Size</label>
              <input type="text" placeholder="e.g. 10 Tablets per Strip" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={formData.packSize} onChange={e => setFormData({...formData, packSize: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹) *</label>
              <input required type="number" step="0.01" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-bold" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Discount Price (₹)</label>
              <input type="number" step="0.01" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-bold text-emerald-600" value={formData.discountPrice} onChange={e => setFormData({...formData, discountPrice: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Stock Quantity *</label>
              <input required type="number" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-bold" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Medicine Image URL</label>
            <input type="url" placeholder="https://images.unsplash.com/..." className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={formData.medicineImage} onChange={e => setFormData({...formData, medicineImage: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Short Description</label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief overview for medicine card..." />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Detailed Description & Indications</label>
            <textarea rows={3} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={formData.detailedDescription} onChange={e => setFormData({...formData, detailedDescription: e.target.value})} placeholder="Detailed therapeutic uses, warnings, precautions..." />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-amber-600" size={20} />
              <div>
                <p className="text-xs font-bold text-gray-900">Prescription Required</p>
                <p className="text-[11px] text-gray-500">Require patient to upload valid doctor prescription at checkout</p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={formData.prescriptionRequired} 
              onChange={e => setFormData({...formData, prescriptionRequired: e.target.checked})} 
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={closeModal} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={saveMutation.isPending}>
              {editingMedicine ? 'UPDATE MEDICINE' : 'SAVE MEDICINE'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!medicineToDelete}
        onClose={() => setMedicineToDelete(null)}
        onConfirm={() => {
          if (medicineToDelete) {
            deleteMutation.mutate(medicineToDelete.id);
          }
        }}
        title="Deactivate Medicine"
        description={`Are you sure you want to deactivate ${medicineToDelete?.medicineName || medicineToDelete?.name}?`}
        confirmText="Deactivate"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
