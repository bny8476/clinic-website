import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Search, User, UserPlus, X } from 'lucide-react';
import { fadeIn } from '../../components/ui/motion';
import { motion } from 'framer-motion';
import { Badge } from '../../components/ui/Badge';

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

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="w-full max-w-full px-2 sm:px-6 pt-6 sm:pt-8 space-y-6 font-sans">
      
      {/* Custom Header matching mockup */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-[60px] h-[60px] bg-[#EEF2FF] rounded-[16px] flex items-center justify-center shrink-0">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="6" width="18" height="14" rx="2" stroke="#2160FF" strokeWidth="2.5" />
              <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6" stroke="#2160FF" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="12" cy="11" r="2.5" stroke="#2160FF" strokeWidth="2" />
              <path d="M7 17C7 15 9.5 14 12 14C14.5 14 17 15 17 17" stroke="#2160FF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 m-0 leading-tight tracking-tight">
              Employee Directory
            </h1>
            <p className="text-[15px] text-slate-500 m-0 mt-1">
              Manage staff records linked with system user accounts.
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#2160FF] hover:bg-[#1A4CE6] text-white px-6 py-3 rounded-[12px] font-medium flex items-center gap-2 transition-all shadow-sm"
        >
          <UserPlus size={18} /> Add Employee
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sm:p-8 w-full">
        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, department, or designation..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-[#A6C8FF] rounded-[14px] text-[15px] focus:outline-none focus:ring-4 focus:ring-[#2160FF]/10 focus:border-[#2160FF] transition-all placeholder:text-slate-400 font-medium text-slate-700"
          />
        </div>

        {/* Content Area */}
        {filtered.length === 0 ? (
          <div className="border border-dashed border-[#A6C8FF] rounded-[20px] p-16 sm:p-24 flex flex-col items-center justify-center bg-[#FAFCFF]">
            {/* Custom Empty State Illustration */}
            <div className="relative w-[120px] h-[120px] mb-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#EEF2FF] rounded-full scale-[0.9]"></div>
              
              <svg width="80" height="80" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 ml-2 mt-2">
                {/* Box Back */}
                <path d="M30 45L40 70H80L90 45H30Z" fill="#A6C8FF" stroke="#2160FF" strokeWidth="5" strokeLinejoin="round" />
                
                {/* Box Front */}
                <path d="M40 70H80C82.7614 70 85 72.2386 85 75V85C85 87.7614 82.7614 90 80 90H40C37.2386 90 35 87.7614 35 85V75C35 72.2386 37.2386 70 40 70Z" fill="#2160FF" stroke="#2160FF" strokeWidth="5" strokeLinejoin="round" />
                
                {/* Cutout handle */}
                <path d="M50 70C50 75 55 78 60 78C65 78 70 75 70 70" stroke="white" strokeWidth="4" strokeLinecap="round" />

                {/* Sparkles */}
                <path d="M20 30L22 34L26 36L22 38L20 42L18 38L14 36L18 34L20 30Z" fill="#A6C8FF"/>
                <path d="M100 35L101 38L104 39L101 40L100 43L99 40L96 39L99 38L100 35Z" fill="#A6C8FF"/>
              </svg>
              
              {/* Floating User icon */}
              <div className="absolute top-0 right-0 bg-[#8C9EFF] w-10 h-10 rounded-full border-[3.5px] border-white flex items-center justify-center z-20 shadow-sm transform translate-x-2 -translate-y-2">
                <User size={18} className="text-white" />
              </div>
            </div>
            
            <h2 className="text-[24px] font-bold text-slate-900 mb-2">No employees found</h2>
            <p className="text-[15px] text-slate-500 mb-8 font-medium">There are no employee records matching your search.</p>
            <button 
              onClick={() => setSearch('')}
              className="bg-white border-2 border-[#2160FF] text-[#2160FF] px-8 py-2.5 rounded-[12px] font-bold text-[14px] flex items-center gap-2 hover:bg-[#EEF2FF] transition-colors shadow-sm"
            >
              <Search size={16} strokeWidth={2.5} /> Clear Search
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[13px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Name & Designation</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 text-[15px] block">{row.name}</span>
                      <span className="text-[13px] font-medium text-slate-500 mt-0.5 block">{row.designation}</span>
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-slate-700">{row.department}</td>
                    <td className="px-6 py-4 text-[14px] text-slate-500">{row.email}</td>
                    <td className="px-6 py-4 text-[14px] text-slate-500">{row.phone}</td>
                    <td className="px-6 py-4">
                      <Badge variant={row.status === 'ACTIVE' || !row.status ? 'success' : 'danger'}>
                        {row.status || 'ACTIVE'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
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
