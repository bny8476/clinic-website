import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Search, FileText, Plus, Download, Users, Receipt, Info, SlidersHorizontal, User, UserCheck } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';

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
      const res = await axiosPrivate.get(`/reception/patients/search?query=${encodeURIComponent(debouncedQuery)}`);
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

  const inputClass = "w-full bg-white text-[15px] text-gray-700 font-medium rounded-xl border border-gray-200 focus:border-[#2864FF] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none py-3.5 px-4";
  const labelClass = "block text-sm font-bold text-slate-800 mb-2";

  return (
    <div className="min-h-full bg-[#F4F7FB] p-6 lg:p-10 w-full font-sans">
      <div className="max-w-[1000px] mx-auto space-y-6">
        
        {/* Top Header Banner */}
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 p-8 lg:p-10">
          {/* Subtle background waves */}
          <div className="absolute bottom-0 left-0 right-0 h-32 opacity-30 pointer-events-none">
            <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,0 C300,120 700,0 1000,120 L1000,120 L0,120 Z" fill="#EBF0FF" />
              <path d="M0,120 C300,50 700,150 1000,50 L1000,120 L0,120 Z" fill="#D6E4FF" opacity="0.6" />
            </svg>
          </div>
          {/* Decorative Dots */}
          <div className="absolute top-10 right-1/4 grid grid-cols-4 gap-2 opacity-20">
            {Array.from({length: 16}).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#2864FF]"></div>
            ))}
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex flex-col gap-6">

              
              <div className="flex items-start gap-5">
                <div className="p-4 bg-[#2864FF] rounded-2xl flex-shrink-0 shadow-lg shadow-blue-500/30">
                  <Receipt className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <div className="pt-1">
                  <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Billing & Invoicing</h1>
                  <p className="text-[15px] text-gray-500 font-medium">Create invoices and manage front-desk payments for patients.</p>
                </div>
              </div>
            </div>

            {/* 3D Document Icon Graphic */}
            <div className="hidden sm:flex items-center justify-center shrink-0">
               <div className="relative w-24 h-28 bg-white rounded-xl shadow-xl shadow-blue-500/10 border border-gray-100 flex items-center justify-center -rotate-3 overflow-hidden">
                 {/* Folded Corner */}
                 <div className="absolute top-0 right-0 w-8 h-8 bg-blue-50 rounded-bl-xl border-b border-l border-gray-100"></div>
                 {/* Dollar Sign */}
                 <div className="text-4xl font-black text-[#2864FF] mt-2">$</div>
               </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selectedPatient ? (
            <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-gray-100 min-h-[400px]">
                
                <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
                  <div className="p-2 bg-blue-50 text-[#2864FF] rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">Select Patient</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Search patient to bill</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-gray-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search by name, phone number, or patient ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`${inputClass} pl-12 pr-12`}
                        autoFocus
                      />
                      <div className="absolute right-4 text-gray-400 bg-gray-50 p-1.5 rounded-lg border border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors">
                        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  </div>

                  {!searchQuery && (
                    <div className="flex items-center gap-3 p-4 bg-[#F4F7FF] rounded-xl border border-blue-100/50">
                      <div className="w-6 h-6 bg-[#2864FF] rounded-full flex items-center justify-center shrink-0">
                        <Info className="w-3.5 h-3.5 text-white" />
                      </div>
                      <p className="text-[14px] font-semibold text-[#2864FF]">Start typing to find a patient and create an invoice.</p>
                    </div>
                  )}

                  {searchQuery && (
                    <div className="mt-6">
                      {isSearching ? (
                        <div className="text-center p-8 text-sm font-semibold text-gray-400">Searching...</div>
                      ) : searchResults.length === 0 && debouncedQuery.length >= 2 ? (
                        <div className="text-center p-8 text-sm font-semibold text-gray-400">No patients found.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {searchResults.map(p => (
                            <div 
                              key={p.id} 
                              className="p-5 rounded-2xl border-2 border-gray-100 bg-white hover:border-[#2864FF] hover:shadow-md shadow-blue-500/5 cursor-pointer transition-all flex items-center gap-4 group"
                              onClick={() => { setSelectedPatient(p); setSearchQuery(''); }}
                            >
                              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#2864FF] group-hover:bg-[#2864FF] group-hover:text-white transition-colors">
                                <User className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900 text-[15px]">{p.name}</p>
                                <p className="text-xs font-semibold text-gray-500 mt-1">ID: {p.id} • {p.phone}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          ) : (
            <motion.div key="billing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              
              {/* Selected Patient Banner */}
              <div className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
                     <UserCheck className="w-7 h-7" />
                   </div>
                   <div>
                     <p className="text-[11px] font-extrabold text-emerald-500 uppercase tracking-widest mb-1">Selected Patient</p>
                     <h2 className="text-xl font-black text-slate-900">{selectedPatient.name}</h2>
                     <p className="text-sm font-semibold text-gray-500">ID: {selectedPatient.id} • {selectedPatient.phone}</p>
                   </div>
                </div>
                <button 
                  className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl transition-colors border border-gray-200"
                  onClick={() => { setSelectedPatient(null); setIsCreating(false); }}
                >
                  Change Patient
                </button>
              </div>

              {!isCreating ? (
                <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-[#2864FF]" />
                      <h2 className="text-xl font-extrabold text-slate-900">Invoices</h2>
                    </div>
                    <button 
                      className="flex items-center gap-2 bg-[#2864FF] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-500/20"
                      onClick={() => setIsCreating(true)}
                    >
                      <Plus className="w-4 h-4" /> New Invoice
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    {isLoadingInvoices ? (
                      <div className="p-12 text-center text-sm font-bold text-gray-400">Loading invoices...</div>
                    ) : invoices.length === 0 ? (
                      <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                           <FileText className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-sm font-bold text-gray-400">No invoices found for this patient.</p>
                      </div>
                    ) : (
                      <ul className="space-y-4">
                        {invoices.map(inv => (
                          <li key={inv.id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:shadow-md transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#2864FF]">
                                <Receipt size={24} />
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900 text-[15px]">
                                  {inv.description || 'Consultation / Service'}
                                </p>
                                <p className="text-xs font-semibold text-gray-500 mt-1">
                                  #{inv.invoiceNumber} • {new Date(inv.issueDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="font-black text-slate-900 text-lg">${inv.totalAmount?.toFixed(2)}</p>
                                <span className={`inline-block mt-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                                  {inv.status}
                                </span>
                              </div>
                              <button 
                                onClick={() => handleDownloadPdf(inv.id)} 
                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-[#2864FF] hover:border-[#2864FF] rounded-xl transition-all"
                                title="Download PDF"
                              >
                                <Download size={18} strokeWidth={2.5} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                    <Plus className="w-6 h-6 text-[#2864FF]" />
                    <h2 className="text-xl font-extrabold text-slate-900">Create New Invoice</h2>
                  </div>
                  
                  <form onSubmit={handleCreateSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Description <span className="text-rose-500">*</span></label>
                        <input 
                          type="text"
                          value={newInvoice.description} 
                          onChange={e => setNewInvoice({ ...newInvoice, description: e.target.value })} 
                          placeholder="e.g. OP Consultation" 
                          className={inputClass} 
                          required
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Due Date</label>
                        <input 
                          type="date"
                          value={newInvoice.dueDate} 
                          onChange={e => setNewInvoice({ ...newInvoice, dueDate: e.target.value })} 
                          className={inputClass} 
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <h3 className="text-sm font-extrabold text-slate-900 mb-4 uppercase tracking-wider">Invoice Items</h3>
                      <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        {newInvoice.items.map((item, idx) => (
                          <div key={idx} className="flex gap-4 items-start">
                            <div className="flex-1">
                              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Item Description</label>
                              <input 
                                type="text" 
                                placeholder="Consultation Fee" 
                                value={item.description}
                                onChange={e => {
                                  const newItems = [...newInvoice.items];
                                  newItems[idx].description = e.target.value;
                                  setNewInvoice({ ...newInvoice, items: newItems });
                                }}
                                className={inputClass}
                                required
                              />
                            </div>
                            <div className="w-24">
                              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Qty</label>
                              <input 
                                type="number" 
                                placeholder="1" 
                                value={item.quantity}
                                onChange={e => {
                                  const newItems = [...newInvoice.items];
                                  newItems[idx].quantity = Number(e.target.value);
                                  setNewInvoice({ ...newInvoice, items: newItems });
                                }}
                                className={inputClass}
                                required min="1"
                              />
                            </div>
                            <div className="w-36">
                              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Unit Price ($)</label>
                              <input 
                                type="number" 
                                placeholder="0.00" 
                                value={item.unitPrice}
                                onChange={e => {
                                  const newItems = [...newInvoice.items];
                                  newItems[idx].unitPrice = Number(e.target.value);
                                  setNewInvoice({ ...newInvoice, items: newItems });
                                }}
                                className={inputClass}
                                required min="0" step="0.01"
                              />
                            </div>
                          </div>
                        ))}
                        
                        <div className="pt-2">
                          <button 
                            type="button" 
                            onClick={() => setNewInvoice({ ...newInvoice, items: [...newInvoice.items, { description: '', unitPrice: 0, quantity: 1 }] })}
                            className="flex items-center gap-1.5 text-sm font-bold text-[#2864FF] hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Add Item
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100 flex items-center justify-end gap-4">
                      <button 
                        type="button" 
                        onClick={() => setIsCreating(false)}
                        className="px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={createInvoice.isPending}
                        className="px-8 py-3.5 bg-[#2864FF] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-colors disabled:opacity-50"
                      >
                        {createInvoice.isPending ? 'Saving...' : 'Save Invoice'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReceptionBilling;
