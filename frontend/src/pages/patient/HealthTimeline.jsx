import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Calendar, Home, Video, Activity, FileText, FileOutput, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition, staggerChildren, listStagger, fadeUp } from '../../components/ui/motion';

const getIconForType = (type) => {
    switch (type) {
        case 'APPOINTMENT': return <Calendar size={18} />;
        case 'HOME_VISIT': return <Home size={18} />;
        case 'TELECONSULTATION': return <Video size={18} />;
        case 'LAB_REPORT': return <Activity size={18} />;
        case 'PRESCRIPTION': return <FileText size={18} />;
        default: return <FileOutput size={18} />;
    }
};

const getColorForType = (type) => {
    switch (type) {
        case 'APPOINTMENT': return 'bg-blue-100 text-blue-600 border-blue-200';
        case 'HOME_VISIT': return 'bg-amber-100 text-amber-600 border-amber-200';
        case 'TELECONSULTATION': return 'bg-purple-100 text-purple-600 border-purple-200';
        case 'LAB_REPORT': return 'bg-rose-100 text-rose-600 border-rose-200';
        case 'PRESCRIPTION': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
        default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
};

const getStatusBadge = (status) => {
    if (!status) return null;
    const lowerStatus = status.toLowerCase();
    
    if (['completed', 'verified', 'released', 'done'].includes(lowerStatus)) {
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"><CheckCircle size={12} /> {status}</span>;
    }
    if (['scheduled', 'in progress', 'requested', 'active'].includes(lowerStatus)) {
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Clock size={12} /> {status}</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
};

const HealthTimeline = () => {
    const { data: timelineEvents, isLoading } = useQuery({
        queryKey: ['healthTimeline'],
        queryFn: async () => {
            const res = await axiosPrivate.get('/v1/patient/timeline');
            return res.data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
            </div>
        );
    }

    return (
        <motion.div 
            variants={pageTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto"
        >
            <motion.div variants={fadeUp} className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Health Timeline</h2>
                <p className="text-slate-500 mt-1">A chronological history of your interactions and medical records.</p>
            </motion.div>

            {timelineEvents?.length === 0 ? (
                <motion.div variants={fadeUp} className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
                    <Clock size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No History Found</h3>
                    <p className="text-slate-500">Your timeline is empty. Appointments and lab results will appear here.</p>
                </motion.div>
            ) : (
                <motion.div 
                    variants={staggerChildren}
                    className="relative border-l-2 border-slate-200 ml-4 md:ml-6 pb-4"
                >
                    <AnimatePresence>
                    {timelineEvents?.map((event, index) => {
                        const eventDate = new Date(event.eventDate);
                        const isToday = new Date().toDateString() === eventDate.toDateString();
                        
                        return (
                            <motion.div variants={listStagger} layout key={event.id} className="mb-10 ml-8 relative group">
                                {/* Timeline Dot/Icon */}
                                <div className={`absolute -left-[41px] top-1 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${getColorForType(event.type)}`}>
                                    {getIconForType(event.type)}
                                </div>
                                
                                {/* Card */}
                                <motion.div 
                                    whileHover={{ scale: 1.01, x: 2 }}
                                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all group-hover:border-slate-300"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-slate-800">{event.title}</h3>
                                                {getStatusBadge(event.status)}
                                            </div>
                                            <p className="text-slate-600">{event.description}</p>
                                        </div>
                                        
                                        <div className="flex flex-col sm:items-end shrink-0">
                                            <span className={`text-sm font-medium ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                                                {isToday ? 'Today' : eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-xs text-slate-400 mt-1">
                                                {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider mt-2">
                                                ID: {event.id}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                    </AnimatePresence>
                </motion.div>
            )}
        </motion.div>
    );
};

export default HealthTimeline;
