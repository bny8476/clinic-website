import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { fadeIn } from '../../components/ui/motion';

const BranchManagement = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentBranch, setCurrentBranch] = useState(null);
    const [formData, setFormData] = useState({
        name: '', address: '', city: '', country: '', postalCode: '', phoneNumber: '', email: '', timezone: 'UTC', isActive: true
    });

    const { data: branches, isLoading } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await axiosPrivate.get('/branches');
            return res.data;
        }
    });

    const mutation = useMutation({
        mutationFn: async (branchData) => {
            if (branchData.id) {
                const res = await axiosPrivate.put(`/branches/${branchData.id}`, branchData);
                return res.data;
            } else {
                const res = await axiosPrivate.post('/branches', branchData);
                return res.data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['branches']);
            setIsModalOpen(false);
            setCurrentBranch(null);
        }
    });

    const handleEdit = (branch) => {
        setCurrentBranch(branch);
        setFormData(branch);
        setIsModalOpen(true);
    };

    const handleCreateNew = () => {
        setCurrentBranch(null);
        setFormData({
            name: '', address: '', city: '', country: '', postalCode: '', phoneNumber: '', email: '', timezone: 'UTC', isActive: true
        });
        setIsModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    const columns = [
        { key: 'name', title: 'Name', render: (val) => <span className="font-semibold text-gray-900">{val}</span> },
        { key: 'city', title: 'City', render: (_, row) => `${row.city}, ${row.country}` },
        { key: 'phoneNumber', title: 'Phone' },
        { key: 'timezone', title: 'Timezone' },
        {
            key: 'isActive',
            title: 'Status',
            render: (val) => (
                <Badge variant={val ? 'success' : 'danger'}>
                    {val ? 'Active' : 'Inactive'}
                </Badge>
            )
        },
        {
            key: 'actions',
            title: 'Actions',
            align: 'right',
            render: (_, row) => (
                <button
                    onClick={() => handleEdit(row)}
                    className="p-1 text-gray-400 hover:text-[#2B4AFE] transition-colors"
                    title="Edit Branch"
                >
                    <Edit2 size={16} />
                </button>
            )
        }
    ];

    return (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
                        <Building2 className="w-7 h-7 text-[var(--color-navy-800)]" />
                        Branch Management
                    </h1>
                    <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
                        Manage clinic locations, contact details, and status.
                    </p>
                </div>
                <Button variant="primary" onClick={handleCreateNew} className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Branch
                </Button>
            </div>

            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
                <DataTable 
                    columns={columns} 
                    data={branches || []} 
                    isLoading={isLoading} 
                    emptyTitle="No branches found."
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentBranch ? 'Edit Branch' : 'Create Branch'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Name" required>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input-field" />
                        </FormField>
                        <FormField label="Email" required>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" />
                        </FormField>
                        <FormField label="Phone Number" required>
                            <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="input-field" />
                        </FormField>
                        <FormField label="Timezone" required>
                            <input type="text" name="timezone" value={formData.timezone} onChange={handleChange} required className="input-field" />
                        </FormField>
                        <div className="col-span-2">
                            <FormField label="Address" required>
                                <input type="text" name="address" value={formData.address} onChange={handleChange} required className="input-field" />
                            </FormField>
                        </div>
                        <FormField label="City" required>
                            <input type="text" name="city" value={formData.city} onChange={handleChange} required className="input-field" />
                        </FormField>
                        <FormField label="Country" required>
                            <input type="text" name="country" value={formData.country} onChange={handleChange} required className="input-field" />
                        </FormField>
                        <FormField label="Postal Code">
                            <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className="input-field" />
                        </FormField>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2 pb-2">
                        <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-navy-600)] focus:ring-[var(--color-navy-600)]" />
                        <label htmlFor="isActive" className="text-sm font-medium text-[var(--color-text)] cursor-pointer">Active Branch</label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)] mt-6">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" isLoading={mutation.isPending}>
                            {currentBranch ? 'Save Changes' : 'Create Branch'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </motion.div>
    );
};

export default BranchManagement;
