import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { CheckCircle, AlertCircle, Clock, Loader2, Plus, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition, staggerChildren, fadeUp, listStagger } from '../../components/ui/motion';

const Insurance = () => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [provider, setProvider] = useState('');
    const [policyNumber, setPolicyNumber] = useState('');
    const [claimAmount, setClaimAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [showForm, setShowForm] = useState(false);

    const { data: claims, isLoading } = useQuery({
        queryKey: ['insuranceClaims'],
        queryFn: async () => {
            const res = await axiosPrivate.get('/v1/patient/insurance');
            return res.data;
        }
    });

    const submitMutation = useMutation({
        mutationFn: async (newClaim) => {
            const res = await axiosPrivate.post('/v1/patient/insurance', newClaim);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['insuranceClaims']);
            setShowForm(false);
            setProvider('');
            setPolicyNumber('');
            setClaimAmount('');
            setNotes('');
            toast.success('Claim submitted successfully.');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        submitMutation.mutate({
            provider,
            policyNumber,
            claimAmount: parseFloat(claimAmount),
            notes
        });
    };

    const getStatusIcon = (status) => {
        const s = status.toLowerCase();
        if (s.includes('approved') || s.includes('completed')) return <CheckCircle size={18} className="text-emerald-500" />;
        if (s.includes('rejected') || s.includes('denied')) return <AlertCircle size={18} className="text-rose-500" />;
        return <Clock size={18} className="text-blue-500" />;
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>;
    }

    return (
        <motion.div 
            variants={pageTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto"
        >
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Insurance Claims</h2>
                    <p className="text-slate-500 mt-1">Manage and track your health insurance claims.</p>
                </div>
                {!showForm && (
                    <button 
                        onClick={() => setShowForm(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2"
                    >
                        <Plus size={18} /> New Claim
                    </button>
                )}
            </motion.div>

            <AnimatePresence>
            {showForm && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm mb-8 overflow-hidden"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Shield size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Submit New Claim</h3>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Provider</label>
                                <input 
                                    type="text" 
                                    required
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value)}
                                    placeholder="e.g. Blue Cross"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Policy Number</label>
                                <input 
                                    type="text" 
                                    required
                                    value={policyNumber}
                                    onChange={(e) => setPolicyNumber(e.target.value)}
                                    placeholder="e.g. POL-12345"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Claim Amount ($)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                required
                                value={claimAmount}
                                onChange={(e) => setClaimAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full md:w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any details for the billing department..."
                                rows="3"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                            ></textarea>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                type="submit" 
                                disabled={submitMutation.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 flex-1 md:flex-none md:w-40"
                            >
                                {submitMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Submit'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setShowForm(false)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}
            </AnimatePresence>

            <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {claims?.length === 0 ? (
                    <div className="p-10 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield size={28} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No Claims Yet</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">You haven't submitted any insurance claims. Use the button above to start a new claim.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Provider / Policy</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <motion.tbody 
                                variants={staggerChildren}
                                initial="hidden"
                                animate="visible"
                                className="divide-y divide-slate-100"
                            >
                                {claims?.map((claim) => (
                                    <motion.tr variants={listStagger} key={claim.id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-800">
                                                {new Date(claim.submittedAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                ID: CLM-{claim.id}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-slate-800">{claim.provider}</div>
                                            <div className="text-xs text-slate-500">Pol: {claim.policyNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-bold text-slate-800">${claim.claimAmount.toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(claim.status)}
                                                <span className="text-sm font-medium text-slate-700">{claim.status}</span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default Insurance;
