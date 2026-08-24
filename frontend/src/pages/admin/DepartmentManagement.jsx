import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { fadeIn } from '../../components/ui/motion';
import { toast } from 'react-hot-toast';
import { Building, Edit2, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '../../components/ui/Badge';

const DepartmentManagement = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [newDeptDesc, setNewDeptDesc] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['admin-departments', page, size],
        queryFn: async () => {
            const res = await axiosPrivate.get(`/departments?page=${page}&size=${size}`);
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (deptData) => axiosPrivate.post('/departments', deptData),
        onSuccess: () => {
            toast.success('Department created successfully');
            queryClient.invalidateQueries(['admin-departments']);
            setIsAddModalOpen(false);
            setNewDeptName('');
            setNewDeptDesc('');
        },
        onError: () => {
            toast.error('Failed to create department');
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

    const handleDeleteClick = (id) => {
        setDepartmentToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const deptList = Array.isArray(data) ? data : (data?.content || []);
    const totalPages = data?.totalPages || 1;

    const columns = [
        { key: 'id', title: 'ID', render: (val) => <span className="font-bold text-slate-400">#{val}</span> },
        { 
            key: 'name', 
            title: 'Department Name', 
            render: (val) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                        <Building className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-900">
                        {val || '—'}
                    </span>
                </div>
            )
        },
        { key: 'description', title: 'Description', render: (val) => <span className="text-xs font-medium text-slate-500">{val || '—'}</span> },
        { key: 'headDoctorId', title: 'Head Doctor ID', render: (val) => <span className="text-xs font-bold text-slate-700">{val ? `Dr. ID #${val}` : 'Unassigned'}</span> },
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
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600">
                        <Edit2 size={16} />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteClick(row.id)}
                    >
                        <Trash2 size={16} />
                    </Button>
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

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5 m-0">
                        <Building className="w-6 h-6 text-blue-600" />
                        Clinical Departments
                    </h2>
                    <p className="text-xs font-medium text-slate-500 m-0 mt-1">
                        Manage clinic departments, head doctors, and medical specialties.
                    </p>
                </div>
                <Button variant="primary" onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Department
                </Button>
            </div>

            {/* Department Table Card */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-2xs">
                <DataTable 
                    columns={columns} 
                    data={deptList} 
                    isLoading={isLoading} 
                />
                
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-3.5 py-1.5 font-bold border border-slate-200 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-50 transition"
                        >
                            Previous
                        </button>
                        <span className="font-semibold text-slate-500">
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="px-3.5 py-1.5 font-bold border border-slate-200 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-50 transition"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Add Department Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
                        <h3 className="text-lg font-black text-slate-900">Add New Department</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Department Name</label>
                                <input 
                                    type="text" 
                                    value={newDeptName} 
                                    onChange={e => setNewDeptName(e.target.value)}
                                    placeholder="e.g. Cardiology, Orthopedics"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                                <textarea 
                                    value={newDeptDesc} 
                                    onChange={e => setNewDeptDesc(e.target.value)}
                                    placeholder="Department description..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                            <button 
                                onClick={() => createMutation.mutate({ name: newDeptName, description: newDeptDesc, isActive: true })}
                                disabled={!newDeptName.trim() || createMutation.isPending}
                                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50"
                            >
                                {createMutation.isPending ? 'Creating...' : 'Create Department'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default DepartmentManagement;
