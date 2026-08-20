import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';
import { fadeIn } from '../../components/ui/motion';

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
            setIsCreateModalOpen(false);
            setFormData(initialFormState);
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
            setEditingUser(null);
            setFormData(initialFormState);
        },
        onError: () => {
            toast.error('Failed to update user');
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async (userId) => {
            await axiosPrivate.patch(`/users/${userId}/toggle-status`);
        },
        onSuccess: () => {
            toast.success('User status updated');
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: () => {
            toast.error('Failed to update user status');
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
            roleNames: user.roleNames || []
        });
    };

    const handleSave = (e) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    const handleCreateSave = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
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
        if (r.includes('ADMIN')) return 'bg-blue-100 text-blue-700';
        if (r.includes('DOCTOR')) return 'bg-purple-100 text-purple-700';
        if (r.includes('NURSE')) return 'bg-green-100 text-green-700';
        if (r.includes('RECEPTION')) return 'bg-yellow-100 text-yellow-700';
        if (r.includes('LAB')) return 'bg-pink-100 text-pink-700';
        return 'bg-gray-100 text-gray-700';
    };

    const columns = [
        { 
            key: 'user', 
            title: 'User', 
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {row.avatarUrl ? (
                            <img src={row.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#2B4AFE]/10 text-[#2B4AFE] font-bold text-sm">
                                {(row.firstName?.[0] || row.name?.[0] || '').toUpperCase()}
                            </div>
                        )}
                    </div>
                    <span className="font-semibold text-gray-900">
                        {row.firstName || row.name || ''} {row.lastName || ''}
                    </span>
                </div>
            )
        },
        { key: 'email', title: 'Email' },
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
            render: (_, row) => <span className="text-gray-600">{row.department || 'Administration'}</span>
        },
        {
            key: 'enabled',
            title: 'Status',
            render: (val) => (
                <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${val !== false ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${val !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                        {val !== false ? 'Active' : 'Inactive'}
                    </span>
                </div>
            )
        },
        {
            key: 'lastLogin',
            title: 'Last Login',
            render: (_, row) => <span className="text-gray-600">{row.lastLogin || 'Never'}</span>
        },
        {
            key: 'actions',
            title: 'Actions',
            align: 'right',
            render: (_, row) => (
                <button
                    onClick={() => handleEditClick(row)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <MoreHorizontal size={20} />
                </button>
            )
        }
    ];

    return (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-white border border-gray-100 rounded-[20px] shadow-sm overflow-hidden mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:items-center justify-between gap-4 p-6 sm:p-8 border-b border-gray-100">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 m-0 flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-600" />
                        User Directory & Roles
                    </h1>
                    <p className="text-sm text-gray-500 m-0 mt-1">
                        Manage system accounts, edit user details, and toggle access permissions.
                    </p>
                </div>
                <Button 
                    variant="primary"
                    onClick={() => {
                        setFormData(initialFormState);
                        setIsCreateModalOpen(true);
                    }}
                    className="flex items-center gap-2"
                >
                    <UserPlus size={16} />
                    Create User
                </Button>
            </div>

            <div className="bg-white">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users by name, email or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                            <Users size={16} className="text-gray-400" />
                            All Roles
                            <ChevronDown size={14} className="text-gray-400 ml-1" />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                            All Status
                            <ChevronDown size={14} className="text-gray-400 ml-1" />
                        </button>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={userList}
                    isLoading={isLoading}
                    emptyTitle="No users found"
                    className="border-0 shadow-none rounded-none"
                />

                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                    <div>
                        Showing {userList.length === 0 ? 0 : page * size + 1} to {page * size + userList.length} of {data?.totalElements || userList.length} users
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-500"
                            >&lt;</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-[#2B4AFE] bg-[#2B4AFE]/10 text-[#2B4AFE] font-medium">{page + 1}</button>
                            {page + 1 < totalPages && (
                                <button 
                                    onClick={() => setPage(p => p + 1)}
                                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                                >{page + 2}</button>
                            )}
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-500"
                            >&gt;</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit User Modal */}
            <Modal
                isOpen={!!editingUser || isCreateModalOpen}
                onClose={() => { setEditingUser(null); setIsCreateModalOpen(false); setFormData(initialFormState); }}
                title={editingUser ? "Edit User Account" : "Create New User"}
            >
                <form onSubmit={editingUser ? handleSave : handleCreateSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="First Name" required id="edit-fn">
                            <input 
                                id="edit-fn"
                                type="text" 
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                className="input-field"
                                required
                            />
                        </FormField>

                        <FormField label="Last Name" id="edit-ln">
                            <input 
                                id="edit-ln"
                                type="text" 
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                className="input-field"
                            />
                        </FormField>
                    </div>

                    <FormField label="Email Address" required id="edit-email">
                        <input 
                            id="edit-email"
                            type="email" 
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="input-field"
                            required
                        />
                    </FormField>

                    {!editingUser && (
                        <FormField label="Password" required id="edit-password">
                            <input 
                                id="edit-password"
                                type="password" 
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="input-field"
                                required={!editingUser}
                            />
                        </FormField>
                    )}

                    <div className="space-y-2 pt-2">
                        <label className="block text-sm font-medium text-[var(--color-navy-700)]">
                            Assign Roles
                        </label>
                        <div className="grid grid-cols-2 gap-2 border border-[var(--color-border)] rounded-md p-3 max-h-48 overflow-y-auto bg-[var(--color-surface)]">
                            {availableRoles.map(role => (
                                <label key={role} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-[var(--color-background)] rounded">
                                    <input 
                                        type="checkbox"
                                        checked={(formData.roleNames || []).includes(role)}
                                        onChange={() => handleRoleToggle(role)}
                                        className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-navy-600)] focus:ring-[var(--color-navy-600)]"
                                    />
                                    <span className="text-sm text-[var(--color-text)]">
                                        {role.replace('ROLE_', '')}
                                    </span>
                                </label>
                            ))}
                            {availableRoles.length === 0 && (
                                <div className="col-span-2 text-sm text-[var(--color-text-muted)] p-2">
                                    No roles available
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="enabled"
                            checked={formData.enabled}
                            onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-navy-600)] focus:ring-[var(--color-navy-600)]"
                        />
                        <label htmlFor="enabled" className="text-sm font-medium text-[var(--color-text)] cursor-pointer">
                            Account Active
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)] mt-6">
                        <Button 
                            type="button" 
                            variant="secondary"
                            onClick={() => { setEditingUser(null); setIsCreateModalOpen(false); setFormData(initialFormState); }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit"
                            variant="primary"
                            isLoading={updateMutation.isPending || createMutation.isPending}
                        >
                            {editingUser ? 'Save Changes' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </motion.div>
    );
};

export default UserManagement;
