import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { format, isPast } from 'date-fns';
import { AlertCircle, Beaker, FileText, Play, Search, User, Droplet, Clock, ShieldCheck, Inbox, FlaskConical, Plus } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { motion } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';

const ResultEntryModal = ({ request, onClose, onSuccess }) => {
  const [resultValue, setResultValue] = useState('');
  const [referenceRange, setReferenceRange] = useState(request.testCatalog?.referenceRange || '');
  const [unit, setUnit] = useState(request.testCatalog?.unit || '');
  const [file, setFile] = useState(null);
  
  let liveAbnormal = false;
  let liveCritical = false;
  
  if (resultValue && referenceRange) {
    const val = parseFloat(resultValue);
    if (!isNaN(val)) {
      const rangeMatch = referenceRange.match(/^([0-9.]+)\s*-\s*([0-9.]+)$/);
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        if (val < min || val > max) {
          liveAbnormal = true;
          const critDev = (max - min) * 0.2;
          if (val < (min - critDev) || val > (max + critDev)) {
            liveCritical = true;
          }
        }
      } else if (referenceRange.trim().startsWith('<')) {
        const max = parseFloat(referenceRange.replace('<', '').trim());
        if (val >= max) {
          liveAbnormal = true;
          if (val >= max * 1.2) liveCritical = true;
        }
      } else if (referenceRange.trim().startsWith('>')) {
        const min = parseFloat(referenceRange.replace('>', '').trim());
        if (val <= min) {
          liveAbnormal = true;
          if (val <= min * 0.8) liveCritical = true;
        }
      }
    }
  }

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await axiosPrivate.post(`/lab/requests/${request.id}/result`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-requests'] });
      toast.success('Result saved successfully');
      onSuccess();
    },
    onError: () => toast.error('Failed to save result')
  });

  const handleSubmit = (e, isDraft = false) => {
    e.preventDefault();
    const formData = new FormData();
    const resultObj = {
      resultValue,
      isCritical: liveCritical,
      isAbnormal: liveAbnormal,
      referenceRange,
      unit,
      isDraft
    };
    formData.append('result', new Blob([JSON.stringify(resultObj)], { type: 'application/json' }));
    if (file) {
      formData.append('file', file);
    }
    submitMutation.mutate(formData);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Result Entry - ${request.testCatalog?.testName}`}>
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Result Value *</label>
          <input type="text" value={resultValue} onChange={e => setResultValue(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 backdrop-blur-md outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2160FF] transition-all shadow-sm font-bold text-lg" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reference Range</label>
            <input type="text" value={referenceRange} onChange={e => setReferenceRange(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 backdrop-blur-md outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2160FF] transition-all shadow-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</label>
            <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 backdrop-blur-md outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2160FF] transition-all shadow-sm" />
          </div>
        </div>
        
        <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex-1 flex items-center space-x-2">
            <span className="text-sm font-semibold text-slate-700">Live Status:</span>
            {liveCritical ? (
              <Badge variant="danger">CRITICAL</Badge>
            ) : liveAbnormal ? (
              <Badge variant="warning">ABNORMAL</Badge>
            ) : resultValue ? (
              <Badge variant="success">NORMAL</Badge>
            ) : (
              <span className="text-xs text-slate-400">Enter result to evaluate</span>
            )}
          </div>
          {(liveAbnormal || liveCritical) && (
            <p className="text-xs text-red-500 font-medium">
              Values outside reference range. A critical result triggers immediate alerts.
            </p>
          )}
        </div>
        
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upload PDF Report (Optional)</label>
          <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#F0F5FF] file:text-[#2160FF] hover:file:bg-[#E0EAFF] transition-colors cursor-pointer border border-slate-200 rounded-xl px-2 py-2 bg-white/50"/>
        </div>
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="secondary" onClick={(e) => handleSubmit(e, true)} isLoading={submitMutation.isPending}>Save Draft</Button>
          <button type="submit" disabled={submitMutation.isPending} className="px-5 py-2.5 bg-[#2160FF] hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm shadow-blue-500/20 disabled:opacity-50">
            {submitMutation.isPending ? 'Saving...' : 'Submit Result'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const CreateLabRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const [patientId, setPatientId] = useState('');
  const [testCatalogId, setTestCatalogId] = useState('');
  const [priority, setPriority] = useState('ROUTINE');

  const { data: catalog = [] } = useQuery({
    queryKey: ['lab-catalog'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/lab/catalog');
      return res.data || [];
    }
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosPrivate.post('/lab/requests', {
        patient: { id: parseInt(patientId) || 1 },
        testCatalog: { id: parseInt(testCatalogId) || 1 },
        priority,
        status: 'REQUESTED'
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-requests'] });
      toast.success('New lab request created successfully');
      onSuccess();
    },
    onError: () => toast.error('Failed to create lab request')
  });

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Lab Request">
      <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Profile ID *</label>
          <input type="number" value={patientId} onChange={e => setPatientId(e.target.value)} required placeholder="e.g. 1" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2160FF]" />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Test *</label>
          <select value={testCatalogId} onChange={e => setTestCatalogId(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2160FF] bg-white">
            <option value="">Select Test Catalog</option>
            {catalog.map(c => (
              <option key={c.id} value={c.id}>{c.testName} ({c.testCode}) - ${c.price}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2160FF] bg-white">
            <option value="ROUTINE">ROUTINE</option>
            <option value="URGENT">URGENT</option>
            <option value="STAT">STAT</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <button type="submit" disabled={createMutation.isPending} className="px-5 py-2.5 bg-[#2160FF] hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm shadow-blue-500/20 disabled:opacity-50">
            {createMutation.isPending ? 'Creating...' : 'Create Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const filterTabs = [
  { id: 'ALL', label: 'All', icon: null },
  { id: 'REQUESTED', label: 'Requested', icon: User },
  { id: 'SAMPLE_COLLECTED', label: 'Sample Collected', icon: Droplet },
  { id: 'RECEIVED', label: 'Received', icon: Inbox },
  { id: 'IN_PROGRESS', label: 'In Progress', icon: Clock },
  { id: 'VERIFIED', label: 'Verified', icon: ShieldCheck }
];

const LabWorklist = () => {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data = {}, isLoading, isError } = useQuery({
    queryKey: ['lab-requests', filterStatus, search],
    queryFn: async () => {
      const params = {};
      if (filterStatus !== 'ALL') params.status = filterStatus;
      if (search) params.search = search;
      params.size = 100;
      const res = await axiosPrivate.get('/lab/worklist', { params });
      return res.data;
    },
    refetchInterval: 10000 // Realtime 10-second live polling
  });

  const requests = data.content || [];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axiosPrivate.put(`/lab/requests/${id}/status?status=${status}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-requests'] });
      toast.success('Status updated successfully');
    },
    onError: () => toast.error('Failed to update status')
  });

  const generateBarcodeMutation = useMutation({
    mutationFn: async (requestId) => {
      const res = await axiosPrivate.post(`/lab/requests/generate-barcodes`, [requestId]);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-requests'] });
      toast.success('Barcode generated successfully!');
    },
    onError: () => toast.error('Failed to generate barcode')
  });

  const verifyMutation = useMutation({
    mutationFn: async (requestId) => {
      const res = await axiosPrivate.put(`/lab/requests/${requestId}/verify`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-requests'] });
      toast.success('Result verified successfully!');
    },
    onError: () => toast.error('Failed to verify result')
  });

  const filteredRequests = requests;

  return (
    <div className="min-h-full bg-[#F8FAFC] p-6 lg:p-8 w-full font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#EDF2FF] rounded-2xl flex-shrink-0">
              <FlaskConical className="w-8 h-8 text-[#2160FF]" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[26px] font-extrabold text-slate-900 mb-1 tracking-tight">Lab Worklist</h1>
              <p className="text-[14.5px] text-gray-500 font-medium">Manage and track patient lab requests in real-time.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-[14px] rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} /> New Lab Request
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          
          {/* Top Filter Bar */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-5 border-b border-gray-100 gap-4">
            
            <div className="flex space-x-1 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
              {filterTabs.map((tab) => {
                const isActive = filterStatus === tab.id;
                const Icon = tab.icon;
                return (
                  <button 
                    key={tab.id} 
                    onClick={() => setFilterStatus(tab.id)} 
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold whitespace-nowrap transition-all border-none cursor-pointer ${
                      isActive 
                        ? 'bg-[#2160FF] text-white shadow-md shadow-blue-500/20' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-slate-700 bg-transparent'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" strokeWidth={2.5} />}
                    {tab.label}
                  </button>
                );
              })}
            </div>
            
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2.5} />
              <input 
                type="text" 
                placeholder="Search patient or ID..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-slate-700 focus:outline-none focus:border-[#2160FF] focus:ring-4 focus:ring-[#2160FF]/10 transition-all shadow-sm" 
              />
            </div>
          </div>

          {/* Body Content */}
          <div className="bg-white min-h-[500px]">
            {isLoading ? (
              <div className="flex justify-center items-center h-full py-32">
                <div className="w-8 h-8 border-3 border-[#EDF2FF] border-t-[#2160FF] rounded-full animate-spin"></div>
              </div>
            ) : isError ? (
              <div className="p-12 text-center font-bold text-red-500">Error loading worklist.</div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 py-24 h-full">
                {/* Custom Empty State Illustration */}
                <div className="relative w-36 h-36 flex items-center justify-center mb-8">
                   <div className="absolute inset-0 bg-[#F0F5FF] rounded-full"></div>
                   
                   {/* Sparkles */}
                   <div className="absolute top-4 left-4 w-2 h-2 bg-[#2160FF]/30 rotate-45"></div>
                   <div className="absolute top-8 right-6 w-1.5 h-1.5 bg-[#2160FF]/40 rotate-45"></div>
                   <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-[#2160FF]/40 rotate-45"></div>
                   <div className="absolute bottom-10 right-4 w-2 h-2 bg-[#2160FF]/30 rotate-45"></div>

                   {/* Test Tubes Graphic */}
                   <div className="relative z-10 flex items-end justify-center gap-3">
                     <div className="w-5 h-16 border-2 border-[#2160FF] rounded-b-full rounded-t flex flex-col justify-end overflow-hidden p-0.5 pb-1">
                       <div className="w-full h-8 bg-[#2160FF]/20 rounded-b-full"></div>
                     </div>
                     <div className="w-5 h-20 border-2 border-[#2160FF] rounded-b-full rounded-t flex flex-col justify-end overflow-hidden p-0.5 pb-1">
                       <div className="w-full h-12 bg-[#2160FF]/40 rounded-b-full"></div>
                     </div>
                     <div className="w-5 h-14 border-2 border-[#2160FF] rounded-b-full rounded-t flex flex-col justify-end overflow-hidden p-0.5 pb-1">
                       <div className="w-full h-6 bg-[#2160FF]/20 rounded-b-full"></div>
                     </div>
                     
                     {/* Rack Base */}
                     <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 h-2.5 bg-[#2160FF]/30 rounded-full"></div>
                   </div>
                </div>

                <h3 className="text-[20px] font-extrabold text-slate-900 mb-2 tracking-tight">No lab requests found</h3>
                <p className="text-[14.5px] text-gray-500 font-medium mb-8">There are no lab requests matching the selected status.</p>
                
                <button 
                  onClick={() => setIsCreateOpen(true)}
                  className="flex items-center gap-2 px-6 py-2.5 border-2 border-[#2160FF] text-[#2160FF] font-bold text-[14px] rounded-xl hover:bg-[#2160FF] hover:text-white transition-all shadow-sm cursor-pointer bg-white"
                >
                  <FlaskConical className="w-4 h-4" strokeWidth={2.5} /> New Lab Request
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredRequests.map(req => {
                  const targetHours = req.testCatalog?.turnaroundTargetHours || 24;
                  const dueTime = req.requestedAt ? new Date(req.requestedAt).getTime() + (targetHours * 60 * 60 * 1000) : Date.now();
                  const isOverdue = isPast(new Date(dueTime)) && req.status !== 'RELEASED' && req.status !== 'VERIFIED';
                  
                  return (
                    <motion.li variants={fadeIn} key={req.id} className="p-5 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-extrabold text-slate-900 text-[15px]">{req.testCatalog?.testName || 'Lab Test'}</span>
                          <span className="text-[11px] font-black text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">#{req.labRequestNumber || req.id}</span>
                          <Badge variant={req.priority === 'STAT' ? 'danger' : req.priority === 'URGENT' ? 'warning' : 'info'}>
                            {req.priority || 'ROUTINE'}
                          </Badge>
                          {isOverdue && <Badge variant="danger" className="animate-pulse flex items-center gap-1 shadow-sm shadow-red-500/20"><AlertCircle size={10} /> OVERDUE</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-1">
                          <div className="flex items-center gap-1.5">
                             <User className="w-3.5 h-3.5 text-gray-400" />
                             <span className="text-[13px] font-medium text-slate-700">
                               {req.patient?.user?.firstName ? `${req.patient.user.firstName} ${req.patient.user.lastName || ''}` : `Patient #${req.patient?.id || 'N/A'}`}
                             </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                             <Clock className="w-3.5 h-3.5 text-gray-400" />
                             <span className="text-[13px] font-medium text-slate-700">{req.requestedAt ? format(new Date(req.requestedAt), 'PPp') : 'Just now'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                             <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                             <span className="text-[13px] font-medium text-slate-700 capitalize">{(req.status || 'REQUESTED').toLowerCase().replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                         {(req.status === 'REQUESTED' || req.status === 'ORDERED') && (
                           <>
                             {!req.sampleBarcodeId && (
                               <button 
                                 onClick={() => generateBarcodeMutation.mutate(req.id)} 
                                 disabled={generateBarcodeMutation.isPending}
                                 className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13px] rounded-lg transition-colors cursor-pointer border-none"
                               >
                                 Barcode
                               </button>
                             )}
                             <button 
                               onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'SAMPLE_COLLECTED' })}
                               disabled={updateStatusMutation.isPending}
                               className="px-4 py-2 bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-[13px] rounded-lg shadow-sm shadow-blue-500/20 transition-colors cursor-pointer border-none"
                             >
                               Mark Collected
                             </button>
                           </>
                         )}
                         {(req.status === 'SAMPLE_COLLECTED' || req.status === 'COLLECTED') && (
                           <>
                             <button 
                               onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'RECEIVED' })}
                               disabled={updateStatusMutation.isPending}
                               className="px-4 py-2 bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-[13px] rounded-lg shadow-sm shadow-blue-500/20 transition-colors cursor-pointer border-none"
                             >
                               Receive Sample
                             </button>
                           </>
                         )}
                         {req.status === 'RECEIVED' && (
                           <button 
                             onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'IN_PROGRESS' })}
                             disabled={updateStatusMutation.isPending}
                             className="px-4 py-2 bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-[13px] rounded-lg shadow-sm shadow-blue-500/20 transition-colors flex items-center gap-2 cursor-pointer border-none"
                           >
                             <Play className="w-3.5 h-3.5 fill-current" /> Start Processing
                           </button>
                         )}
                         {(req.status === 'IN_PROGRESS' || req.status === 'PROCESSING') && (
                           <button 
                             onClick={() => setSelectedRequest(req)}
                             className="px-4 py-2 bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-[13px] rounded-lg shadow-sm shadow-blue-500/20 transition-colors cursor-pointer border-none"
                           >
                             Enter Results
                           </button>
                         )}
                         {req.status === 'RESULT_ENTERED' && (
                           <button 
                             onClick={() => verifyMutation.mutate(req.id)}
                             disabled={verifyMutation.isPending}
                             className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] rounded-lg shadow-sm shadow-emerald-500/20 transition-colors cursor-pointer border-none"
                           >
                             Verify Result
                           </button>
                         )}
                         {req.status === 'VERIFIED' && (
                           <button 
                             onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'RELEASED' })}
                             disabled={updateStatusMutation.isPending}
                             className="px-4 py-2 bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-[13px] rounded-lg shadow-sm shadow-blue-500/20 transition-colors cursor-pointer border-none"
                           >
                             Release Report
                           </button>
                         )}
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      {selectedRequest && (
        <ResultEntryModal request={selectedRequest} onClose={() => setSelectedRequest(null)} onSuccess={() => setSelectedRequest(null)} />
      )}

      <CreateLabRequestModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={() => setIsCreateOpen(false)} />
    </div>
  );
};

export default LabWorklist;
