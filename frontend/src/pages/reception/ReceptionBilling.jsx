import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Plus, ArrowLeft, Receipt, Search, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';
import { useDebounce } from 'use-debounce';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';



const ReceptionBilling = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [newInvoice, setNewInvoice] = useState({ description: '', dueDate: '', items: [{ description: '', unitPrice: 0, quantity: 1 }] });
  const [isCreating, setIsCreating] = useState(false);

  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['patient-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const res = await axiosPrivate.get(`/patients/search?query=${encodeURIComponent(debouncedQuery)}`);
      return res.data;
    },
    enabled: debouncedQuery.length >= 2 && !selectedPatient,
  });

  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['patient-invoices', selectedPatient?.id],
    queryFn: async () => {
      if (!selectedPatient) return [];
      const res = await axiosPrivate.get(`/billing/patient/${selectedPatient.id}`);
      return res.data;
    },
    enabled: !!selectedPatient,
  });

  const createInvoice = useMutation({
    mutationFn: async (data) => {
      const payload = {
        patientId: selectedPatient.id,
        description: data.description,
        dueDate: data.dueDate ? data.dueDate + 'T23:59:59' : new Date().toISOString(),
        items: data.items
      };
      // The backend expects InvoiceRequest with items or without. If it fails, we might need to send items separately.
      // Assuming InvoiceRequest accepts items per the DTO:
      const res = await axiosPrivate.post('/billing/invoices', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Invoice created successfully');
      setIsCreating(false);
      setNewInvoice({ description: '', dueDate: '', items: [{ description: '', unitPrice: 0, quantity: 1 }] });
      queryClient.invalidateQueries({ queryKey: ['patient-invoices', selectedPatient?.id] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    }
  });

  const handleDownloadPdf = async (id) => {
    try {
      const res = await axiosPrivate.get(`/billing/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download PDF');
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newInvoice.description) {
      toast.error('Invoice description is required');
      return;
    }
    createInvoice.mutate(newInvoice);
  };

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-5xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/reception" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reception Desk
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-[var(--color-navy-800)]" />
            Billing & Invoicing
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Create invoices and manage front-desk payments for patients.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
      {!selectedPatient ? (
        <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
        <Card>
          <Card.Header>
            <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Select Patient</h2>
          </Card.Header>
          <Card.Body>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search patient to bill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-500)] transition-shadow"
                autoFocus
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isSearching && <p className="text-sm text-[var(--color-text-muted)]">Searching...</p>}
              {searchResults.map(p => (
                <div 
                  key={p.id} 
                  className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] cursor-pointer hover:shadow-md transition-all"
                  onClick={() => { setSelectedPatient(p); setSearchQuery(''); }}
                >
                  <p className="font-bold text-[var(--color-navy-900)]">{p.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">ID: {p.id} • {p.phone}</p>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
        </motion.div>
      ) : (
        <motion.div key="billing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-[var(--color-navy-50)] border border-[var(--color-navy-200)] rounded-xl">
            <div>
              <p className="text-xs font-bold text-[var(--color-navy-600)] uppercase tracking-wider mb-1">Selected Patient</p>
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">{selectedPatient.name}</h2>
              <p className="text-sm text-[var(--color-navy-700)]">ID: {selectedPatient.id} • {selectedPatient.phone}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setSelectedPatient(null); setIsCreating(false); }}>
              Change Patient
            </Button>
          </div>

          {!isCreating ? (
            <Card>
              <Card.Header className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Invoices</h2>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsCreating(true)}>
                  New Invoice
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                {isLoadingInvoices ? (
                  <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading invoices...</div>
                ) : invoices.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">No invoices found for this patient.</div>
                ) : (
                  <ul className="divide-y divide-[var(--color-border)]">
                    {invoices.map(inv => (
                      <li key={inv.id} className="p-4 flex items-center justify-between hover:bg-[var(--color-surface-alt)]">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-[var(--color-navy-900)] text-sm">
                              {inv.description || 'Consultation / Service'}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                              #{inv.invoiceNumber} • {new Date(inv.issueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-[var(--color-navy-900)]">${inv.totalAmount?.toFixed(2)}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {inv.status}
                            </span>
                          </div>
                          <button onClick={() => handleDownloadPdf(inv.id)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            <Download size={18} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Header>
                <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Create New Invoice</h2>
              </Card.Header>
              <Card.Body>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Description" required id="description">
                      <input 
                        id="description"
                        type="text"
                        value={newInvoice.description} 
                        onChange={e => setNewInvoice({ ...newInvoice, description: e.target.value })} 
                        placeholder="e.g. OP Consultation" 
                        className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" 
                        required
                      />
                    </FormField>
                    <FormField label="Due Date" id="dueDate">
                      <input 
                        id="dueDate"
                        type="date"
                        value={newInvoice.dueDate} 
                        onChange={e => setNewInvoice({ ...newInvoice, dueDate: e.target.value })} 
                        className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" 
                      />
                    </FormField>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-[var(--color-navy-800)]">Invoice Items</h3>
                    {newInvoice.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder="Item description" 
                            value={item.description}
                            onChange={e => {
                              const newItems = [...newInvoice.items];
                              newItems[idx].description = e.target.value;
                              setNewInvoice({ ...newInvoice, items: newItems });
                            }}
                            className="input-field py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                            required
                          />
                        </div>
                        <div className="w-24">
                          <input 
                            type="number" 
                            placeholder="Qty" 
                            value={item.quantity}
                            onChange={e => {
                              const newItems = [...newInvoice.items];
                              newItems[idx].quantity = Number(e.target.value);
                              setNewInvoice({ ...newInvoice, items: newItems });
                            }}
                            className="input-field py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                            required min="1"
                          />
                        </div>
                        <div className="w-32">
                          <input 
                            type="number" 
                            placeholder="Unit Price" 
                            value={item.unitPrice}
                            onChange={e => {
                              const newItems = [...newInvoice.items];
                              newItems[idx].unitPrice = Number(e.target.value);
                              setNewInvoice({ ...newInvoice, items: newItems });
                            }}
                            className="input-field py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                            required min="0" step="0.01"
                          />
                        </div>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => setNewInvoice({ ...newInvoice, items: [...newInvoice.items, { description: '', unitPrice: 0, quantity: 1 }] })}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
                    <Button variant="secondary" onClick={() => setIsCreating(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={createInvoice.isPending}>
                      Save Invoice
                    </Button>
                  </div>
                </form>
              </Card.Body>
            </Card>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
    
  );
};

export default ReceptionBilling;
