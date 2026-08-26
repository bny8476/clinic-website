import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { fadeUp, listStagger, pageTransition, staggerChildren } from '../../components/ui/motion';
import { Activity, Calendar, CheckCircle, Clock, FileOutput, FileText, Home, Loader2, Video, CalendarDays } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';

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
        case 'APPOINTMENT': return 'bg-blue-50 text-[#2864FF] border-blue-100';
        case 'HOME_VISIT': return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'TELECONSULTATION': return 'bg-purple-50 text-purple-600 border-purple-100';
        case 'LAB_REPORT': return 'bg-rose-50 text-rose-600 border-rose-100';
        case 'PRESCRIPTION': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
};

const getStatusBadge = (status) => {
    if (!status) return null;
    const lowerStatus = status.toLowerCase();
    
    if (['completed', 'verified', 'released', 'done'].includes(lowerStatus)) {
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-600 border border-emerald-100"><CheckCircle size={12} /> {status}</span>;
    }
    if (['scheduled', 'in progress', 'requested', 'active'].includes(lowerStatus)) {
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-50 text-[#2864FF] border border-blue-100"><Clock size={12} /> {status}</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-slate-50 text-slate-600 border border-slate-100">{status}</span>;
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
                <Loader2 className="animate-spin text-[#2864FF] w-8 h-8" />
            </div>
        );
    }

    return (
        <motion.div 
            variants={pageTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="min-h-screen bg-[#fafbfc] p-6 lg:p-10 font-sans"
        >
            {/* Header */}
            <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[14px] bg-[#F0F5FF] flex items-center justify-center shrink-0 shadow-sm border border-blue-50 relative">
                        <Calendar className="w-6 h-6 text-[#2864FF]" />
                        <Clock className="w-4 h-4 text-[#2864FF] absolute bottom-3 right-3 bg-[#F0F5FF] rounded-full" />
                    </div>
                    <div>
                        <h1 className="text-[22px] font-extrabold text-slate-900 mb-0.5 tracking-tight">Health Timeline</h1>
                        <p className="text-[13.5px] font-medium text-slate-500">A chronological history of your interactions and medical records.</p>
                    </div>
                </div>
            </div>

            {/* Main Card Container */}
            <div className="max-w-[1200px] mx-auto">
                {(!timelineEvents || timelineEvents.length === 0) ? (
                    <div className="relative bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-10">
                        
                        {/* Decorative Grid - Top Left */}
                        <div className="absolute top-10 left-10 text-[#E8F0FE] pointer-events-none">
                            <svg width="60" height="60" fill="currentColor" viewBox="0 0 60 60">
                                <pattern id="grid1" width="12" height="12" patternUnits="userSpaceOnUse">
                                    <circle cx="2" cy="2" r="1.5" />
                                </pattern>
                                <rect width="60" height="60" fill="url(#grid1)" />
                            </svg>
                        </div>

                        {/* Decorative Circle - Mid Left */}
                        <div className="absolute top-1/2 -left-16 -translate-y-1/2 w-32 h-32 bg-[#F8FAFC] rounded-full blur-[40px] pointer-events-none"></div>

                        {/* Decorative Grid & Circle - Bottom Right */}
                        <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] bg-[#F8FAFC] rounded-full blur-[50px] pointer-events-none"></div>
                        <div className="absolute bottom-10 right-10 text-[#E8F0FE] pointer-events-none">
                            <svg width="60" height="60" fill="currentColor" viewBox="0 0 60 60">
                                <pattern id="grid2" width="12" height="12" patternUnits="userSpaceOnUse">
                                    <circle cx="2" cy="2" r="1.5" />
                                </pattern>
                                <rect width="60" height="60" fill="url(#grid2)" />
                            </svg>
                        </div>

                        {/* Empty State Content */}
                        <div className="relative z-10 flex flex-col items-center text-center max-w-sm mt-4">
                            
                            {/* Custom Illustration */}
                            <div className="relative w-[180px] h-[180px] mb-6 flex items-center justify-center">
                                <div className="absolute inset-0 bg-[#F5F8FF] rounded-full scale-[0.85]"></div>
                                
                                <svg width="140" height="140" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                                    {/* Clipboard Back */}
                                    <rect x="35" y="25" width="50" height="70" rx="4" fill="#E8F0FE" />
                                    
                                    {/* Paper */}
                                    <rect x="40" y="35" width="40" height="60" rx="2" fill="white" />
                                    
                                    {/* Bullet 1 */}
                                    <circle cx="48" cy="45" r="3" fill="#A6C8FF" />
                                    <path d="M55 45H72" stroke="#D0E2FF" strokeWidth="2.5" strokeLinecap="round" />
                                    
                                    {/* Bullet 2 */}
                                    <circle cx="48" cy="55" r="3" fill="#2864FF" />
                                    <path d="M55 55H68" stroke="#D0E2FF" strokeWidth="2.5" strokeLinecap="round" />

                                    {/* Bullet 3 */}
                                    <circle cx="48" cy="65" r="3" fill="#A6C8FF" />
                                    <path d="M55 65H75" stroke="#D0E2FF" strokeWidth="2.5" strokeLinecap="round" />
                                    
                                    {/* Clip */}
                                    <path d="M50 22C50 20.3431 51.3431 19 53 19H67C68.6569 19 70 20.3431 70 22V28H50V22Z" fill="#2864FF" />
                                    <circle cx="60" cy="23" r="2" fill="white" />

                                    {/* Clock Overlapping */}
                                    <circle cx="85" cy="75" r="18" fill="#2864FF" />
                                    <circle cx="85" cy="75" r="14" fill="#F0F5FF" fillOpacity="0.1" />
                                    {/* Clock hands */}
                                    <path d="M85 68V75L89 79" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                                    {/* Decorative Sparkles */}
                                    <path d="M20 45L22 50L27 52L22 54L20 59L18 54L13 52L18 50L20 45Z" fill="#2864FF" fillOpacity="0.5"/>
                                    <path d="M95 35L96 38L99 39L96 40L95 43L94 40L91 39L94 38L95 35Z" fill="#2864FF" fillOpacity="0.4"/>
                                    <circle cx="85" cy="25" r="2" fill="#2864FF" fillOpacity="0.4"/>
                                    <circle cx="30" cy="85" r="1.5" fill="#2864FF" fillOpacity="0.5"/>

                                    {/* Decorative Plus sign in bg */}
                                    <path d="M25 35H31 M28 32V38" stroke="#A6C8FF" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d="M100 55H104 M102 53V57" stroke="#A6C8FF" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>

                            <h2 className="text-[20px] font-extrabold text-slate-900 mb-4">No History Found</h2>
                            
                            {/* Divider Line */}
                            <div className="flex gap-1 mb-4">
                                <div className="h-1 w-8 bg-[#2864FF] rounded-full"></div>
                                <div className="h-1 w-4 bg-[#E8F0FE] rounded-full"></div>
                            </div>

                            <p className="text-[13.5px] text-slate-500 mb-8 font-medium leading-relaxed">
                                Your timeline is empty. Appointments, lab results,<br/>and medical records will appear here.
                            </p>

                            <Link 
                                to="/patient/book"
                                className="bg-[#F8FAFC] border border-[#D0E2FF] hover:bg-[#F0F5FF] hover:border-[#A6C8FF] text-[#2864FF] px-8 py-2.5 rounded-[12px] font-semibold text-[13px] flex items-center gap-2 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                            >
                                <CalendarDays className="w-4 h-4" /> Book an Appointment
                            </Link>
                        </div>
                    </div>
                ) : (
                    <motion.div 
                        variants={staggerChildren}
                        className="relative bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-8 lg:p-12"
                    >
                        <div className="absolute left-10 md:left-14 top-12 bottom-12 w-0.5 bg-slate-100 hidden sm:block"></div>
                        
                        <AnimatePresence>
                        {timelineEvents.map((event) => {
                            const eventDate = new Date(event.eventDate);
                            const isToday = new Date().toDateString() === eventDate.toDateString();
                            
                            return (
                                <motion.div variants={listStagger} layout key={event.id} className="mb-10 sm:ml-8 relative group">
                                    {/* Timeline Dot/Icon */}
                                    <div className={`hidden sm:flex absolute -left-[54px] top-1 w-12 h-12 rounded-[14px] border border-white flex items-center justify-center shadow-sm z-10 ${getColorForType(event.type)}`}>
                                        {getIconForType(event.type)}
                                    </div>
                                    
                                    {/* Card */}
                                    <motion.div 
                                        whileHover={{ scale: 1.01, x: 2 }}
                                        className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group-hover:border-[#D0E2FF]"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    {/* Mobile Icon */}
                                                    <div className={`sm:hidden w-8 h-8 rounded-lg flex items-center justify-center ${getColorForType(event.type)}`}>
                                                        {getIconForType(event.type)}
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                                                    {getStatusBadge(event.status)}
                                                </div>
                                                <p className="text-[13.5px] text-slate-500 font-medium">{event.description}</p>
                                            </div>
                                            
                                            <div className="flex flex-col sm:items-end shrink-0">
                                                <span className={`text-[13px] font-bold ${isToday ? 'text-[#2864FF]' : 'text-slate-600'}`}>
                                                    {isToday ? 'Today' : eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                                                    {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            </div>
        </motion.div>
    );
};

export default HealthTimeline;
