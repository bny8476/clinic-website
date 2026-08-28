import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Focus, Search, Filter, AlertCircle, CheckCircle2, Image as ImageIcon, Plus, ChevronDown, Clock, User, FileText, Calendar, Activity, Play, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const CreateRadiologyRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const [patientId, setPatientId] = useState('');
  const [procedureId, setProcedureId] = useState('');
  const [priority, setPriority] = useState('ROUTINE');
  const [clinicalNotes, setClinicalNotes] = useState('');

  const { data: procedures = [] } = useQuery({
    queryKey: ['radiology-procedures'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/radiology/procedures');
      return res.data || [];
    }
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosPrivate.post('/radiology/requests', {
        patient: { id: parseInt(patientId) || 1 },
        procedure: { id: parseInt(procedureId) || 1 },
        priority,
        clinicalNotes,
        status: 'ORDERED'
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radiology-requests-dashboard'] });
      toast.success('Radiology request created successfully');
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create radiology request');
    }
  });

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Radiology & Imaging Request">
      <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Profile ID *</label>
          <input 
            type="number" 
            value={patientId} 
            onChange={e => setPatientId(e.target.value)} 
            required 
            placeholder="e.g. 1" 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2864FF]" 
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Imaging Procedure *</label>
          <select 
            value={procedureId} 
            onChange={e => setProcedureId(e.target.value)} 
            required 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2864FF] bg-white"
          >
            <option value="">Select Procedure</option>
            {procedures.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.modality}) - ${p.price}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</label>
          <select 
            value={priority} 
            onChange={e => setPriority(e.target.value)} 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2864FF] bg-white"
          >
            <option value="ROUTINE">ROUTINE</option>
            <option value="URGENT">URGENT</option>
            <option value="STAT">STAT / Emergency</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clinical Indications & Notes</label>
          <textarea 
            rows={3}
            value={clinicalNotes} 
            onChange={e => setClinicalNotes(e.target.value)} 
            placeholder="Describe clinical symptoms or reason for study..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2864FF]"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <button type="submit" disabled={createMutation.isPending} className="px-5 py-2.5 bg-[#2864FF] hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm shadow-blue-500/20 disabled:opacity-50">
            {createMutation.isPending ? 'Submitting...' : 'Create Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const RadiologistDashboard = () => {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: rawRequests = [], isLoading } = useQuery({
    queryKey: ['radiology-requests-dashboard', filterStatus],
    queryFn: async () => {
      const endpoint = filterStatus === 'ALL' ? '/radiology/requests' : `/radiology/requests?status=${filterStatus}`;
      const res = await axiosPrivate.get(endpoint);
      return res.data || [];
    },
    refetchInterval: 10000 // Realtime 10-second live polling
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axiosPrivate.patch(`/radiology/requests/${id}/status?status=${status}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radiology-requests-dashboard'] });
      toast.success('Procedure status updated!');
    },
    onError: () => toast.error('Failed to update status')
  });

  const requests = Array.isArray(rawRequests) ? rawRequests : [];

  const pendingCount = requests.filter(r => ['DRAFT', 'ORDERED', 'SCHEDULED', 'IMAGE_ACQUIRED', 'REPORTING'].includes(r.status)).length;
  const completedCount = requests.filter(r => ['VERIFIED', 'RELEASED', 'COMPLETED'].includes(r.status)).length;

  const filteredRequests = requests.filter(req => {
    if (filterStatus !== 'ALL' && req.status !== filterStatus) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    const procName = req.procedure?.name?.toLowerCase() || '';
    const patientName = `${req.patient?.user?.firstName || ''} ${req.patient?.user?.lastName || ''}`.toLowerCase();
    const modality = req.procedure?.modality?.toLowerCase() || '';
    return procName.includes(s) || patientName.includes(s) || modality.includes(s);
  });

  const tabs = [
    { id: 'ALL', label: 'ALL WORKLIST' },
    { id: 'ORDERED', label: 'ORDERED' },
    { id: 'SCHEDULED', label: 'SCHEDULED' },
    { id: 'REPORTING', label: 'REPORTING' },
    { id: 'RELEASED', label: 'RELEASED' }
  ];

  return (
    <div className="p-6 w-full min-h-full bg-[#F8FAFF] font-sans">
      
      {/* Tabs */}
      <div className="flex items-center gap-3 mb-8 overflow-x-auto hide-scrollbar pb-1">
        {tabs.map((tab) => {
          const isActive = filterStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-7 py-2.5 rounded-full text-xs font-extrabold tracking-wide transition-all shadow-sm cursor-pointer border-none ${
                isActive
                  ? 'bg-[#2864FF] text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex-shrink-0">
            <Focus className="w-8 h-8 text-[#2864FF]" strokeWidth={2.5} />
          </div>
          <div className="pt-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Radiology & PACS Workstation</h1>
            <p className="text-gray-500 mt-1 font-medium text-[14.5px]">Imaging procedure management, DICOM study review, and diagnostic report generation.</p>
          </div>
        </div>

        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-[#2864FF] hover:bg-blue-700 text-white px-7 py-3 rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} /> New Radiology Request
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column KPIs */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-5">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Pending Studies</p>
                <p className="text-3xl font-extrabold text-orange-500 leading-none">{pendingCount}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Completed & Verified</p>
                <p className="text-3xl font-extrabold text-emerald-500 leading-none">{completedCount}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-50 text-[#2864FF] rounded-2xl flex items-center justify-center shrink-0">
                <ImageIcon className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Total Studies</p>
                <p className="text-3xl font-extrabold text-[#2864FF] leading-none">{requests.length}</p>
            </div>
          </div>
        </div>

        {/* Right Column Workstation Area */}
        <div className="flex-1 w-full bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col relative min-h-[500px]">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                <div className="flex-1 relative w-full">
                    <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by patient name, procedure, or modality..." 
                        className="w-full bg-[#F8FAFF] text-xs text-gray-700 font-medium rounded-2xl pl-11 pr-4 py-3.5 outline-none border border-slate-200 focus:border-[#2864FF] focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Request List */}
            {isLoading ? (
              <div className="flex-1 flex justify-center items-center py-20">
                <div className="w-8 h-8 border-3 border-[#EBF0FF] border-t-[#2864FF] rounded-full animate-spin"></div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-[#F8FAFF] rounded-full flex items-center justify-center mb-6">
                  <ImageIcon className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-1">No radiology requests found</h3>
                <p className="text-xs text-slate-400 font-medium mb-6">No matching imaging studies in this worklist category.</p>
                <button 
                  onClick={() => setIsCreateOpen(true)}
                  className="flex items-center gap-2 bg-[#2864FF] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer border-none"
                >
                  <Plus className="w-4 h-4" /> New Radiology Request
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-y-auto">
                {filteredRequests.map(req => (
                  <div key={req.id} className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-2xl">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {req.procedure?.name || 'Imaging Procedure'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#2864FF]">
                          {req.procedure?.modality || 'XRAY'}
                        </span>
                        <Badge variant={req.priority === 'STAT' ? 'danger' : req.priority === 'URGENT' ? 'warning' : 'info'}>
                          {req.priority || 'ROUTINE'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {req.patient?.user?.firstName ? `${req.patient.user.firstName} ${req.patient.user.lastName || ''}` : `Patient #${req.patient?.id || 'N/A'}`}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {req.status?.replace('_', ' ')}
                        </span>
                      </div>

                      {req.clinicalNotes && (
                        <p className="text-xs text-slate-600 font-medium bg-slate-50 p-2 rounded-xl border border-slate-100 italic">
                          "{req.clinicalNotes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {req.status === 'ORDERED' && (
                        <button 
                          onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'SCHEDULED' })}
                          disabled={updateStatusMutation.isPending}
                          className="px-4 py-2 bg-[#2864FF] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer border-none"
                        >
                          Schedule Study
                        </button>
                      )}
                      {req.status === 'SCHEDULED' && (
                        <button 
                          onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'REPORTING' })}
                          disabled={updateStatusMutation.isPending}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer border-none flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Start Reporting
                        </button>
                      )}
                      {req.status === 'REPORTING' && (
                        <button 
                          onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'VERIFIED' })}
                          disabled={updateStatusMutation.isPending}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer border-none flex items-center gap-1.5"
                        >
                          <CheckSquare className="w-3.5 h-3.5" /> Sign & Verify
                        </button>
                      )}
                      {req.status === 'VERIFIED' && (
                        <button 
                          onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'RELEASED' })}
                          disabled={updateStatusMutation.isPending}
                          className="px-4 py-2 bg-[#2864FF] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer border-none"
                        >
                          Release Study
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      <CreateRadiologyRequestModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={() => setIsCreateOpen(false)} 
      />
    </div>
  );
};

export default RadiologistDashboard;
