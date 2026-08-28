import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { fadeIn } from '../../components/ui/motion';
import { toast } from 'react-hot-toast';
import { 
    Building, 
    Edit2, 
    Plus, 
    Trash2, 
    Stethoscope, 
    FileText, 
    CheckCircle2, 
    XCircle,
    Search,
    Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '../../components/ui/Badge';

const DepartmentManagement = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    
    const initialFormState = {
        name: '',
        description: '',
        headDoctorId: '',
        isActive: true
    };
    const [formData, setFormData] = useState(initialFormState);

    // Fetch Departments
    const { data, isLoading } = useQuery({
        queryKey: ['admin-departments', page, size],
        queryFn: async () => {
            const res = await axiosPrivate.get(`/departments?page=${page}&size=${size}`);
            return res.data;
        }
    });

    // Fetch Doctors list for Head Doctor dropdown assignment
    const { data: doctors = [] } = useQuery({
        queryKey: ['admin-doctors-list'],
        queryFn: async () => {
            try {
                const res = await axiosPrivate.get('/doctors');
                return res.data || [];
            } catch {
                return [];
            }
        }
    });

    const createOrUpdateMutation = useMutation({
        mutationFn: async (deptData) => {
            if (deptData.id) {
                return axiosPrivate.put(`/departments/${deptData.id}`, deptData);
            } else {
                return axiosPrivate.post('/departments', deptData);
            }
        },
        onSuccess: () => {
            toast.success(editingDept ? 'Department updated successfully' : 'Department created successfully');
            queryClient.invalidateQueries(['admin-departments']);
            closeModal();
        },
        onError: (err) => {
            const msg = err.response?.data?.message || 'Failed to save department details';
            toast.error(msg);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => axiosPrivate.delete(`/departments/${id}`),
        onSuccess: () => {
            toast.success('Department deleted successfully');
            queryClient.invalidateQueries(['admin-departments']);
            setIsDeleteDialogOpen(false);
            setDepartmentToDelete(null);
        },
        onError: () => {
            toast.error('Failed to delete department');
            setIsDeleteDialogOpen(false);
            setDepartmentToDelete(null);
        }
    });

    const handleOpenCreate = () => {
        setEditingDept(null);
        setFormData(initialFormState);
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (dept) => {
        setEditingDept(dept);
        setFormData({
            id: dept.id,
            name: dept.name || '',
            description: dept.description || '',
            headDoctorId: dept.headDoctorId ? String(dept.headDoctorId) : '',
            isActive: dept.isActive !== false
        });
        setIsAddModalOpen(true);
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setEditingDept(null);
        setFormData(initialFormState);
    };

    const handleDeleteClick = (id) => {
        setDepartmentToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Department Name is required');
            return;
        }

        const payload = {
            ...formData,
            headDoctorId: formData.headDoctorId ? Number(formData.headDoctorId) : null
        };
        createOrUpdateMutation.mutate(payload);
    };

    const deptList = Array.isArray(data) ? data : (data?.content || []);
    const totalPages = data?.totalPages || 1;

    const columns = [
        { key: 'id', title: 'ID', render: (val) => <span className="font-mono font-bold text-slate-400">#{val}</span> },
        { 
            key: 'name', 
            title: 'Department Name', 
            render: (val) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#2160FF] flex items-center justify-center font-bold text-sm">
                        <Building className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                        {val || '—'}
                    </span>
                </div>
            )
        },
        { key: 'description', title: 'Description', render: (val) => <span className="text-xs font-medium text-slate-500 max-w-[280px] truncate block">{val || '—'}</span> },
        { 
            key: 'headDoctorId', 
            title: 'Head Doctor', 
            render: (val) => {
                if (!val) return <span className="text-xs text-slate-400 font-medium italic">Unassigned</span>;
                const matchedDoc = doctors.find(d => d.id === val || d.userId === val);
                const docName = matchedDoc ? (matchedDoc.name || `Dr. ${matchedDoc.firstName || ''} ${matchedDoc.lastName || ''}`) : `Dr. ID #${val}`;
                return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                        <Stethoscope size={13} />
                        {docName}
                    </div>
                );
            } 
        },
        {
            key: 'isActive',
            title: 'Status',
            render: (isActive) => (
                <Badge variant={isActive ? 'success' : 'danger'}>
                    {isActive ? 'Active' : 'Inactive'}
                </Badge>
            )
        },
        {
            key: 'actions',
            title: 'Actions',
            align: 'right',
            render: (_, row) => (
                <div className="flex items-center justify-end gap-2">
                    <button 
                        onClick={() => handleOpenEdit(row)}
                        className="p-1.5 text-slate-400 hover:text-[#2160FF] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Edit Department"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => handleDeleteClick(row.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        title="Delete Department"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={() => deleteMutation.mutate(departmentToDelete)}
                title="Delete Department"
                message="Are you sure you want to delete this department? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isDestructive={true}
                isLoading={deleteMutation.isPending}
            />

            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5 m-0">
                        <Building className="w-6 h-6 text-[#2160FF]" />
                        Clinical Departments
                    </h2>
                    <p className="text-xs font-medium text-slate-500 m-0 mt-1">
                        Manage clinical departments, assigned head doctors, and medical specialties.
                    </p>
                </div>
                <button 
                    onClick={handleOpenCreate} 
                    className="bg-[#2160FF] hover:bg-[#1b52dc] text-white px-5 py-2.5 rounded-xl shadow-md font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border-0"
                    style={{ backgroundColor: '#2160FF' }}
                >
                    <Plus size={18} />
                    Add Department
                </button>
            </div>

            {/* Department Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
                <DataTable 
                    columns={columns} 
                    data={deptList} 
                    isLoading={isLoading} 
                    emptyTitle="No clinical departments found."
                />
                
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30 text-xs">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-3.5 py-1.5 font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-50 transition"
                        >
                            Previous
                        </button>
                        <span className="font-semibold text-slate-500">
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="px-3.5 py-1.5 font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-50 transition"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Redesigned Add / Edit Department Modal */}
            <Modal
                isOpen={isAddModalOpen || !!editingDept}
                onClose={closeModal}
                size="md"
            >
                {/* Custom Modal Header */}
                <div className="-mx-6 -mt-6 px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#2160FF]/20 text-[#2160FF] border border-[#2160FF]/30 flex items-center justify-center font-bold">
                            <Building size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-display m-0 text-white">
                                {editingDept ? 'Edit Department' : 'Add New Department'}
                            </h2>
                            <p className="text-xs text-slate-300 m-0 mt-0.5">
                                Define clinical specialty, description, and assign department leadership.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    {/* Department Name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Department Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                value={formData.name} 
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g. Cardiology, Orthopedics, Pediatrics"
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF] transition-all font-semibold" 
                            />
                        </div>
                    </div>

                    {/* Head Doctor Assignment */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Head Doctor Leadership <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <div className="relative">
                            <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={formData.headDoctorId}
                                onChange={e => setFormData({ ...formData, headDoctorId: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF] transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Select Department Lead Doctor (Optional)</option>
                                {doctors.map(doc => (
                                    <option key={doc.id || doc.userId} value={doc.id || doc.userId}>
                                        {doc.name || `Dr. ${doc.firstName || ''} ${doc.lastName || ''}`} ({doc.specialty || 'General'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Department Description */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Clinical Scope & Description
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                            <textarea 
                                value={formData.description} 
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Provide clinical services summary, specializations, or location details..."
                                rows={3}
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF] transition-all resize-none" 
                            />
                        </div>
                    </div>

                    {/* Active Status Toggle */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
                        <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Active Clinical Department
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Active departments allow patient scheduling and doctor assignments.
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={formData.isActive} 
                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })} 
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button 
                            type="button" 
                            onClick={closeModal}
                            className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={!formData.name.trim() || createOrUpdateMutation.isPending}
                            className="bg-[#2160FF] hover:bg-[#1b52dc] text-white px-6 py-2.5 text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 border-0 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                            style={{ backgroundColor: '#2160FF' }}
                        >
                            {createOrUpdateMutation.isPending ? 'Saving...' : (editingDept ? 'Save Changes' : 'Create Department')}
                        </button>
                    </div>
                </form>
            </Modal>
        </motion.div>
    );
};

export default DepartmentManagement;
