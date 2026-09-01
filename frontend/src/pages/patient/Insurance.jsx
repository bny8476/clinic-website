import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { fadeUp, listStagger, pageTransition, staggerChildren } from '../../components/ui/motion';
import { AlertCircle, CheckCircle, Clock, Loader2, Plus, Shield, ShieldCheck, FileText, Calendar, IndianRupee } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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
        if (s.includes('approved') || s.includes('completed')) return <CheckCircle size={16} className="text-emerald-500" />;
        if (s.includes('rejected') || s.includes('denied')) return <AlertCircle size={16} className="text-rose-500" />;
        return <Clock size={16} className="text-blue-500" />;
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-[#2864FF] w-8 h-8" /></div>;
    }

    return (
        <motion.div 
            variants={pageTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="min-h-screen bg-[#fafbfc] p-6 lg:p-10 font-sans"
        >
            <div className="max-w-[1200px] mx-auto">
                <AnimatePresence>
                {showForm && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.03)] mb-8 overflow-hidden"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-[#F0F5FF] text-[#2864FF] flex items-center justify-center border border-blue-50">
                                <Shield size={20} />
                            </div>
                            <h3 className="text-lg font-extrabold text-slate-900">Submit New Claim</h3>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Insurance Provider</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={provider}
                                        onChange={(e) => setProvider(e.target.value)}
                                        placeholder="e.g. Blue Cross"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF] outline-none transition text-[13px]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Policy Number</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={policyNumber}
                                        onChange={(e) => setPolicyNumber(e.target.value)}
                                        placeholder="e.g. POL-12345"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF] outline-none transition text-[13px]"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Claim Amount</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    value={claimAmount}
                                    onChange={(e) => setClaimAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full md:w-1/2 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF] outline-none transition text-[13px]"
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Additional Notes</label>
                                <textarea 
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any details for the billing department..."
                                    rows="3"
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2864FF]/20 focus:border-[#2864FF] outline-none transition resize-none text-[13px]"
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="submit" 
                                    disabled={submitMutation.isPending}
                                    className="bg-[#2864FF] hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-[13px] transition flex items-center justify-center gap-2 flex-1 md:flex-none md:w-40 shadow-[0_2px_12px_rgba(40,100,255,0.25)]"
                                >
                                    {submitMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Submit'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowForm(false)}
                                    className="bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-semibold text-[13px] transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
                </AnimatePresence>

                <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
                    {/* Header inside card */}
                    <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-[14px] bg-[#F0F5FF] flex items-center justify-center shrink-0 shadow-sm border border-blue-50">
                               <FileText className="w-6 h-6 text-[#2864FF]" />
                               <ShieldCheck className="w-4 h-4 text-[#2864FF] absolute translate-x-2 translate-y-2 bg-[#F0F5FF] rounded-full" />
                           </div>
                           <div>
                              <h2 className="text-[22px] font-extrabold text-slate-900 mb-0.5 tracking-tight">Insurance Claims</h2>
                              <p className="text-[13.5px] font-medium text-slate-500">Manage and track your health insurance claims.</p>
                           </div>
                        </div>
                        {!showForm && (
                           <button 
                              onClick={() => setShowForm(true)}
                              className="bg-[#2864FF] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-[13px] flex items-center gap-2 transition-all shadow-[0_2px_12px_rgba(40,100,255,0.25)] cursor-pointer"
                           >
                              <Plus className="w-4 h-4" /> New Claim
                           </button>
                        )}
                    </div>

                    {/* Table Header Row (always visible to match image) */}
                    <div className="bg-[#F8FAFC] border-y border-[#E8F0FE] grid grid-cols-4 px-6 md:px-8 py-3.5">
                        <div className="text-[11px] font-bold text-slate-500 tracking-widest flex items-center gap-1.5"><Calendar size={14}/> DATE</div>
                        <div className="text-[11px] font-bold text-slate-500 tracking-widest flex items-center gap-1.5"><ShieldCheck size={14}/> PROVIDER / POLICY</div>
                        <div className="text-[11px] font-bold text-slate-500 tracking-widest flex items-center gap-1.5"><IndianRupee size={14}/> AMOUNT</div>
                        <div className="text-[11px] font-bold text-slate-500 tracking-widest flex items-center gap-1.5"><Clock size={14}/> STATUS</div>
                    </div>

                    {(!claims || claims.length === 0) ? (
                        <div className="relative min-h-[420px] flex flex-col items-center justify-center p-10 overflow-hidden">
                           {/* Decorative Elements */}
                           <div className="absolute top-1/2 -translate-y-1/2 left-10 w-32 h-32 bg-[#F8FAFC] rounded-full blur-[40px] pointer-events-none"></div>
                           <div className="absolute top-1/2 -translate-y-1/2 right-10 w-48 h-48 bg-[#F8FAFC] rounded-full blur-[40px] pointer-events-none"></div>

                           <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
                              {/* Custom Illustration */}
                              <div className="relative w-[160px] h-[160px] mb-6 flex items-center justify-center">
                                 <div className="absolute inset-0 bg-[#F5F8FF] rounded-full scale-[0.85]"></div>
                                 
                                 <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                                    {/* Document */}
                                    <path d="M40 30H65L80 45V85C80 87.7614 77.7614 90 75 90H40C37.2386 90 35 87.7614 35 85V35C35 32.2386 37.2386 30 40 30Z" fill="white" stroke="#2864FF" strokeWidth="2.5" />
                                    {/* Folded Corner */}
                                    <path d="M65 30V45H80" fill="#D0E2FF" stroke="#2864FF" strokeWidth="2.5" strokeLinejoin="round" />
                                    {/* Text Lines */}
                                    <path d="M45 50H70 M45 58H70 M45 66H60 M45 74H55" stroke="#A6C8FF" strokeWidth="2.5" strokeLinecap="round" />
                                    
                                    {/* Shield overlapping */}
                                    <path d="M85 65C85 65 95 68 95 80C95 90 85 98 85 98C85 98 75 90 75 80C75 68 85 65 85 65Z" fill="#E8F0FE" stroke="#2864FF" strokeWidth="2.5" strokeLinejoin="round" />
                                    <path d="M81 82L84 85L89 77" stroke="#2864FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                                    {/* Sparkles */}
                                    <path d="M25 45L27 48L30 50L27 52L25 55L23 52L20 50L23 48L25 45Z" fill="#2864FF" fillOpacity="0.5"/>
                                    <path d="M90 35L91 38L94 39L91 40L90 43L89 40L86 39L89 38L90 35Z" fill="#2864FF" fillOpacity="0.4"/>
                                    <circle cx="25" cy="70" r="2" fill="#2864FF" fillOpacity="0.4"/>
                                 </svg>
                              </div>

                              <h2 className="text-[20px] font-extrabold text-slate-900 mb-2">No Claims Found</h2>
                              <p className="text-[13.5px] text-slate-500 mb-8 font-medium">
                                 You haven't submitted or tracked any insurance claims yet.
                              </p>

                              <button 
                                 onClick={() => setShowForm(true)}
                                 className="bg-[#F8FAFC] border border-[#D0E2FF] hover:bg-[#F0F5FF] hover:border-[#A6C8FF] text-[#2864FF] px-8 py-2.5 rounded-[12px] font-semibold text-[13px] flex items-center gap-2 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                              >
                                 <Plus className="w-4 h-4" /> Create Your First Claim
                              </button>
                           </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto min-h-[300px]">
                            <motion.div 
                                variants={staggerChildren}
                                initial="hidden"
                                animate="visible"
                                className="divide-y divide-slate-100 flex flex-col"
                            >
                                {claims.map((claim) => (
                                    <motion.div variants={listStagger} key={claim.id} className="grid grid-cols-4 px-6 md:px-8 py-5 hover:bg-slate-50/50 transition">
                                        <div className="flex flex-col justify-center">
                                            <div className="text-[13.5px] font-bold text-slate-900">
                                                {new Date(claim.submittedAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                                                ID: CLM-{claim.id}
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <div className="text-[13.5px] font-bold text-slate-900">{claim.provider || claim.providerName}</div>
                                            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Pol: {claim.policyNumber}</div>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <div className="text-[14px] font-extrabold text-slate-900 flex items-center">
                                                <IndianRupee size={13} className="text-slate-400 mr-0.5" />
                                                {(claim.claimAmount || claim.estimatedCost || 0).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                                                {getStatusIcon(claim.status)}
                                                <span className="text-[12px] font-bold text-slate-700">{claim.status}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default Insurance;
