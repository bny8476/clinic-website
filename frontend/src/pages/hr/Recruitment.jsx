import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../../components/ui/motion';
import HrTopNav from './HrTopNav';
import { 
  Briefcase, 
  UserPlus, 
  Search, 
  Plus, 
  Users, 
  Building, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ArrowRight, 
  Filter, 
  X, 
  RotateCw,
  Mail,
  Phone,
  FileText
} from 'lucide-react';

const CANDIDATES_PIPELINE = [
  { id: 1, name: 'Dr. Anita Roy', email: 'anita.roy@medmail.com', role: 'Emergency Department Physician', stage: 'INTERVIEW', rating: '4.8/5', experience: '8 yrs', appliedDate: '2026-11-14' },
  { id: 2, name: 'Kavita Menon', email: 'k.menon@healthnursing.org', role: 'Registered Staff Nurse (ICU)', stage: 'OFFER_EXTENDED', rating: '4.9/5', experience: '5 yrs', appliedDate: '2026-11-10' },
  { id: 3, name: 'Rahul Sharma', email: 'rahul.s@pharmconnect.in', role: 'Senior Clinical Pharmacist', stage: 'SCREENING', rating: '4.5/5', experience: '6 yrs', appliedDate: '2026-11-18' },
  { id: 4, name: 'Vikram Joshi', email: 'v.joshi@imagingpro.com', role: 'Radiology / CT Technologist', stage: 'INTERVIEW', rating: '4.6/5', experience: '4 yrs', appliedDate: '2026-11-16' },
  { id: 5, name: 'Sneha Patil', email: 'sneha.patil@cliniclabs.com', role: 'Senior Pathologist', stage: 'HIRED', rating: '5.0/5', experience: '9 yrs', appliedDate: '2026-11-05' }
];

export default function Recruitment() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('requisitions'); // requisitions | applications
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    department: 'Cardiology',
    vacancyCount: 1,
    requiredQualifications: 'MBBS / MD / Relevant Clinical Degree',
    requiredExperienceYears: 3,
    minSalary: '',
    maxSalary: '',
    status: 'POSTED'
  });

  // Fetch Requisitions from Backend
  const { data: rawRequisitions = [], isLoading: isLoadingReqs, refetch, isFetching } = useQuery({
    queryKey: ['jobRequisitions'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/hr/requisitions/active');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    }
  });

  // Create Requisition Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      return (await axiosPrivate.post('/hr/requisitions', payload)).data;
    },
    onSuccess: () => {
      toast.success('Job requisition posted successfully!');
      queryClient.invalidateQueries(['jobRequisitions']);
      setIsModalOpen(false);
      setFormData({
        title: '',
        department: 'Cardiology',
        vacancyCount: 1,
        requiredQualifications: 'MBBS / MD / Relevant Clinical Degree',
        requiredExperienceYears: 3,
        minSalary: '',
        maxSalary: '',
        status: 'POSTED'
      });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to create job requisition');
    }
  });

  // Fallback demo requisitions if backend table is initially empty
  const fallbackRequisitions = useMemo(() => [
    { id: 101, title: 'Emergency Department Physician', department: 'Emergency & Trauma', vacancyCount: 2, status: 'POSTED', location: 'Main Hospital Campus', minSalary: 120000, maxSalary: 160000 },
    { id: 102, title: 'Registered Staff Nurse (ICU)', department: 'Inpatient Care', vacancyCount: 4, status: 'POSTED', location: 'Critical Care Unit', minSalary: 45000, maxSalary: 60000 },
    { id: 103, title: 'Senior Clinical Pharmacist', department: 'Pharmacy Operations', vacancyCount: 1, status: 'POSTED', location: 'Central Outpatient Pharmacy', minSalary: 65000, maxSalary: 85000 },
    { id: 104, title: 'Radiology / CT Technologist', department: 'Diagnostic Imaging', vacancyCount: 2, status: 'POSTED', location: 'Diagnostic Imaging Wing', minSalary: 50000, maxSalary: 70000 }
  ], []);

  const displayRequisitions = rawRequisitions.length > 0 ? rawRequisitions : fallbackRequisitions;

  const filteredRequisitions = useMemo(() => {
    return displayRequisitions.filter(r => {
      const title = (r.title || r.jobTitle || '').toLowerCase();
      const dept = (r.department || '').toLowerCase();
      return !searchQuery || title.includes(searchQuery.toLowerCase()) || dept.includes(searchQuery.toLowerCase());
    });
  }, [displayRequisitions, searchQuery]);

  const filteredCandidates = useMemo(() => {
    return CANDIDATES_PIPELINE.filter(c => {
      return !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.role.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a job title');
      return;
    }
    createMutation.mutate({
      title: formData.title,
      department: formData.department,
      vacancyCount: parseInt(formData.vacancyCount) || 1,
      requiredQualifications: formData.requiredQualifications,
      requiredExperienceYears: parseInt(formData.requiredExperienceYears) || 0,
      minSalary: formData.minSalary ? parseFloat(formData.minSalary) : null,
      maxSalary: formData.maxSalary ? parseFloat(formData.maxSalary) : null,
      status: 'POSTED',
      branch: { id: 1 }
    });
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 font-sans">
      
      {/* ── Top Portal Navigation Bar ───────────────────────────────── */}
      <HrTopNav />

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-2xs">
            <Briefcase className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Recruitment & Hiring Pipeline
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                <Users size={14} className="text-indigo-600" />
                Active Talent Acquisition
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Publish job requisitions, track candidate interviews, and manage hiring workflows across clinical departments.
            </p>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            onClick={() => {
              refetch();
              toast.success('Recruitment data refreshed');
            }}
            title="Refresh Requisitions"
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
          >
            <RotateCw size={17} className={isFetching ? 'animate-spin text-indigo-600' : ''} />
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Plus size={16} /> New Job Requisition
          </button>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('requisitions')}
            className={`pb-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'requisitions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase size={16} /> Job Requisitions ({displayRequisitions.length})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'applications'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus size={16} /> Applications Pipeline ({CANDIDATES_PIPELINE.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-64 sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search jobs or applicants..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>
      </div>

      {/* ── Requisitions Tab ────────────────────────────────────────── */}
      {activeTab === 'requisitions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Job Title & Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Facility / Location</th>
                  <th className="px-6 py-4">Openings</th>
                  <th className="px-6 py-4">Salary Range</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingReqs ? (
                  <tr><td colSpan="7" className="text-center py-10 text-slate-400">Loading requisitions...</td></tr>
                ) : filteredRequisitions.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-10 text-slate-400 font-medium">No job requisitions found matching your query.</td></tr>
                ) : (
                  filteredRequisitions.map(req => {
                    const title = req.title || req.jobTitle || 'Clinical Specialist';
                    const openings = req.vacancyCount || req.headcount || 1;
                    const location = req.branch?.name || req.location || 'Main Hospital Campus';
                    const salary = req.minSalary && req.maxSalary 
                      ? `₹${(req.minSalary / 1000).toFixed(0)}k - ₹${(req.maxSalary / 1000).toFixed(0)}k` 
                      : 'Market Standard';

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 text-sm">{title}</p>
                          <p className="text-[11px] font-medium text-slate-400 mt-0.5">ID #{req.id} • Posted Active</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">{req.department}</td>
                        <td className="px-6 py-4 font-semibold text-slate-600">{location}</td>
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md text-[11px]">
                            {openings} {openings > 1 ? 'Positions' : 'Position'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">{salary}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {req.status || 'POSTED'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setActiveTab('applications')}
                            className="text-indigo-600 hover:text-indigo-800 font-bold text-xs cursor-pointer hover:underline"
                          >
                            View Pipeline →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Applications Pipeline Tab ───────────────────────────────── */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Target Position</th>
                  <th className="px-6 py-4">Experience</th>
                  <th className="px-6 py-4">Interview Score</th>
                  <th className="px-6 py-4">Pipeline Stage</th>
                  <th className="px-6 py-4">Applied Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
                          {c.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-[11px] font-medium text-slate-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{c.role}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{c.experience}</td>
                    <td className="px-6 py-4 font-black text-amber-600">★ {c.rating}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        c.stage === 'HIRED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        c.stage === 'OFFER_EXTENDED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        c.stage === 'INTERVIEW' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {c.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-500">{c.appliedDate}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toast.success(`Viewing candidate dossier for ${c.name}`)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold text-xs cursor-pointer hover:underline"
                      >
                        Review Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── New Job Requisition Modal ───────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-7 relative font-sans overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Create Job Requisition</h3>
                    <p className="text-xs text-slate-500">Post a new vacancy for hospital recruitment</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Job Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Pediatrician"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Emergency & Trauma">Emergency & Trauma</option>
                      <option value="Inpatient Care">Inpatient Care</option>
                      <option value="Pharmacy Operations">Pharmacy Operations</option>
                      <option value="Diagnostic Imaging">Diagnostic Imaging</option>
                      <option value="Pathology Laboratory">Pathology Laboratory</option>
                      <option value="Administration">Administration</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Openings / Vacancies
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.vacancyCount}
                      onChange={e => setFormData({ ...formData, vacancyCount: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Minimum Monthly Salary (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 60000"
                      value={formData.minSalary}
                      onChange={e => setFormData({ ...formData, minSalary: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Maximum Monthly Salary (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 90000"
                      value={formData.maxSalary}
                      onChange={e => setFormData({ ...formData, maxSalary: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Qualifications & Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={formData.requiredQualifications}
                    onChange={e => setFormData({ ...formData, requiredQualifications: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus size={15} /> Publish Requisition
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
