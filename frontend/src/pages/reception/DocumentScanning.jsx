import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';
import { FileText, User, Search, Info, Plus, FolderOpen, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, staggerChildren } from '../../components/ui/motion';

const DOC_TYPES = ['Lab Report', 'Prescription', 'Medical Record', 'Radiology', 'Referral Letter', 'Other'];

const DocumentScanning = () => {
  const queryClient = useQueryClient();
  const [patientProfileId, setPatientProfileId] = useState('');
  const [searchedId, setSearchedId] = useState(null);
  const [branchId] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    documentType: 'Lab Report',
    fileUrl: '',
    scanDevice: '',
    notes: ''
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['receptionDocs', searchedId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/reception/kiosk/patient/${searchedId}/documents`);
      return res.data;
    },
    enabled: !!searchedId
  });

  const uploadDocument = useMutation({
    mutationFn: async () => {
      const res = await axiosPrivate.post(`/reception/kiosk/branch/${branchId}/documents`, {
        patientProfileId: searchedId,
        ...form
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['receptionDocs', searchedId] });
      setShowForm(false);
      setForm({ title: '', documentType: 'Lab Report', fileUrl: '', scanDevice: '', notes: '' });
    },
    onError: () => toast.error('Upload failed')
  });

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
              <div className="flex items-start gap-5 pt-4">
                <div className="p-4 bg-[#EBF0FF] rounded-2xl flex-shrink-0 border border-blue-100/50">
                  <FileText className="w-8 h-8 text-[#2864FF]" strokeWidth={2.5} />
                </div>
                <div className="pt-1">
                  <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Document Scanning</h1>
                  <p className="text-[15px] text-gray-500 font-medium">Scan and upload patient documents at the reception desk.</p>
                </div>
              </div>
            </div>

            {/* 3D Scanner Graphic */}
            <div className="hidden sm:flex relative shrink-0 w-32 h-32 items-center justify-center pt-8">
               
               {/* Document Base */}
               <div className="absolute w-20 h-28 bg-white rounded-xl shadow-xl shadow-blue-500/10 border border-gray-100 flex flex-col p-3 z-10">
                 {/* Folded Corner */}
                 <div className="absolute top-0 right-0 w-6 h-6 bg-blue-50 rounded-bl-xl border-b border-l border-gray-100"></div>
                 <div className="w-6 h-1.5 bg-[#2864FF] rounded-full mt-2 mb-4 opacity-80"></div>
                 <div className="space-y-2 w-full">
                   <div className="w-full h-1.5 bg-gray-100 rounded-full"></div>
                   <div className="w-5/6 h-1.5 bg-gray-100 rounded-full"></div>
                   <div className="w-full h-1.5 bg-gray-100 rounded-full mt-4"></div>
                   <div className="w-2/3 h-1.5 bg-gray-100 rounded-full"></div>
                 </div>
               </div>

               {/* Scanning Laser */}
               <div className="absolute w-32 h-0.5 bg-[#2864FF] z-20 shadow-[0_0_8px_rgba(40,100,255,0.8)] top-1/2 -translate-y-1/2"></div>
               
               {/* Corner Brackets */}
               <div className="absolute top-4 left-0 w-3 h-3 border-t-2 border-l-2 border-[#2864FF] opacity-60 z-20"></div>
               <div className="absolute top-4 right-0 w-3 h-3 border-t-2 border-r-2 border-[#2864FF] opacity-60 z-20"></div>
               <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#2864FF] opacity-60 z-20"></div>
               <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#2864FF] opacity-60 z-20"></div>

            </div>
          </div>
        </div>

        {/* Patient Lookup Card */}
        <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8 pb-4">
            <div className="p-2 bg-blue-50 text-[#2864FF] rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Patient Lookup</h2>
          </div>
          
          <div className="w-full h-px bg-gray-100 mb-8 -mt-4"></div>

          <div className="space-y-6">
            <div>
              <label className={labelClass}>Enter Patient Profile ID</label>
              <p className="text-[13px] text-gray-500 font-medium mb-4">Search for the patient using their profile ID to scan and upload documents.</p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter Patient Profile ID (e.g., P12345)"
                    value={patientProfileId}
                    onChange={(e) => setPatientProfileId(e.target.value)}
                    className={`${inputClass} pl-12`}
                    onKeyDown={(e) => e.key === 'Enter' && patientProfileId && setSearchedId(patientProfileId)}
                  />
                </div>
                <button 
                  onClick={() => setSearchedId(patientProfileId || null)} 
                  disabled={!patientProfileId}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#2864FF] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" /> Load
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#F4F7FF] rounded-xl border border-blue-100/50">
              <div className="w-6 h-6 bg-[#2864FF] rounded-full flex items-center justify-center shrink-0">
                <Info className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-[14px] font-semibold text-[#2864FF]">Enter a valid Patient Profile ID to load and scan documents.</p>
            </div>
          </div>
        </div>

        {searchedId && (
          <motion.div initial="hidden" animate="visible" variants={staggerChildren} className="space-y-6">
            <motion.div variants={fadeIn} className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-[#2864FF] rounded-lg">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">Patient Documents</h2>
                </div>
                <button
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#2864FF] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-colors"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="w-4 h-4" /> Scan New Document
                </button>
              </div>
              
              <div>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2864FF]" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No Documents</h3>
                    <p className="text-sm font-semibold text-gray-400">No documents have been uploaded for this patient.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#2864FF]">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-[15px]">{doc.title}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-100 text-[#2864FF]">
                                {doc.documentType}
                              </span>
                              <span className="text-xs font-semibold text-gray-500">
                                {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown date'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:text-[#2864FF] hover:border-[#2864FF] font-bold text-sm rounded-lg transition-colors"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            <AnimatePresence>
              {showForm && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                    <div className="p-2 bg-blue-50 text-[#2864FF] rounded-lg">
                      <Upload className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900">Upload Scanned Document</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Document Title</label>
                        <input
                          placeholder="e.g. Blood Test Report"
                          value={form.title}
                          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Document Type</label>
                        <select
                          className={inputClass}
                          value={form.documentType}
                          onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))}
                        >
                          {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>File URL / Path</label>
                        <input
                          placeholder="https://... or leave blank for placeholder"
                          value={form.fileUrl}
                          onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Scan Device (optional)</label>
                        <input
                          placeholder="e.g. Fuji Scanner S2"
                          value={form.scanDevice}
                          onChange={e => setForm(f => ({ ...f, scanDevice: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className={labelClass}>Notes (optional)</label>
                      <input
                        placeholder="Any notes about this document..."
                        value={form.notes}
                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
                      <button 
                        className="px-6 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        onClick={() => setShowForm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="flex items-center gap-2 px-8 py-3.5 bg-[#2864FF] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-colors disabled:opacity-50"
                        onClick={() => uploadDocument.mutate()}
                        disabled={!form.title || uploadDocument.isPending}
                      >
                        {uploadDocument.isPending ? (
                          <>Uploading...</>
                        ) : (
                          <><CheckCircle2 className="w-5 h-5" /> Upload Document</>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DocumentScanning;
