import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { fadeUp, listStagger, pageTransition, staggerChildren } from '../../components/ui/motion';
import { AlertCircle, Loader2, Save, Trash2, UserPlus, Users, Calendar, Activity, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const PatientDependents = () => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    relationship: 'Child',
    medicalHistorySummary: ''
  });

  const { data: dependents, isLoading, error } = useQuery({
    queryKey: ['dependents'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/v1/patient/settings/dependents');
      return res.data;
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newDependent) => {
      const res = await axiosPrivate.post('/v1/patient/settings/dependents', newDependent);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dependents']);
      setIsAdding(false);
      setFormData({
        firstName: '', lastName: '', dateOfBirth: '', gender: 'Male', relationship: 'Child', medicalHistorySummary: ''
      });
      toast.success('Dependent added successfully');
    },
    onError: () => toast.error('Failed to add dependent')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosPrivate.delete(`/v1/patient/settings/dependents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dependents']);
      setDeleteId(null);
      toast.success('Dependent removed');
    },
    onError: () => {
      setDeleteId(null);
      toast.error('Failed to remove dependent');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-sm font-bold tracking-wide uppercase">Loading dependents...</p>
      </div>
    );
  }
  
  if (error) return <div className="p-8 text-red-500 font-semibold text-center">Error loading dependents: {error.message}</div>;

  return (
    <motion.div 
      className="p-4 sm:p-6 max-w-5xl mx-auto"
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 text-white shrink-0">
              <Users size={24} />
            </div>
            Family & Dependents
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage healthcare for your family members in one place.</p>
        </div>
        {!isAdding && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md font-bold text-sm"
          >
            <UserPlus size={18} />
            Add Dependent
          </motion.button>
        )}
      </motion.div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit} 
            className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 mb-8 relative"
          >
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <UserPlus className="text-blue-500" size={24} /> Register New Dependent
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                <input type="text" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-800" placeholder="e.g. Sarah" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                <input type="text" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-800" placeholder="e.g. Connor" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Birth</label>
                <input type="date" required value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-800" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Relationship</label>
                <select value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-800">
                  <option>Child</option>
                  <option>Spouse</option>
                  <option>Parent</option>
                  <option>Sibling</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Medical History Summary (Optional)</label>
                <textarea value={formData.medicalHistorySummary} onChange={e => setFormData({...formData, medicalHistorySummary: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-800 resize-none" rows={3} placeholder="Briefly describe any known allergies, chronic conditions, or ongoing treatments..."></textarea>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="submit" disabled={addMutation.isPending} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30">
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {addMutation.isPending ? 'Saving...' : 'Save Dependent'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <motion.div 
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {dependents?.length === 0 ? (
          <motion.div variants={listStagger} className="col-span-full bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <UserPlus size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">No dependents found</h3>
              <p className="text-slate-500 mt-1 font-medium">You haven't added any family members yet.</p>
            </div>
            <button onClick={() => setIsAdding(true)} className="mt-4 px-6 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors">
              Add your first dependent
            </button>
          </motion.div>
        ) : (
          dependents?.map(dep => (
            <motion.div 
              key={dep.id} 
              variants={listStagger}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group flex flex-col"
            >
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setDeleteId(dep.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors" title="Remove Dependent">
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-5">
                <div className="h-14 w-14 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-105 transition-transform">
                  {dep.firstName[0]}{dep.lastName[0]}
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900 tracking-tight">{dep.firstName} {dep.lastName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                      {dep.relationship}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500 mb-4">
                <span className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-slate-400" /> 
                  {new Date(dep.dateOfBirth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>

              {dep.medicalHistorySummary ? (
                <div className="mt-auto p-4 bg-slate-50 rounded-xl text-sm text-slate-600 flex items-start gap-3 border border-slate-100">
                  <Activity size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">{dep.medicalHistorySummary}</p>
                </div>
              ) : (
                <div className="mt-auto p-4 bg-slate-50/50 rounded-xl text-sm text-slate-400 italic flex items-center justify-center border border-slate-100 border-dashed">
                  No medical history provided.
                </div>
              )}
            </motion.div>
          ))
        )}
      </motion.div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Remove Dependent"
        description="Are you sure you want to remove this family member? Their records will be permanently unlinked from your account."
        confirmText="Yes, Remove"
        isLoading={deleteMutation.isPending}
      />
    </motion.div>
  );
};

export default PatientDependents;
