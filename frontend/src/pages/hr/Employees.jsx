import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

import { fadeIn } from '../../components/ui/motion';



/**
 * Debounce helper
 */
function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const Employees = () => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    designation: '',
    department: '',
    status: 'ACTIVE'
  });

  // Real user-select state
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const debouncedUserSearch = useDebouncedValue(userSearch, 300);

  // Fetch matching users from backend
  const { data: userResults = [], isFetching: userSearchLoading } = useQuery({
    queryKey: ['user-search', debouncedUserSearch],
    queryFn: async () => {
      if (!debouncedUserSearch.trim()) return [];
      const res = await axiosPrivate.get('/users/search', { params: { q: debouncedUserSearch } });
      return res.data;
    },
    enabled: debouncedUserSearch.length >= 1,
    staleTime: 30_000,
  });

  // Mutations
  const mutation = useMutation({
    mutationFn: async (data) => axiosPrivate.post('/hr/employees', data),
    onSuccess: () => {
      toast.success('Employee added successfully');
      queryClient.invalidateQueries(['hr-employees-list']);
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to add employee')
  });

  const resetForm = () => {
    setFormData({ designation: '', department: '', status: 'ACTIVE' });
    setSelectedUser(null);
    setUserSearch('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Please select a user account to link this employee to.');
      return;
    }
    mutation.mutate({
      userId: selectedUser.id,
      department: formData.department,
      designation: formData.designation,
      employmentType: 'FULL_TIME',
      dateOfJoining: new Date().toISOString().split('T')[0],
      salary: 0,
      isActive: formData.status === 'ACTIVE'
    });
  };

  // Employee list query
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['hr-employees-list'],
    queryFn: async () => (await axiosPrivate.get('/hr/employees')).data,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    return employees.filter(e =>
      !search ||
      (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.department || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [employees, search]);

  const columns = [
    {
      key: 'name',
      title: 'Name & Designation',
      render: (_, row) => (
        <div>
          <span className="font-bold text-[var(--color-text)] block">{row.name}</span>
          <span className="text-xs text-[var(--color-text-muted)]">{row.designation}</span>
        </div>
      )
    },
    { key: 'department', title: 'Department' },
    { key: 'email', title: 'Email', render: (val) => <span className="text-[var(--color-text-muted)]">{val}</span> },
    { key: 'phone', title: 'Phone', render: (val) => <span className="text-[var(--color-text-muted)]">{val}</span> },
    {
      key: 'status',
      title: 'Status',
      render: (val) => (
        <Badge variant={val === 'ACTIVE' || !val ? 'success' : 'danger'}>
          {val || 'ACTIVE'}
        </Badge>
      )
    }
  ];

  return (
    
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-[var(--color-navy-800)]" />
            Employee Directory
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Manage staff records linked with system user accounts
          </p>
        </div>
        <Button variant="primary" icon={UserPlus} onClick={() => setIsModalOpen(true)}>
          Add Employee
        </Button>
      </div>

      <DataTable 
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        searchPlaceholder="Filter by name or department…"
        searchQuery={search}
        onSearchChange={setSearch}
        emptyTitle="No employees found"
        emptyDescription="There are no employee records matching your search."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title="Add Employee"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Link System User Account" required>
            {selectedUser ? (
              <div className="flex items-center justify-between px-4 py-3 border border-[var(--color-success)] bg-[var(--color-success-bg)] rounded-xl text-sm">
                <span className="font-semibold text-[var(--color-success)]">{selectedUser.firstName} {selectedUser.lastName} — {selectedUser.email}</span>
                <button type="button" onClick={() => setSelectedUser(null)} className="text-[var(--color-success)] hover:text-red-500 transition-colors"><X size={16} /></button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={userSearch}
                  onChange={e => { setUserSearch(e.target.value); setUserDropdownOpen(true); }}
                  onFocus={() => setUserDropdownOpen(true)}
                  placeholder="Search by name or email…"
                  className="input-field"
                />
                {userDropdownOpen && (userResults.length > 0 || userSearchLoading) && (
                  <div className="absolute z-10 top-full mt-2 left-0 right-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg max-h-48 overflow-y-auto overflow-hidden">
                    {userSearchLoading && <div className="px-4 py-3 text-sm text-[var(--color-text-muted)]">Searching…</div>}
                    {userResults.map(u => (
                      <button key={u.id} type="button"
                        className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--color-surface-alt)] flex flex-col transition-colors border-b border-[var(--color-border)] last:border-0"
                        onClick={() => { setSelectedUser(u); setUserDropdownOpen(false); setUserSearch(''); }}>
                        <span className="font-bold text-[var(--color-text)]">{u.firstName} {u.lastName}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{u.email}</span>
                      </button>
                    ))}
                    {!userSearchLoading && userResults.length === 0 && debouncedUserSearch.length >= 1 && (
                      <div className="px-4 py-3 text-sm text-[var(--color-text-muted)]">No matching users found.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </FormField>

          <FormField label="Designation" required>
            <input required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="input-field" placeholder="e.g. Senior Nurse" />
          </FormField>
          
          <FormField label="Department" required>
            <input required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="input-field" placeholder="e.g. Cardiology" />
          </FormField>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--color-border)] mt-6">
            <Button type="button" variant="ghost" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={mutation.isPending} disabled={!selectedUser}>
              Add Employee
            </Button>
          </div>
        </form>
      </Modal>

    </motion.div>
    
  );
};

export default Employees;
