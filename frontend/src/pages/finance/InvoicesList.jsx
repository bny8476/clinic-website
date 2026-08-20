import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Download, FileText, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { motion } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';



function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const InvoicesList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({ amount: 0, tax: 0, status: 'UNPAID' });

  // Real patient search state
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const debouncedPatientSearch = useDebouncedValue(patientSearch, 300);

  const { data: patientResults = [], isFetching: patientSearchLoading } = useQuery({
    queryKey: ['patient-search-invoice', debouncedPatientSearch],
    queryFn: async () => {
      if (!debouncedPatientSearch.trim()) return [];
      const res = await axiosPrivate.get('/patients/search', { params: { query: debouncedPatientSearch } });
      return res.data;
    },
    enabled: debouncedPatientSearch.length >= 2,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (data) => axiosPrivate.post('/billing/invoices', data),
    onSuccess: () => {
      toast.success('Invoice created successfully');
      queryClient.invalidateQueries(['billing-invoices']);
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create invoice')
  });

  const resetForm = () => {
    setFormData({ amount: 0, tax: 0, status: 'UNPAID' });
    setSelectedPatient(null);
    setPatientSearch('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error('Please search for and select a patient.');
      return;
    }
    mutation.mutate({
      patientId: selectedPatient.id,
      description: `${selectedPatient.fullName} - Consultation`,
      dueDate: new Date().toISOString(),
      amount: formData.amount,
      taxAmount: formData.tax
    });
  };

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: async () => (await axiosPrivate.get('/billing/invoices')).data,
    staleTime: 60_000,
  });

  const columns = [
    { 
      key: 'id', 
      title: 'Invoice #', 
      render: (val) => <span className="font-bold text-[#3f6212]">{val}</span> 
    },
    { 
      key: 'patient', 
      title: 'Patient', 
      render: (val, row) => <span className="font-bold text-[var(--color-text)]">{val || row.patientName}</span> 
    },
    { 
      key: 'date', 
      title: 'Date', 
      render: (val, row) => <span className="text-[var(--color-text-muted)]">{val || row.dueDate?.split('T')[0]}</span> 
    },
    { 
      key: 'amount', 
      title: 'Amount', 
      render: (val) => <span className="font-bold text-[var(--color-text)]">₹{Number(val || 0).toLocaleString()}</span> 
    },
    {
      key: 'status',
      title: 'Status',
      render: (val) => (
        <Badge variant={val === 'PAID' ? 'success' : val === 'PARTIAL' ? 'warning' : 'danger'}>
          {val}
        </Badge>
      )
    },
    {
      key: 'actions',
      title: 'Action',
      render: (_, row) => (
        <Button 
          variant="secondary" 
          size="sm" 
          icon={Download}
          onClick={async () => {
            try {
              const res = await axiosPrivate.get(`/billing/invoices/${row.id}/pdf`, { responseType: 'blob' });
              const url = window.URL.createObjectURL(new Blob([res.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `invoice_${row.id}.pdf`);
              document.body.appendChild(link);
              link.click();
              link.remove();
            } catch (e) {
              toast.error('Failed to download PDF');
            }
          }}
        >
          PDF
        </Button>
      )
    }
  ];

  return (
    
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <FileText className="w-7 h-7 text-[var(--color-navy-800)]" />
            Invoices & Billing
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Manage patient & clinic invoices
          </p>
        </div>
        <Button 
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)} 
        >
          Create Invoice
        </Button>
      </div>

      <DataTable 
        columns={columns}
        data={invoices}
        isLoading={isLoading}
        emptyTitle="No invoices found"
        emptyDescription="There are no billing records matching your search."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title="Create Invoice"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Patient" required>
            {selectedPatient ? (
              <div className="flex items-center justify-between px-4 py-3 border border-[var(--color-success)] bg-[var(--color-success-bg)] rounded-xl text-sm">
                <span className="font-semibold text-[var(--color-success)]">{selectedPatient.fullName}</span>
                <button type="button" onClick={() => setSelectedPatient(null)} className="text-[var(--color-success)] hover:text-red-500 transition-colors"><X size={16} /></button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={patientSearch}
                  onChange={e => { setPatientSearch(e.target.value); setPatientDropdownOpen(true); }}
                  onFocus={() => setPatientDropdownOpen(true)}
                  placeholder="Search patient by name or UHID…"
                  className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                />
                {patientDropdownOpen && (patientResults.length > 0 || patientSearchLoading) && (
                  <div className="absolute z-10 top-full mt-2 left-0 right-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg max-h-48 overflow-y-auto overflow-hidden">
                    {patientSearchLoading && <div className="px-4 py-3 text-sm text-[var(--color-text-muted)]">Searching…</div>}
                    {patientResults.map(p => (
                      <button key={p.id} type="button"
                        className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--color-surface-alt)] flex flex-col transition-colors border-b border-[var(--color-border)] last:border-0"
                        onClick={() => { setSelectedPatient(p); setPatientDropdownOpen(false); setPatientSearch(''); }}>
                        <span className="font-bold text-[var(--color-text)]">{p.fullName}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{p.uhid}</span>
                      </button>
                    ))}
                    {!patientSearchLoading && patientResults.length === 0 && debouncedPatientSearch.length >= 2 && (
                      <div className="px-4 py-3 text-sm text-[var(--color-text-muted)]">No patients found.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </FormField>

          <FormField label="Amount" required>
            <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" />
          </FormField>
          
          <FormField label="Tax" required>
            <input required type="number" value={formData.tax} onChange={e => setFormData({...formData, tax: Number(e.target.value)})} className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" />
          </FormField>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--color-border)] mt-6">
            <Button type="button" variant="ghost" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={mutation.isPending || !selectedPatient} 
              isLoading={mutation.isPending}
            >
              Create Invoice
            </Button>
          </div>
        </form>
      </Modal>

    </motion.div>
    
  );
};

export default InvoicesList;
