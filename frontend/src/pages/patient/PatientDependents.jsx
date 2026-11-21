import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Activity, 
  Trash2, 
  Loader2, 
  Save, 
  X, 
  Heart, 
  ShieldAlert, 
  Phone, 
  Droplet, 
  CalendarPlus, 
  User, 
  Sparkles, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { axiosPrivate } from '../../api/axios';
import { fadeUp, listStagger, pageTransition, staggerChildren } from '../../components/ui/motion';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const PatientDependents = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const initialFormState = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    relationship: 'Child',
    customRelationship: '',
    bloodGroup: '',
    contactNumber: '',
    allergies: '',
    medicalHistorySummary: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const { data: dependents = [], isLoading, error } = useQuery({
    queryKey: ['dependents'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/v1/patient/settings/dependents');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newDependent) => {
      const res = await axiosPrivate.post('/v1/patient/settings/dependents', newDependent);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependents'] });
      setIsAdding(false);
      setFormData(initialFormState);
      toast.success('Family dependent registered successfully!');
    },
    onError: () => toast.error('Failed to add dependent')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosPrivate.delete(`/v1/patient/settings/dependents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependents'] });
      setDeleteId(null);
      toast.success('Dependent profile removed');
    },
    onError: () => {
      setDeleteId(null);
      toast.error('Failed to remove dependent');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.dateOfBirth) {
      toast.error('Please fill in required fields (Name and Date of Birth)');
      return;
    }

    if (formData.relationship === 'Other' && !formData.customRelationship.trim()) {
      toast.error('Please specify the relationship detail');
      return;
    }

    const payload = {
      ...formData,
      relationship: formData.relationship === 'Other' ? formData.customRelationship.trim() : formData.relationship
    };

    addMutation.mutate(payload);
  };

  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    const ageYears = Math.abs(ageDt.getUTCFullYear() - 1970);
    if (ageYears === 0) {
      const diffMonths = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375)));
      return `${diffMonths} months`;
    }
    return `${ageYears} yrs`;
  };

  // Metrics calculation
  const totalCount = dependents.length;
  const childrenCount = dependents.filter(d => (d.relationship || '').toLowerCase() === 'child').length;
  const spouseCount = dependents.filter(d => (d.relationship || '').toLowerCase() === 'spouse').length;
  const parentCount = dependents.filter(d => (d.relationship || '').toLowerCase() === 'parent').length;

  if (isLoading) {
    return (
      <div className="p-24 flex flex-col items-center justify-center gap-4 text-slate-400 min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-[#2160FF]" />
        <p className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Loading family profiles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-rose-600 font-bold text-center">
        Error loading dependents: {error.message}
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-[#F8FAFC] min-h-screen"
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Top Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#2160FF] rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Family & Dependents
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
                Manage healthcare profiles, appointments, and medical histories for your family members in one place
              </p>
            </div>
          </div>
        </div>

        {!isAdding && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 bg-[#2160FF] hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 font-extrabold text-xs cursor-pointer border-none"
          >
            <UserPlus size={16} />
            Add Dependent
          </motion.button>
        )}
      </motion.div>

      {/* KPI Overview Strip (When dependents exist) */}
      {totalCount > 0 && (
        <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Registered</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{totalCount} Members</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2160FF] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Children</p>
              <h3 className="text-xl font-black text-emerald-600 mt-0.5">{childrenCount} Children</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Heart className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Spouse / Partner</p>
              <h3 className="text-xl font-black text-purple-600 mt-0.5">{spouseCount} Spouse</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Parents / Other</p>
              <h3 className="text-xl font-black text-amber-600 mt-0.5">{parentCount + (totalCount - childrenCount - spouseCount - parentCount)} Members</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Register New Dependent Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit} 
            className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80 mb-8 relative"
          >
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
              title="Close Form"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
              <div className="p-2 bg-blue-50 text-[#2160FF] rounded-xl">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Register New Dependent</h3>
                <p className="text-xs text-slate-400 font-medium">Add clinical and personal details to link family member to your patient portal</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Section 1: Personal & Demographic Info */}
              <div>
                <h4 className="text-xs font-extrabold text-[#2160FF] uppercase tracking-wider mb-3">
                  1. Personal & Demographic Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      First Name *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={formData.firstName} 
                      onChange={e => setFormData({...formData, firstName: e.target.value})} 
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] focus:bg-white outline-none transition-all text-xs font-semibold text-slate-800" 
                      placeholder="e.g. Sarah" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Last Name *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={formData.lastName} 
                      onChange={e => setFormData({...formData, lastName: e.target.value})} 
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] focus:bg-white outline-none transition-all text-xs font-semibold text-slate-800" 
                      placeholder="e.g. Connor" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Relationship *
                    </label>
                    <select 
                      value={formData.relationship} 
                      onChange={e => setFormData({...formData, relationship: e.target.value})} 
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] focus:bg-white outline-none transition-all text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="Child">Child (Son / Daughter)</option>
                      <option value="Spouse">Spouse / Partner</option>
                      <option value="Parent">Parent (Mother / Father)</option>
                      <option value="Sibling">Sibling (Brother / Sister)</option>
                      <option value="Other">Other (Please specify)</option>
                    </select>
                  </div>

                  {formData.relationship === 'Other' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1.5"
                    >
                      <label className="block text-xs font-bold text-[#2160FF] uppercase tracking-wider">
                        Specify Relationship Detail *
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={formData.customRelationship} 
                        onChange={e => setFormData({...formData, customRelationship: e.target.value})} 
                        className="w-full px-3.5 py-2.5 bg-blue-50/40 border border-blue-200 rounded-xl focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] focus:bg-white outline-none transition-all text-xs font-semibold text-slate-800" 
                        placeholder="e.g. Grandmother, Uncle, Guardian, In-law..." 
                      />
                    </motion.div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Date of Birth *
                    </label>
                    <input 
                      type="date" 
                      required 
                      value={formData.dateOfBirth} 
                      onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} 
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] focus:bg-white outline-none transition-all text-xs font-semibold text-slate-800" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Gender *
                    </label>
                    <select 
                      value={formData.gender} 
                      onChange={e => setFormData({...formData, gender: e.target.value})} 
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] focus:bg-white outline-none transition-all text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other / Non-Binary</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Contact Phone (Optional)
                    </label>
                    <input 
                      type="tel" 
                      value={formData.contactNumber} 
                      onChange={e => setFormData({...formData, contactNumber: e.target.value})} 
                      placeholder="+1 (555) 000-0000" 
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] focus:bg-white outline-none transition-all text-xs font-semibold text-slate-800" 
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Clinical & Emergency Data */}
              <div>
                <h4 className="text-xs font-extrabold text-[#2160FF] uppercase tracking-wider mb-3">
                  2. Clinical & Medical Profiles
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Blood Group
                    </label>
                    <select 
                      value={formData.bloodGroup} 
                      onChange={e => setFormData({...formData, bloodGroup: e.target.value})} 
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] focus:bg-white outline-none transition-all text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="">Unknown / Not Tested</option>
                      <option value="A+">A Positive (A+)</option>
                      <option value="A-">A Negative (A-)</option>
                      <option value="B+">B Positive (B+)</option>
                      <option value="B-">B Negative (B-)</option>
                      <option value="AB+">AB Positive (AB+)</option>
                      <option value="AB-">AB Negative (AB-)</option>
                      <option value="O+">O Positive (O+)</option>
                      <option value="O-">O Negative (O-)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Known Allergies (Drugs, Food, Seasonal)
                    </label>
                    <input 
                      type="text" 
                      value={formData.allergies} 
                      onChange={e => setFormData({...formData, allergies: e.target.value})} 
                      placeholder="e.g. Penicillin, Peanuts, Sulfa drugs" 
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] focus:bg-white outline-none transition-all text-xs font-semibold text-slate-800" 
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Medical History Summary */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Medical History Summary (Chronic conditions, previous surgeries, or ongoing treatments)
                </label>
                <textarea 
                  value={formData.medicalHistorySummary} 
                  onChange={e => setFormData({...formData, medicalHistorySummary: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] focus:bg-white outline-none transition-all text-xs font-medium text-slate-800 resize-none" 
                  rows={3} 
                  placeholder="e.g. Mild asthma (uses albuterol as needed), no prior hospitalizations, routine pediatric immunizations up to date..."
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)} 
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer bg-white border border-slate-200"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={addMutation.isPending} 
                className="px-6 py-2.5 bg-[#2160FF] hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer border-none"
              >
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {addMutation.isPending ? 'Saving...' : 'Register Dependent'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Main Dependents Grid */}
      <motion.div 
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
        className="w-full"
      >
        {dependents.length === 0 ? (
          <motion.div variants={listStagger} className="w-full bg-white rounded-2xl p-10 sm:p-14 text-center shadow-2xs border border-slate-200/80 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 text-[#2160FF] rounded-2xl flex items-center justify-center mb-4 shadow-xs">
              <Users size={32} />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-1.5">No family dependents added yet</h3>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-md mb-6 leading-relaxed">
              Add your children, spouse, or elderly parents to easily book appointments, track prescriptions, and access their lab results.
            </p>

            {/* Benefits Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mb-8 text-left">
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs mb-1">
                  <CalendarPlus className="w-4 h-4 text-[#2160FF]" /> Book On Their Behalf
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Schedule doctor consultations for family members under one account.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs mb-1">
                  <FileText className="w-4 h-4 text-emerald-600" /> Unified Medical Records
                </div>
                <p className="text-[11px] text-slate-500 font-medium">View prescriptions, vaccine records, and diagnostic lab reports.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs mb-1">
                  <ShieldAlert className="w-4 h-4 text-purple-600" /> Emergency Alerts
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Maintain vital blood groups and allergen lists for immediate care.</p>
              </div>
            </div>

            <button 
              onClick={() => setIsAdding(true)} 
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2160FF] hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer border-none"
            >
              <UserPlus size={16} /> Add Your First Family Dependent
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dependents.map(dep => {
              const age = calculateAge(dep.dateOfBirth);
              const initials = `${(dep.firstName || '')[0] || ''}${(dep.lastName || '')[0] || ''}`.toUpperCase();

              return (
                <motion.div 
                  key={dep.id} 
                  variants={listStagger}
                  className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-200/80 transition-all relative overflow-hidden group flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Avatar, Name & Delete Button */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-blue-50 text-[#2160FF] border border-blue-100 rounded-2xl flex items-center justify-center font-black text-base shrink-0 group-hover:scale-105 transition-transform">
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-black text-base text-slate-900 tracking-tight leading-tight">
                            {dep.firstName} {dep.lastName}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#2160FF] text-[10px] font-black uppercase tracking-wider">
                              {dep.relationship || 'Dependent'}
                            </span>
                            {dep.bloodGroup && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-black border border-rose-100">
                                {dep.bloodGroup}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setDeleteId(dep.id)} 
                        className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-xl transition-all opacity-80 group-hover:opacity-100 cursor-pointer border-none bg-transparent" 
                        title="Remove Dependent"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Demographics Pill Bar */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-500 mb-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" /> 
                        {dep.dateOfBirth ? new Date(dep.dateOfBirth).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'DOB N/A'}
                        {age && <span className="font-extrabold text-slate-800 ml-1">({age})</span>}
                      </span>
                      {dep.gender && (
                        <span className="text-slate-600 font-bold">
                          • {dep.gender}
                        </span>
                      )}
                      {dep.contactNumber && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Phone size={12} className="text-slate-400" />
                          {dep.contactNumber}
                        </span>
                      )}
                    </div>

                    {/* Allergies Alert if present */}
                    {dep.allergies && (
                      <div className="mb-3 px-3 py-2 bg-rose-50/60 rounded-xl border border-rose-100 flex items-center gap-2 text-xs">
                        <ShieldAlert size={14} className="text-rose-600 shrink-0" />
                        <span className="text-slate-600">
                          <strong className="text-rose-700 font-bold">Allergies:</strong> {dep.allergies}
                        </span>
                      </div>
                    )}

                    {/* Medical History */}
                    {dep.medicalHistorySummary ? (
                      <div className="p-3 bg-slate-50/70 rounded-xl text-xs text-slate-600 flex items-start gap-2.5 border border-slate-100 mb-4">
                        <Activity size={14} className="text-[#2160FF] shrink-0 mt-0.5" />
                        <p className="leading-relaxed font-medium line-clamp-3">{dep.medicalHistorySummary}</p>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-50/40 rounded-xl text-[11px] text-slate-400 italic flex items-center justify-center border border-slate-100 border-dashed mb-4">
                        No chronic medical conditions recorded.
                      </div>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Profile Linked</span>
                    <button
                      onClick={() => navigate('/patient/appointments', { state: { dependentName: `${dep.firstName} ${dep.lastName}`, dependentId: dep.id } })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#2160FF] hover:bg-blue-50 transition-colors cursor-pointer border-none bg-transparent"
                    >
                      <CalendarPlus size={14} /> Book Appointment
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Remove Family Dependent"
        description="Are you sure you want to remove this family member? Their records will be unlinked from your guardian portal."
        confirmText="Yes, Remove Dependent"
        isLoading={deleteMutation.isPending}
      />
    </motion.div>
  );
};

export default PatientDependents;
