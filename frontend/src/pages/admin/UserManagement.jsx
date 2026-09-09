import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { axiosPrivate } from '../../api/axios';
import { fadeIn } from '../../components/ui/motion';
import { 
    ChevronDown, 
    MoreHorizontal, 
    Search, 
    User, 
    UserPlus, 
    Users, 
    Mail, 
    Lock, 
    Shield, 
    Stethoscope, 
    HeartPulse, 
    Pill, 
    FlaskConical, 
    Check, 
    CheckCircle2, 
    XCircle,
    Building2,
    KeyRound,
    Eye,
    Filter,
    RotateCcw,
    Activity,
    Phone,
    Briefcase,
    Building,
    Calendar,
    Award,
    DollarSign,
    Sparkles,
    FileText,
    Power,
    Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_ICONS = {
    ADMIN: Shield,
    SUPER_ADMIN: Shield,
    DOCTOR: Stethoscope,
    NURSE: HeartPulse,
    PHARMACIST: Pill,
    LAB: FlaskConical,
    LAB_TECH: FlaskConical,
    PATIENT: User,
    RECEPTIONIST: Building2
};

const UserManagement = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [size] = useState(10);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery] = useDebounce(searchQuery, 300);
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);
    const [resetPasswordUser, setResetPasswordUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [activeStep, setActiveStep] = useState(1);

    // Form state
    const initialFormState = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        enabled: true,
        roleNames: [],
        branchId: '',
        departmentId: '',
        specialty: 'General Medicine',
        qualifications: 'MBBS',
        consultationFee: 500,
        registrationNumber: '',
        experienceYears: 5
    };
    const [formData, setFormData] = useState(initialFormState);

    // Fetch Stats
    const { data: stats } = useQuery({
        queryKey: ['userStats'],
        queryFn: async () => {
            const res = await axiosPrivate.get('/users/stats');
            return res.data;
        }
    });

    // Fetch Users (Filtered + Paginated)
    const { data: usersData, isLoading } = useQuery({
        queryKey: ['users', page, size, debouncedQuery, selectedRole, selectedBranch, selectedDepartment, selectedStatus],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('size', size);
            if (debouncedQuery) params.append('q', debouncedQuery);
            if (selectedRole) params.append('role', selectedRole);
            if (selectedBranch) params.append('branchId', selectedBranch);
            if (selectedDepartment) params.append('departmentId', selectedDepartment);
            if (selectedStatus !== '') params.append('status', selectedStatus);

            const res = await axiosPrivate.get(`/users?${params.toString()}`);
            return res.data;
        }
    });

    // Fetch Available Roles
    const { data: availableRoles = [] } = useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const res = await axiosPrivate.get('/users/roles');
            return res.data;
        }
    });

    // Fetch Branches
    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await axiosPrivate.get('/branches');
            return Array.isArray(res.data) ? res.data : (res.data?.content || []);
        }
    });

    // Fetch Departments
    const { data: departmentsData } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const res = await axiosPrivate.get('/departments?size=100');
            return Array.isArray(res.data) ? res.data : (res.data?.content || []);
        }
    });
    const departments = Array.isArray(departmentsData) ? departmentsData : [];

    // Create User Mutation
    const createMutation = useMutation({
        mutationFn: async (newData) => {
            const payload = {
                ...newData,
                branchId: newData.branchId ? Number(newData.branchId) : null,
                departmentId: newData.departmentId ? Number(newData.departmentId) : null,
                consultationFee: newData.consultationFee ? Number(newData.consultationFee) : null,
                experienceYears: newData.experienceYears ? Number(newData.experienceYears) : null
            };
            const res = await axiosPrivate.post(`/users`, payload);
            return res.data;
        },
        onSuccess: () => {
            toast.success('User created successfully');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['userStats'] });
            closeModal();
        },
        onError: (err) => {
            const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create user';
            toast.error(msg);
        }
    });

    // Update User Mutation
    const updateMutation = useMutation({
        mutationFn: async (updatedData) => {
            const payload = {
                ...updatedData,
                branchId: updatedData.branchId ? Number(updatedData.branchId) : null,
                departmentId: updatedData.departmentId ? Number(updatedData.departmentId) : null
            };
            const res = await axiosPrivate.put(`/users/${updatedData.id}`, payload);
            return res.data;
        },
        onSuccess: () => {
            toast.success('User updated successfully');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['userStats'] });
            closeModal();
        },
        onError: (err) => {
            const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update user';
            toast.error(msg);
        }
    });

    // Toggle Status Mutation
    const toggleStatusMutation = useMutation({
        mutationFn: async (id) => {
            await axiosPrivate.patch(`/users/${id}/toggle-status`);
        },
        onSuccess: () => {
            toast.success('User status updated');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['userStats'] });
        },
        onError: (err) => {
            const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update user status';
            toast.error(msg);
        }
    });

    // Reset Password Mutation
    const resetPasswordMutation = useMutation({
        mutationFn: async ({ id, newPassword }) => {
            await axiosPrivate.post(`/users/${id}/reset-password`, { newPassword });
        },
        onSuccess: () => {
            toast.success('Password reset successfully');
            setResetPasswordUser(null);
            setNewPassword('');
        },
        onError: (err) => {
            const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to reset password';
            toast.error(msg);
        }
    });

    const handleEditClick = (user) => {
        setEditingUser(user);
        setFormData({
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            enabled: user.enabled !== false,
            roleNames: user.roleNames || [],
            branchId: user.branchId || '',
            departmentId: user.departmentId || ''
        });
        setActiveStep(1);
    };

    const closeModal = () => {
        setEditingUser(null);
        setIsCreateModalOpen(false);
        setViewingUser(null);
        setFormData(initialFormState);
        setActiveStep(1);
    };

    const handleSave = (e) => {
        e?.preventDefault();
        if (editingUser) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleRoleToggle = (roleName) => {
        setFormData(prev => {
            const roles = prev.roleNames || [];
            if (roles.includes(roleName)) {
                return { ...prev, roleNames: roles.filter(r => r !== roleName) };
            } else {
                return { ...prev, roleNames: [...roles, roleName] };
            }
        });
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedRole('');
        setSelectedBranch('');
        setSelectedDepartment('');
        setSelectedStatus('');
        setPage(0);
    };

    const userList = Array.isArray(usersData) ? usersData : (usersData?.content || []);
    const totalPages = usersData?.totalPages || 1;

    const formatRoles = (user) => {
        if (!user || (!user.roles && !user.roleNames)) return 'USER';
        const roles = user.roles || user.roleNames;
        if (Array.isArray(roles)) {
            return roles.map(r => {
                if (typeof r === 'string') return r.replace('ROLE_', '');
                if (r && typeof r === 'object' && r.name) return r.name.replace('ROLE_', '');
                return String(r);
            }).join(', ');
        }
        if (typeof roles === 'string') return roles.replace('ROLE_', '');
        return 'USER';
    };

    const getRoleBadgeStyle = (role) => {
        const r = role?.toUpperCase() || '';
        if (r.includes('SUPER_ADMIN')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200';
        if (r.includes('ADMIN')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200';
        if (r.includes('DOCTOR')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200';
        if (r.includes('NURSE')) return 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200';
        if (r.includes('RECEPTION')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200';
        if (r.includes('LAB')) return 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border border-pink-200';
        if (r.includes('PHARMACIST')) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200';
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200';
    };

    const isDoctorSelected = (formData.roleNames || []).some(r => r.toUpperCase().includes('DOCTOR'));

    const columns = [
        { 
            key: 'user', 
            title: 'User Profile', 
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-sm text-[#2160FF]">
                        {(row.firstName?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                            {row.firstName} {row.lastName}
                            <span className="text-[10px] text-slate-400 font-mono font-normal">#{row.id}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                            {row.email}
                        </div>
                    </div>
                </div>
            )
        },
        { 
            key: 'phone', 
            title: 'Phone',
            render: (val) => (
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">{val || 'N/A'}</span>
            )
        },
        {
            key: 'roles',
            title: 'Role',
            render: (_, row) => {
                const roleName = formatRoles(row);
                return (
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getRoleBadgeStyle(roleName)}`}>
                        {roleName}
                    </span>
                );
            }
        },
        {
            key: 'branchName',
            title: 'Branch / Dept',
            render: (_, row) => (
                <div className="text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {row.branchName || 'All Branches'}
                    </div>
                    <div className="text-slate-400">
                        {row.departmentName || 'General Administration'}
                    </div>
                </div>
            )
        },
        {
            key: 'enabled',
            title: 'Account Status',
            render: (val, row) => (
                <button
                    onClick={() => toggleStatusMutation.mutate(row.id)}
                    disabled={toggleStatusMutation.isPending}
                    className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 border transition-all cursor-pointer ${
                        val !== false 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100'
                    }`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full ${val !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {val !== false ? 'Active' : 'Inactive'}
                </button>
            )
        },
        {
            key: 'lastLogin',
            title: 'Last Login',
            render: (_, row) => (
                <span className="text-slate-500 dark:text-slate-400 text-xs">
                    {row.lastLogin ? new Date(row.lastLogin).toLocaleDateString() : 'Never'}
                </span>
            )
        },
        {
            key: 'actions',
            title: 'Actions',
            align: 'right',
            render: (_, row) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => setViewingUser(row)}
                        title="View Details"
                        className="p-1.5 text-slate-400 hover:text-[#2160FF] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={() => handleEditClick(row)}
                        title="Edit User"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors cursor-pointer"
                    >
                        <Edit3 size={16} />
                    </button>
                    <button
                        onClick={() => {
                            setResetPasswordUser(row);
                            setNewPassword('');
                        }}
                        title="Reset Password"
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors cursor-pointer"
                    >
                        <KeyRound size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 m-0 flex items-center gap-2 font-display">
                        <Users className="w-7 h-7 text-[#2160FF]" />
                        User & Access Management
                    </h1>
                    <p className="text-sm text-slate-500 m-0 mt-1">
                        Provision accounts, manage role permissions, and control branch access across the healthcare platform.
                    </p>
                </div>
                <button 
                    onClick={() => {
                        setFormData(initialFormState);
                        setIsCreateModalOpen(true);
                        setActiveStep(1);
                    }}
                    className="bg-[#2160FF] hover:bg-[#1b52dc] text-white px-5 py-2.5 rounded-xl shadow-md font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border-0"
                    style={{ backgroundColor: '#2160FF' }}
                >
                    <UserPlus size={18} />
                    Add New User
                </button>
            </div>

            {/* Real Backend Statistics Header Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="text-xs font-semibold text-slate-500">Total Users</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats?.totalUsers ?? '-'}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="text-xs font-semibold text-emerald-600">Active</div>
                    <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{stats?.activeUsers ?? '-'}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="text-xs font-semibold text-rose-500">Inactive</div>
                    <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats?.inactiveUsers ?? '-'}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="text-xs font-semibold text-purple-600">Doctors</div>
                    <div className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-1">{stats?.doctorsCount ?? '-'}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="text-xs font-semibold text-teal-600">Nurses</div>
                    <div className="text-xl font-bold text-teal-700 dark:text-teal-400 mt-1">{stats?.nursesCount ?? '-'}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="text-xs font-semibold text-indigo-600">Pharmacists</div>
                    <div className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">{stats?.pharmacistsCount ?? '-'}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="text-xs font-semibold text-pink-600">Lab Staff</div>
                    <div className="text-xl font-bold text-pink-700 dark:text-pink-400 mt-1">{stats?.labStaffCount ?? '-'}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="text-xs font-semibold text-amber-600">Receptionists</div>
                    <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">{stats?.receptionistsCount ?? '-'}</div>
                </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                        />
                    </div>

                    {/* Role Filter */}
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                    >
                        <option value="">All Roles</option>
                        {availableRoles.map(role => (
                            <option key={role} value={role}>{role.replace('ROLE_', '')}</option>
                        ))}
                    </select>

                    {/* Branch Filter */}
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                    >
                        <option value="">All Branches</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    {/* Department Filter */}
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                        >
                            <option value="">All Statuses</option>
                            <option value="true">Active Only</option>
                            <option value="false">Inactive Only</option>
                        </select>

                        {(searchQuery || selectedRole || selectedBranch || selectedDepartment || selectedStatus !== '') && (
                            <button
                                onClick={resetFilters}
                                title="Reset Filters"
                                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all cursor-pointer flex-shrink-0"
                            >
                                <RotateCcw size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xs overflow-hidden">
                <DataTable
                    columns={columns}
                    data={userList}
                    isLoading={isLoading}
                    emptyTitle="No users found in directory"
                />

                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30 text-xs">
                        <button 
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-3.5 py-1.5 font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
                        >
                            Previous
                        </button>
                        <span className="font-semibold text-slate-500">
                            Page {page + 1} of {totalPages}
                        </span>
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="px-3.5 py-1.5 font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Step-by-Step Add / Edit User Modal */}
            <Modal
                isOpen={!!editingUser || isCreateModalOpen}
                onClose={closeModal}
                size="lg"
            >
                {/* Modal Header */}
                <div className="-mx-6 -mt-6 px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#2160FF]/20 text-[#2160FF] border border-[#2160FF]/30 flex items-center justify-center font-bold">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-display m-0 text-white">
                                {editingUser ? "Edit User Account" : "Add New User Account"}
                            </h2>
                            <p className="text-xs text-slate-300 m-0 mt-0.5">
                                Step {activeStep} of {isDoctorSelected ? 4 : 3}: Account, Roles & Branch Scope
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 py-3 mb-4">
                    <button
                        onClick={() => setActiveStep(1)}
                        className={`flex items-center gap-2 text-xs font-bold transition-colors border-0 bg-transparent cursor-pointer ${activeStep === 1 ? 'text-[#2160FF]' : 'text-slate-400'}`}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${activeStep === 1 ? 'bg-[#2160FF] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>1</div>
                        Account Info
                    </button>
                    <div className="h-0.5 flex-1 bg-slate-100 dark:bg-slate-800 mx-2" />
                    <button
                        onClick={() => setActiveStep(2)}
                        className={`flex items-center gap-2 text-xs font-bold transition-colors border-0 bg-transparent cursor-pointer ${activeStep === 2 ? 'text-[#2160FF]' : 'text-slate-400'}`}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${activeStep === 2 ? 'bg-[#2160FF] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>2</div>
                        Role & Branch
                    </button>

                    {isDoctorSelected && (
                        <>
                            <div className="h-0.5 flex-1 bg-slate-100 dark:bg-slate-800 mx-2" />
                            <button
                                onClick={() => setActiveStep(3)}
                                className={`flex items-center gap-2 text-xs font-bold transition-colors border-0 bg-transparent cursor-pointer ${activeStep === 3 ? 'text-[#2160FF]' : 'text-slate-400'}`}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${activeStep === 3 ? 'bg-[#2160FF] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>3</div>
                                Doctor Profile
                            </button>
                        </>
                    )}

                    <div className="h-0.5 flex-1 bg-slate-100 dark:bg-slate-800 mx-2" />
                    <button
                        onClick={() => setActiveStep(isDoctorSelected ? 4 : 3)}
                        className={`flex items-center gap-2 text-xs font-bold transition-colors border-0 bg-transparent cursor-pointer ${activeStep === (isDoctorSelected ? 4 : 3) ? 'text-[#2160FF]' : 'text-slate-400'}`}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${activeStep === (isDoctorSelected ? 4 : 3) ? 'bg-[#2160FF] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            {isDoctorSelected ? 4 : 3}
                        </div>
                        Review
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    {/* STEP 1: ACCOUNT INFORMATION */}
                    {activeStep === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        First Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        required
                                        placeholder="e.g. Alexander"
                                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Last Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        required
                                        placeholder="e.g. Wright"
                                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Email Address <span className="text-rose-500">*</span>
                                    </label>
                                    <input 
                                        type="email" 
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        placeholder="alexander@clinic.com"
                                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Phone Number
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+1 555-0192"
                                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                                    />
                                </div>
                            </div>

                            {!editingUser && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Password <span className="text-rose-500">*</span>
                                    </label>
                                    <input 
                                        type="password" 
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingUser}
                                        minLength={8}
                                        placeholder="At least 8 characters..."
                                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                                    />
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveStep(2)}
                                    className="w-full bg-[#2160FF] text-white py-2.5 rounded-xl font-bold text-xs hover:bg-[#1b52dc] transition cursor-pointer"
                                >
                                    Continue to Role & Scope →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: ROLE & SCOPE */}
                    {activeStep === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    System Roles <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 max-h-48 overflow-y-auto">
                                    {availableRoles.map(role => {
                                        const cleanRole = role.replace('ROLE_', '');
                                        const isSelected = (formData.roleNames || []).includes(role);
                                        const IconComponent = ROLE_ICONS[cleanRole] || Shield;

                                        return (
                                            <button
                                                type="button"
                                                key={role}
                                                onClick={() => handleRoleToggle(role)}
                                                className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                                                    isSelected 
                                                        ? 'bg-blue-50 dark:bg-blue-900/40 border-[#2160FF] text-[#2160FF] dark:text-blue-300' 
                                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-[#2160FF] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                    {isSelected ? <Check size={12} /> : <IconComponent size={12} />}
                                                </div>
                                                <span className="truncate">{cleanRole}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Assigned Branch
                                    </label>
                                    <select
                                        value={formData.branchId}
                                        onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Department
                                    </label>
                                    <select
                                        value={formData.departmentId}
                                        onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveStep(1)}
                                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 border-0 bg-transparent cursor-pointer"
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveStep(isDoctorSelected ? 3 : (isDoctorSelected ? 4 : 3))}
                                    className="bg-[#2160FF] text-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-[#1b52dc] transition cursor-pointer"
                                >
                                    {isDoctorSelected ? 'Doctor Profile Details →' : 'Review & Submit →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: DOCTOR PROFILE (Only if Doctor role selected) */}
                    {activeStep === 3 && isDoctorSelected && (
                        <div className="space-y-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-purple-800 dark:text-purple-300 rounded-xl text-xs flex items-center gap-2">
                                <Stethoscope size={16} />
                                Doctor Role Detected: Provision clinical practitioner profile details below.
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Medical Specialty
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.specialty}
                                        onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                                        placeholder="General Medicine"
                                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        License / Registration #
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.registrationNumber}
                                        onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                                        placeholder="MCI-19283"
                                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Consultation Fee ($/₹)
                                    </label>
                                    <input 
                                        type="number" 
                                        value={formData.consultationFee}
                                        onChange={e => setFormData({ ...formData, consultationFee: e.target.value })}
                                        placeholder="500"
                                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Qualifications
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.qualifications}
                                        onChange={e => setFormData({ ...formData, qualifications: e.target.value })}
                                        placeholder="MBBS, MD"
                                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveStep(2)}
                                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 border-0 bg-transparent cursor-pointer"
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveStep(4)}
                                    className="bg-[#2160FF] text-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-[#1b52dc] transition cursor-pointer"
                                >
                                    Review Summary →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP REVIEW / SUBMIT */}
                    {activeStep === (isDoctorSelected ? 4 : 3) && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-3 text-xs">
                                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                                    User Provisioning Review
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div><span className="text-slate-400">Full Name:</span> <strong className="text-slate-800 dark:text-slate-200">{formData.firstName} {formData.lastName}</strong></div>
                                    <div><span className="text-slate-400">Email:</span> <strong className="font-mono text-slate-800 dark:text-slate-200">{formData.email}</strong></div>
                                    <div><span className="text-slate-400">Phone:</span> <strong className="font-mono text-slate-800 dark:text-slate-200">{formData.phone || 'N/A'}</strong></div>
                                    <div><span className="text-slate-400">Roles:</span> <strong className="text-blue-600">{(formData.roleNames || []).join(', ') || 'ROLE_PATIENT'}</strong></div>
                                    <div><span className="text-slate-400">Branch:</span> <strong className="text-slate-800 dark:text-slate-200">{branches.find(b => String(b.id) === String(formData.branchId))?.name || 'All Branches'}</strong></div>
                                    <div><span className="text-slate-400">Department:</span> <strong className="text-slate-800 dark:text-slate-200">{departments.find(d => String(d.id) === String(formData.departmentId))?.name || 'General'}</strong></div>
                                </div>

                                {isDoctorSelected && (
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-purple-700 dark:text-purple-300">
                                        Doctor Profile: {formData.specialty} ({formData.qualifications}) Fee: ${formData.consultationFee}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveStep(isDoctorSelected ? 3 : 2)}
                                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 border-0 bg-transparent cursor-pointer"
                                >
                                    ← Back
                                </button>
                                <button 
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="bg-[#2160FF] hover:bg-[#1b52dc] text-white px-6 py-2.5 text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 border-0 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                                    style={{ backgroundColor: '#2160FF' }}
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingUser ? 'Save User Changes' : 'Confirm & Create User')}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </Modal>

            {/* View Details Modal */}
            <Modal
                isOpen={!!viewingUser}
                onClose={() => setViewingUser(null)}
                size="md"
            >
                {viewingUser && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#2160FF]/10 text-[#2160FF] font-bold text-lg flex items-center justify-center">
                                {(viewingUser.firstName?.[0] || 'U').toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 m-0">
                                    {viewingUser.firstName} {viewingUser.lastName}
                                </h3>
                                <p className="text-xs text-slate-500 font-mono m-0">ID: #{viewingUser.id} | {viewingUser.email}</p>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500">Phone:</span>
                                <span className="font-mono text-slate-800 dark:text-slate-200">{viewingUser.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500">Assigned Branch:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{viewingUser.branchName || 'All Branches'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500">Department:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{viewingUser.departmentName || 'General Administration'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500">Account Status:</span>
                                <span className={`font-bold ${viewingUser.enabled !== false ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {viewingUser.enabled !== false ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500">Last Login:</span>
                                <span className="text-slate-800 dark:text-slate-200">
                                    {viewingUser.lastLogin ? new Date(viewingUser.lastLogin).toLocaleString() : 'Never'}
                                </span>
                            </div>
                        </div>

                        {viewingUser.permissions && viewingUser.permissions.length > 0 && (
                            <div className="pt-2">
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Granted Authorities & Permissions ({viewingUser.permissions.length}):
                                </div>
                                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                                    {viewingUser.permissions.map(p => (
                                        <span key={p} className="px-2 py-0.5 text-[10px] font-mono bg-blue-100 text-blue-800 rounded">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-3">
                            <button
                                onClick={() => setViewingUser(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Reset Password Modal */}
            <Modal
                isOpen={!!resetPasswordUser}
                onClose={() => setResetPasswordUser(null)}
                size="sm"
            >
                {resetPasswordUser && (
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            resetPasswordMutation.mutate({ id: resetPasswordUser.id, newPassword });
                        }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                                <KeyRound size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0">
                                    Reset Password
                                </h3>
                                <p className="text-xs text-slate-500 m-0">For {resetPasswordUser.firstName} ({resetPasswordUser.email})</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                New Temporary Password <span className="text-rose-500">*</span>
                            </label>
                            <input 
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                                placeholder="Min 8 characters..."
                                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#2160FF]"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setResetPasswordUser(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 border-0 bg-transparent cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={resetPasswordMutation.isPending}
                                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow transition cursor-pointer border-0"
                            >
                                {resetPasswordMutation.isPending ? 'Resetting...' : 'Set New Password'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </motion.div>
    );
};

export default UserManagement;
