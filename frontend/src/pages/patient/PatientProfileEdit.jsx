import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { staggerChildren, fadeUp } from '../../components/ui/motion';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';

const PatientProfileEdit = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const [formData, setFormData] = useState({
        dateOfBirth: '',
        gender: '',
        bloodGroup: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        address: '',
        medicalHistorySummary: '',
        branchId: 1 // default branch
    });
    const [error, setError] = useState('');

    const { data: profile, isLoading } = useQuery({
        queryKey: ['patientProfile', user?.id],
        queryFn: async () => {
            const res = await axiosPrivate.get(`/patients/profile/${user.id}`);
            return res.data;
        },
        enabled: !!user?.id,
        retry: false // If 404, it means no profile exists
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                dateOfBirth: profile.dateOfBirth || '',
                gender: profile.gender || '',
                bloodGroup: profile.bloodGroup || '',
                emergencyContactName: profile.emergencyContactName || '',
                emergencyContactPhone: profile.emergencyContactPhone || '',
                address: profile.address || '',
                medicalHistorySummary: profile.medicalHistorySummary || '',
                branchId: profile.branchId || 1
            });
        }
    }, [profile]);

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await axiosPrivate.post('/patients/profile', data);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Profile updated successfully!');
            queryClient.invalidateQueries(['patientProfile', user?.id]);
            navigate('/patient/dashboard');
        },
        onError: (err) => {
            const msg = err.response?.data?.message || 'Failed to save profile';
            setError(msg);
            toast.error(msg);
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        mutation.mutate(formData);
    };

    if (isLoading && !profile) {
        return <PageLoadingSkeleton />;
    }

    return (
        <motion.div 
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
            className="p-4 sm:p-6 lg:p-8"
        >
            <motion.div variants={fadeUp} className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-[var(--color-text)]">Edit Profile</h2>
                <p className="text-[var(--color-text-muted)]">Keep your medical information up to date.</p>
            </motion.div>
            
            <motion.form variants={fadeUp} onSubmit={handleSubmit} className="card p-6 flex flex-col gap-6">
                {error && <div className="text-[var(--color-danger)] text-sm font-medium">{error}</div>}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="label-caps block mb-2">Date of Birth</label>
                        <input 
                            type="date" 
                            name="dateOfBirth"
                            value={formData.dateOfBirth} 
                            onChange={handleChange} 
                            className="input-field w-full focus:ring-2 focus:ring-blue-500/20"
                            required
                        />
                    </div>
                    <div>
                        <label className="label-caps block mb-2">Gender</label>
                        <select 
                            name="gender"
                            value={formData.gender} 
                            onChange={handleChange} 
                            className="input-field w-full focus:ring-2 focus:ring-blue-500/20"
                            required
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="label-caps block mb-2">Blood Group</label>
                        <select 
                            name="bloodGroup"
                            value={formData.bloodGroup} 
                            onChange={handleChange} 
                            className="input-field w-full focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="">Select (Optional)</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                        <h3 className="text-lg font-bold mb-4">Additional Info</h3>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="label-caps block mb-2">Address</label>
                        <textarea 
                            name="address"
                            value={formData.address} 
                            onChange={handleChange} 
                            rows="3"
                            className="input-field w-full resize-y focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Full residential address"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="label-caps block mb-2">Medical History Summary (Optional)</label>
                        <textarea 
                            name="medicalHistorySummary"
                            value={formData.medicalHistorySummary} 
                            onChange={handleChange} 
                            rows="3"
                            className="input-field w-full resize-y focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Briefly describe any chronic conditions or past surgeries."
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                    <button 
                        type="button" 
                        onClick={() => navigate('/patient/dashboard')} 
                        className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] font-medium hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] transition-colors focus:ring-2 focus:ring-blue-500/20"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={mutation.isPending} 
                        className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2"
                    >
                        {mutation.isPending && (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"/>
                        )}
                        {mutation.isPending ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </motion.form>
        </motion.div>
    );
};

export default PatientProfileEdit;
