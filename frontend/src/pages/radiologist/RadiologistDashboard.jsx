import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { 
  Focus, Search, Filter, AlertCircle, CheckCircle2, Image as ImageIcon, 
  Plus, ChevronDown, Clock, User, FileText, Calendar, Activity, 
  Play, CheckSquare, RefreshCw, Eye, Sparkles, Zap, ArrowRight,
  ShieldAlert, ShieldCheck, X, FileCheck, Layers
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const CreateRadiologyRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const [patientId, setPatientId] = useState('');
  const [procedureId, setProcedureId] = useState('');
  const [priority, setPriority] = useState('ROUTINE');
  const [clinicalNotes, setClinicalNotes] = useState('');

  const { data: rawProcedures = [] } = useQuery({
    queryKey: ['radiology-procedures'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/radiology/procedures');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const procedures = Array.isArray(rawProcedures) ? rawProcedures : [];
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
      <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Patient ID / MRN *</label>
            <input 
              type="number" 
              value={patientId} 
              onChange={e => setPatientId(e.target.value)} 
              required 
              placeholder="e.g. 1" 
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-semibold text-slate-800" 
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Priority *</label>
            <select 
              value={priority} 
              onChange={e => setPriority(e.target.value)} 
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white text-sm font-semibold text-slate-800"
            >
              <option value="ROUTINE">ROUTINE - Standard Queue</option>
              <option value="URGENT">URGENT - Within 4 Hours</option>
              <option value="STAT">STAT - Immediate / Emergency</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Imaging Procedure *</label>
          <select 
            value={procedureId} 
            onChange={e => setProcedureId(e.target.value)} 
            required 
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white text-sm font-semibold text-slate-800"
          >
            <option value="">Choose Procedure</option>
            {procedures.map(p => (
              <option key={p.id} value={p.id}>{p.name} [{p.modality}] - ${p.price}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Clinical Indications & Reason for Study</label>
          <textarea 
            rows={3}
            value={clinicalNotes} 
            onChange={e => setClinicalNotes(e.target.value)} 
            placeholder="Describe patient symptoms, clinical indications, diagnostic query..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-slate-800"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <button 
            type="submit" 
            disabled={createMutation.isPending} 
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition cursor-pointer border-none flex items-center gap-2"
          >
            {createMutation.isPending ? 'Submitting...' : 'Create Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default function RadiologistDashboard() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [modalityFilter, setModalityFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: dashboardMetrics } = useQuery({
    queryKey: ['radiology-dashboard-metrics'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/radiology/dashboard');
        return res.data;
      } catch (err) {
        return null;
      }
    },
    refetchInterval: 10000
  });

  const { data: rawRequests = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['radiology-requests-dashboard', filterStatus],
    queryFn: async () => {
      const endpoint = filterStatus === 'ALL' ? '/radiology/requests' : `/radiology/requests?status=${filterStatus}`;
      const res = await axiosPrivate.get(endpoint);
      return Array.isArray(res.data) ? res.data : [];
    },
    refetchInterval: 10000
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['radiology-dashboard-metrics'] });
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axiosPrivate.patch(`/radiology/requests/${id}/status?status=${status}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radiology-requests-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['radiology-dashboard-metrics'] });
      toast.success('Procedure status updated successfully!');
    },
    onError: () => toast.error('Failed to update study status')
  });

  const requests = Array.isArray(rawRequests) ? rawRequests : [];

  // KPI Calculations from Live Database
  const pendingCount = dashboardMetrics?.pendingOrders ?? requests.filter(r => ['DRAFT', 'ORDERED', 'SCHEDULED', 'ACQUIRED', 'IMAGE_ACQUIRED', 'REPORTING'].includes(r.status)).length;
  const statUrgentCount = dashboardMetrics?.statOrUrgentCount ?? requests.filter(r => r.priority === 'STAT' || r.priority === 'URGENT').length;
  const completedCount = dashboardMetrics?.studiesCompleted ?? requests.filter(r => ['VERIFIED', 'RELEASED', 'COMPLETED'].includes(r.status)).length;
  const totalCount = dashboardMetrics?.totalVolume ?? requests.length;

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // Status filter
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'RELEASED') {
          if (req.status !== 'RELEASED' && req.status !== 'COMPLETED') return false;
        } else if (req.status !== filterStatus) {
          return false;
        }
      }

      // Modality filter
      if (modalityFilter !== 'ALL') {
        const mod = (req.procedure?.modality || '').toUpperCase();
        if (mod !== modalityFilter) return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL') {
        if (req.priority !== priorityFilter) return false;
      }

      // Text search
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      const procName = req.procedure?.name?.toLowerCase() || '';
      const patientName = `${req.patient?.user?.firstName || ''} ${req.patient?.user?.lastName || ''}`.toLowerCase();
      const opNumber = (req.patient?.opNumber || `mrn-${req.patient?.id || ''}`).toLowerCase();
      const modality = req.procedure?.modality?.toLowerCase() || '';
      const idStr = String(req.id || '');
      return procName.includes(s) || patientName.includes(s) || opNumber.includes(s) || modality.includes(s) || idStr.includes(s);
    });
  }, [requests, filterStatus, modalityFilter, priorityFilter, search]);

  const tabs = [
    { id: 'ALL', label: 'All Studies', count: requests.length },
    { id: 'ORDERED', label: 'Ordered', count: requests.filter(r => r.status === 'ORDERED').length },
    { id: 'SCHEDULED', label: 'Scheduled', count: requests.filter(r => r.status === 'SCHEDULED').length },
    { id: 'REPORTING', label: 'Reporting', count: requests.filter(r => r.status === 'REPORTING').length },
    { id: 'RELEASED', label: 'Verified & Released', count: requests.filter(r => r.status === 'VERIFIED' || r.status === 'RELEASED' || r.status === 'COMPLETED').length }
  ];

  const getModalityBadgeStyle = (modality = '') => {
    const mod = modality.toUpperCase();
    if (mod.includes('MRI')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    if (mod.includes('CT')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (mod.includes('US') || mod.includes('ULTRA')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (mod.includes('PET')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-blue-50 text-blue-700 border-blue-200'; // Default XRAY
  };

  const getPriorityBadge = (priority = 'ROUTINE') => {
    if (priority === 'STAT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
          STAT Emergency
        </span>
      );
    }
    if (priority === 'URGENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
          Urgent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
        Routine
      </span>
    );
  };

  const hasActiveFilters = modalityFilter !== 'ALL' || priorityFilter !== 'ALL' || search.trim() !== '';

  const clearAllFilters = () => {
    setSearch('');
    setModalityFilter('ALL');
    setPriorityFilter('ALL');
    setFilterStatus('ALL');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto min-h-full font-sans space-y-6 sm:space-y-8 bg-[#F8FAFF]">
      
      {/* ── Top Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-white rounded-2xl shadow-xs border border-slate-200/80 flex-shrink-0 text-blue-600">
            <Focus className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-widest bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                PACS & Diagnostic Imaging
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Radiology Workstation
            </h1>
            <p className="text-slate-500 mt-0.5 font-medium text-xs sm:text-sm">
              Real-time DICOM study review, patient worklist tracking, and diagnostic report generation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <button
            onClick={handleManualRefresh}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer flex items-center justify-center"
            title="Refresh worklist"
            aria-label="Refresh worklist"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>New Radiology Request</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Summary Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pending Studies */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Studies</p>
            <p className="text-3xl font-black text-amber-600 tracking-tight">{pendingCount}</p>
            <p className="text-[11px] font-medium text-slate-500">In queue or imaging</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" strokeWidth={2.2} />
          </div>
        </div>

        {/* STAT & Urgent */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">STAT & Urgent</p>
              {statUrgentCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
            </div>
            <p className="text-3xl font-black text-rose-600 tracking-tight">{statUrgentCount}</p>
            <p className="text-[11px] font-medium text-slate-500">Immediate priority queue</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" strokeWidth={2.2} />
          </div>
        </div>

        {/* Completed & Verified */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed & Verified</p>
            <p className="text-3xl font-black text-emerald-600 tracking-tight">{completedCount}</p>
            <p className="text-[11px] font-medium text-slate-500">Reports signed & released</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" strokeWidth={2.2} />
          </div>
        </div>

        {/* Total Studies Volume */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Imaging Volume</p>
            <p className="text-3xl font-black text-blue-600 tracking-tight">{totalCount}</p>
            <p className="text-[11px] font-medium text-slate-500">All registered exams</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <ImageIcon className="w-6 h-6" strokeWidth={2.2} />
          </div>
        </div>

      </div>

      {/* ── Main Workstation & Worklist Area ── */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200/80 space-y-6">
        
        {/* Status Filter Tabs Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 shrink-0">
            {tabs.map((tab) => {
              const isActive = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-semibold shrink-0">
            <Layers className="w-3.5 h-3.5" />
            <span>Showing {filteredRequests.length} of {requests.length} studies</span>
          </div>
        </div>

        {/* Toolbar: Search, Modality, Priority Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by patient name, MRN, procedure, modality, or study ID..." 
              className="w-full bg-slate-50 text-xs text-slate-800 font-medium rounded-xl pl-10 pr-9 py-2.5 outline-none border border-slate-200 focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 border-none bg-transparent"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Modality Filter */}
          <div className="flex items-center gap-2">
            <select
              value={modalityFilter}
              onChange={(e) => setModalityFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 transition cursor-pointer"
            >
              <option value="ALL">All Modalities</option>
              <option value="XRAY">X-Ray (CR / DR)</option>
              <option value="MRI">MRI Scan</option>
              <option value="CT">CT Scan</option>
              <option value="ULTRASOUND">Ultrasound (US)</option>
              <option value="PET">PET-CT</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 transition cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="STAT">STAT Emergency</option>
              <option value="URGENT">Urgent Priority</option>
              <option value="ROUTINE">Routine Priority</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2.5 py-2 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer border-none whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>

        </div>

        {/* ── Studies Worklist ── */}
        {isError ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Failed to load radiology worklist</h3>
            <p className="text-xs text-slate-400 font-medium max-w-sm mb-5">
              Unable to connect to diagnostic imaging backend services.
            </p>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border-none"
            >
              Retry Sync
            </button>
          </div>
        ) : isLoading ? (
          <div className="py-20 flex flex-col justify-center items-center gap-3">
            <div className="w-9 h-9 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-400">Loading diagnostic worklist...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">No radiology requests found</h3>
            <p className="text-xs text-slate-400 font-medium max-w-sm mb-5">
              {hasActiveFilters 
                ? 'No imaging studies matched your active search or filters. Try adjusting criteria.' 
                : 'No imaging studies currently registered in this worklist category.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border-none"
              >
                Reset All Filters
              </button>
            ) : (
              <button 
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer border-none"
              >
                <Plus className="w-4 h-4" /> New Radiology Request
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map(req => {
              const status = req.status || 'ORDERED';
              const modality = req.procedure?.modality || 'XRAY';
              const modalityBadgeClass = getModalityBadgeStyle(modality);
              const patientName = req.patient?.user?.firstName 
                ? `${req.patient.user.firstName} ${req.patient.user.lastName || ''}` 
                : `Patient #${req.patient?.id || req.patientId || 'N/A'}`;
              const mrn = req.patient?.opNumber || `MRN-2026-00${req.patient?.id || req.id || '1'}`;

              return (
                <div 
                  key={req.id} 
                  className="p-4 sm:p-5 bg-slate-50/50 hover:bg-blue-50/30 border border-slate-200/80 hover:border-blue-200 rounded-2xl transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
                >
                  {/* Left Metadata Group */}
                  <div className="space-y-2 flex-1 min-w-0 w-full">
                    
                    {/* Header Row: Procedure + Modality + Priority */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #RAD-{req.id}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                        {req.procedure?.name || 'Diagnostic Imaging Study'}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${modalityBadgeClass}`}>
                        {modality}
                      </span>
                      {getPriorityBadge(req.priority)}
                    </div>

                    {/* Patient & Exam Meta Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5 font-bold text-slate-700">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        {patientName}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({mrn})
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('en-IN') : 'Today'}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        Status: <strong className="text-slate-700 capitalize">{status.toLowerCase().replace('_', ' ')}</strong>
                      </span>
                    </div>

                    {/* Clinical Notes / Indications Callout */}
                    {req.clinicalNotes && (
                      <div className="text-xs text-slate-600 font-medium bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="italic">"{req.clinicalNotes}"</span>
                      </div>
                    )}
                  </div>

                  {/* Right Actions Group */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    
                    {/* View DICOM Button */}
                    <Link
                      to={`/radiologist/viewer?requestId=${req.id}`}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      title="Open DICOM PACS Viewer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>DICOM</span>
                    </Link>

                    {/* Report Editor Button */}
                    <Link
                      to={`/radiologist/reporting/${req.id}`}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      title="View / Edit Radiology Report"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Report</span>
                    </Link>

                    {/* Status Workflow Action Button */}
                    {status === 'ORDERED' && (
                      <button 
                        onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'SCHEDULED' })}
                        disabled={updateStatusMutation.isPending}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-500/20 cursor-pointer border-none flex items-center gap-1.5 transition"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Schedule Study
                      </button>
                    )}

                    {status === 'SCHEDULED' && (
                      <button 
                        onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'REPORTING' })}
                        disabled={updateStatusMutation.isPending}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-purple-500/20 cursor-pointer border-none flex items-center gap-1.5 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Start Reporting
                      </button>
                    )}

                    {status === 'REPORTING' && (
                      <button 
                        onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'VERIFIED' })}
                        disabled={updateStatusMutation.isPending}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-emerald-500/20 cursor-pointer border-none flex items-center gap-1.5 transition"
                      >
                        <CheckSquare className="w-3.5 h-3.5" /> Sign & Verify
                      </button>
                    )}

                    {status === 'VERIFIED' && (
                      <button 
                        onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'RELEASED' })}
                        disabled={updateStatusMutation.isPending}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-500/20 cursor-pointer border-none flex items-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Release Study
                      </button>
                    )}

                    {(status === 'RELEASED' || status === 'COMPLETED') && (
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-xs rounded-xl flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Released
                      </span>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── New Radiology Request Modal ── */}
      <CreateRadiologyRequestModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={() => setIsCreateOpen(false)} 
      />
    </div>
  );
}
