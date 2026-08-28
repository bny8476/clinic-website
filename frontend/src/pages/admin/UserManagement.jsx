import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import { useState } from 'react';
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
    KeyRound
} from 'lucide-react';
import { motion } from 'framer-motion';

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

    const [editingUser, setEditingUser] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const initialFormState = { firstName: '', lastName: '', email: '', password: '', enabled: true, roleNames: [] };
    const [formData, setFormData] = useState(initialFormState);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery] = useDebounce(searchQuery, 300);

    const { data, isLoading } = useQuery({
        queryKey: ['users', page, size, debouncedQuery],
        queryFn: async () => {
            if (debouncedQuery) {
                const res = await axiosPrivate.get(`/users/search?q=${debouncedQuery}&page=${page}&size=${size}`);
                return res.data;
            } else {
                const res = await axiosPrivate.get(`/users?page=${page}&size=${size}`);
                return res.data;
            }
        }
    });

    const { data: availableRoles = [] } = useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const res = await axiosPrivate.get('/users/roles');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (newData) => {
            const res = await axiosPrivate.post(`/users`, newData);
            return res.data;
        },
        onSuccess: () => {
            toast.success('User created successfully');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            closeModal();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || err.message || 'Failed to create user');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (updatedData) => {
            const res = await axiosPrivate.put(`/users/${updatedData.id}`, updatedData);
            return res.data;
        },
        onSuccess: () => {
            toast.success('User updated successfully');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            closeModal();
        },
        onError: () => {
            toast.error('Failed to update user');
        }
    });

    const handleEditClick = (user) => {
        setEditingUser(user);
        setFormData({
            id: user.id,
            firstName: user.firstName || user.name || '',
            lastName: user.lastName || '',
            email: user.email || '',
            enabled: user.enabled !== false,
            roleNames: user.roleNames || user.roles?.map(r => typeof r === 'string' ? r : r.name) || []
        });
    };

    const closeModal = () => {
        setEditingUser(null);
        setIsCreateModalOpen(false);
        setFormData(initialFormState);
    };

    const handleSave = (e) => {
        e.preventDefault();
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

    const userList = Array.isArray(data) ? data : (data?.content || []);
    const totalPages = data?.totalPages || (data?.last ? page + 1 : page + 2);

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
        if (r.includes('ADMIN')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
        if (r.includes('DOCTOR')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
        if (r.includes('NURSE')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
        if (r.includes('RECEPTION')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
        if (r.includes('LAB')) return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300';
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    };

    const columns = [
        { 
            key: 'user', 
            title: 'User', 
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-sm text-[#2160FF]">
                        {row.avatarUrl ? (
                            <img src={row.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            (row.firstName?.[0] || row.name?.[0] || 'U').toUpperCase()
                        )}
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {row.firstName || row.name || ''} {row.lastName || ''}
                        </div>
                        <div className="text-xs text-slate-400 font-mono sm:hidden">
                            {row.email}
                        </div>
                    </div>
                </div>
            )
        },
        { 
            key: 'email', 
            title: 'Email',
            render: (val) => (
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">{val}</span>
            )
        },
        {
            key: 'roles',
            title: 'Role',
            render: (_, row) => {
                const roleName = formatRoles(row);
                return (
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleBadgeStyle(roleName)}`}>
                        {roleName}
                    </span>
                );
            }
        },
        {
            key: 'department',
            title: 'Department',
            render: (_, row) => <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">{row.department || 'Administration'}</span>
        },
        {
            key: 'enabled',
            title: 'Status',
            render: (val) => (
                <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${val !== false ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${val !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {val !== false ? 'Active' : 'Inactive'}
                    </span>
                </div>
            )
        },
        {
            key: 'lastLogin',
            title: 'Last Login',
            render: (_, row) => <span className="text-slate-500 dark:text-slate-400 text-xs">{row.lastLogin || 'Never'}</span>
        },
        {
            key: 'actions',
            title: 'Actions',
            align: 'right',
            render: (_, row) => (
                <button
                    onClick={() => handleEditClick(row)}
                    className="p-1.5 text-slate-400 hover:text-[#2160FF] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                    <MoreHorizontal size={18} />
                </button>
            )
        }
    ];

    return (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 m-0 flex items-center gap-2">
                        <Users className="w-6 h-6 text-[#2160FF]" />
                        User Directory & Roles
                    </h1>
                    <p className="text-sm text-slate-500 m-0 mt-1">
                        Manage system accounts, edit staff credentials, and configure role-based permissions.
                    </p>
                </div>
                <button 
                    onClick={() => {
                        setFormData(initialFormState);
                        setIsCreateModalOpen(true);
                    }}
                    className="bg-[#2160FF] hover:bg-[#1b52dc] text-white px-5 py-2.5 rounded-xl shadow-md font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border-0"
                    style={{ backgroundColor: '#2160FF' }}
                >
                    <UserPlus size={18} />
                    Create User
                </button>
            </div>

            {/* Table & Search Container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50 dark:bg-slate-950/30">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users by name, email or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2160FF] transition-all"
                        />
                    </div>
                </div>

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

            {/* Redesigned Enterprise Create / Edit User Modal */}
            <Modal
                isOpen={!!editingUser || isCreateModalOpen}
                onClose={closeModal}
                size="lg"
            >
                {/* Custom Modal Header */}
                <div className="-mx-6 -mt-6 px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#2160FF]/20 text-[#2160FF] border border-[#2160FF]/30 flex items-center justify-center font-bold">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-display m-0 text-white">
                                {editingUser ? "Edit User Account" : "Create New User Account"}
                            </h2>
                            <p className="text-xs text-slate-300 m-0 mt-0.5">
                                Provision credentials, personal details, and assigned security roles.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave} className="mt-6 space-y-5">
                    {/* First Name & Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                First Name <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                    placeholder="e.g. Alexander"
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF] transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Last Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    placeholder="e.g. Wright"
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF] transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email Address */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Email Address <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="email" 
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                                placeholder="alexander@clinic.com"
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF] transition-all font-mono"
                            />
                        </div>
                    </div>

                    {/* Password (Only required on creation) */}
                    {!editingUser && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Login Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="password" 
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                    placeholder="Enter a secure password..."
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF] transition-all font-mono"
                                />
                            </div>
                        </div>
                    )}

                    {/* Role Selection Grid (Interactive Chips/Pills) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Assign System Roles
                            </label>
                            <span className="text-[11px] text-slate-400 font-medium">
                                {(formData.roleNames || []).length} role(s) selected
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 max-h-52 overflow-y-auto">
                            {availableRoles.map(role => {
                                const cleanRole = role.replace('ROLE_', '');
                                const isSelected = (formData.roleNames || []).includes(role);
                                const IconComponent = ROLE_ICONS[cleanRole] || Shield;

                                return (
                                    <button
                                        type="button"
                                        key={role}
                                        onClick={() => handleRoleToggle(role)}
                                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                                            isSelected 
                                                ? 'bg-blue-50 dark:bg-blue-900/40 border-[#2160FF] text-[#2160FF] dark:text-blue-300 shadow-xs' 
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-[#2160FF] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            {isSelected ? <Check size={14} /> : <IconComponent size={14} />}
                                        </div>
                                        <span className="truncate">{cleanRole}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Account Status Switch */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
                        <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Active User Account
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Active accounts are allowed to log into the platform and access APIs.
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={formData.enabled}
                                onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
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
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="bg-[#2160FF] hover:bg-[#1b52dc] text-white px-6 py-2.5 text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 border-0 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                            style={{ backgroundColor: '#2160FF' }}
                        >
                            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingUser ? 'Save Changes' : 'Create User')}
                        </button>
                    </div>
                </form>
            </Modal>
        </motion.div>
    );
};

export default UserManagement;
