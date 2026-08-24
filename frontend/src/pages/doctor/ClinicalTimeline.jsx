import Card from '../../components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { format } from 'date-fns';
import { Activity, ClipboardCheck, FileSpreadsheet, FileText, Pill, Stethoscope, Syringe, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const getEventIcon = (type) => {
  switch (type) {
    case 'RADIOLOGY': return <FileText size={18} className="text-purple-500" />;
    case 'PRESCRIPTION': return <Pill size={18} className="text-orange-500" />;
    case 'CLINICAL_NOTE': return <Stethoscope size={18} className="text-blue-500" />;
    case 'INVOICE': return <FileSpreadsheet size={18} className="text-emerald-500" />;
    case 'DIAGNOSIS': return <Activity size={18} className="text-red-500" />;
    case 'PROCEDURE': return <ClipboardCheck size={18} className="text-indigo-500" />;
    case 'IMMUNIZATION': return <Syringe size={18} className="text-teal-500" />;
    case 'REFERRAL': return <Users size={18} className="text-pink-500" />;
    case 'LABORATORY': return <FileText size={18} className="text-cyan-500" />;
    default: return <Activity size={18} className="text-slate-500" />;
  }
};

const getEventColor = (type) => {
  switch (type) {
    case 'RADIOLOGY': return 'bg-purple-50 border-purple-100';
    case 'PRESCRIPTION': return 'bg-orange-50 border-orange-100';
    case 'CLINICAL_NOTE': return 'bg-blue-50 border-blue-100';
    case 'INVOICE': return 'bg-emerald-50 border-emerald-100';
    case 'DIAGNOSIS': return 'bg-red-50 border-red-100';
    case 'PROCEDURE': return 'bg-indigo-50 border-indigo-100';
    case 'IMMUNIZATION': return 'bg-teal-50 border-teal-100';
    case 'REFERRAL': return 'bg-pink-50 border-pink-100';
    case 'LABORATORY': return 'bg-cyan-50 border-cyan-100';
    default: return 'bg-slate-50 border-slate-100';
  }
};

const ClinicalTimeline = ({ patientId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['clinical-timeline', patientId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/patient/timeline/${patientId}`);
      return res.data;
    },
    enabled: !!patientId
  });

  if (isLoading) return <div className="text-center p-8 text-slate-500">Loading timeline...</div>;
  if (error) return <div className="text-center p-8 text-red-500">Error loading timeline</div>;

  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
      <h3 className="text-[15px] font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Activity size={18} className="text-indigo-500" /> Unified Clinical Timeline
      </h3>
      {(!data || data.length === 0) ? (
        <div className="text-center p-8 text-slate-500 text-sm">No clinical history found.</div>
      ) : (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {data.map((event, index) => (
            <motion.div 
              key={event.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.5) }}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              {/* Icon */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                {getEventIcon(event.type)}
              </div>
              
              {/* Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border shadow-sm bg-white hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getEventColor(event.type)} text-slate-700`}>
                    {event.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {format(new Date(event.eventDate), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">{event.title}</h4>
                <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
                <div className="mt-3 flex justify-between items-center">
                   <span className="text-xs font-medium text-slate-500">Status: <span className="text-slate-800">{event.status}</span></span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClinicalTimeline;
