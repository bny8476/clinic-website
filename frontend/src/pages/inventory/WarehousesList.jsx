import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';
import { useState } from 'react';



const WarehousesList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    manager: '',
    itemsCount: 0
  });

  const mutation = useMutation({
    mutationFn: async (data) => axiosPrivate.post('/backoffice/inventory/warehouses', data),
    onSuccess: () => {
      toast.success('Warehouse added successfully');
      queryClient.invalidateQueries(['inventory-warehouses']);
      setIsModalOpen(false);
      setFormData({ name: '', code: '', location: '', manager: '', itemsCount: 0 });
    },
    onError: () => toast.error('Failed to add warehouse')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      name: formData.name + (formData.code ? ` (${formData.code})` : ''),
      location: formData.location
    });
  };

  const { data: warehouses = [] } = useQuery({
    queryKey: ['inventory-warehouses'],
    queryFn: async () => (await axiosPrivate.get('/backoffice/inventory/warehouses')).data,
  });

  const sampleWarehouses = warehouses.length > 0 ? warehouses : [
    { id: 1, name: 'Main Central Depot', code: 'WH-CENTRAL', location: 'Building A, Basement 1', itemsCount: 1420, manager: 'Suresh Kumar' },
    { id: 2, name: 'Pharmacy Sub-Store', code: 'WH-PHARM', location: 'Ground Floor, Room 102', itemsCount: 450, manager: 'Amit Verma' },
    { id: 3, name: 'OT & Surgical Storage', code: 'WH-SURGICAL', location: '2nd Floor, OT Complex', itemsCount: 280, manager: 'Nurse Sunita' },
  ];

  return (
    
    <>
    <div className="p-4 sm:p-6" style={{ maxWidth: '1000px', margin: '0 auto' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Warehouse Management</h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Manage inventory storage locations across facilities</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ background: '#c2410c', color: 'var(--color-surface)', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={16} /> Add Warehouse
        </button>
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Code</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Name & Location</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Manager</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sampleWarehouses.map(w => (
              <tr key={w.id} style={{ borderBottom: '1px solid var(--color-surface-alt)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>{w.code}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)', display: 'block' }}>{w.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{w.location}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{w.manager}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{w.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      <Transition show={isModalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-5">
                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-slate-900">
                      Add Warehouse
                    </Dialog.Title>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Warehouse Name</label>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Code</label>
                      <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Location</label>
                      <input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Manager Name</label>
                      <input required value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                      <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm font-semibold text-white bg-[#c2410c] rounded-lg hover:bg-orange-800 disabled:opacity-50">
                        {mutation.isPending ? 'Saving...' : 'Add Warehouse'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
    
  );
};

export default WarehousesList;
