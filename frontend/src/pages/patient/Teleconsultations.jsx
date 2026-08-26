import toast from 'react-hot-toast';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { Video, Calendar, PlayCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';

const Teleconsultations = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    preferredDates: '',
    preferredTimes: 'Morning',
    reason: '',
    languagePreference: 'English'
  });

  const { data: teleconsults = [], isLoading } = useQuery({
    queryKey: ['patient-teleconsults'],
    queryFn: async () => {
      try {
          return (await axiosPrivate.get('/v1/patient/teleconsultations')).data;
      } catch(e) {
          throw e;
      }
    }
  });

  const bookMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosPrivate.post('/v1/patient/teleconsultations', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Teleconsultation requested successfully');
      setIsModalOpen(false);
      setFormData({ preferredDates: '', preferredTimes: 'Morning', reason: '', languagePreference: 'English' });
      queryClient.invalidateQueries(['patient-teleconsults']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to book teleconsultation');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    bookMutation.mutate(formData);
  };

  const columns = [
    { key: 'id', title: 'Request ID', render: (val) => <span className="font-mono text-sm">#{val}</span> },
    { key: 'reason', title: 'Reason' },
    { key: 'preferredDates', title: 'Preferred Date' },
    { key: 'status', title: 'Status', render: (val) => (
      <Badge variant={val === 'Completed' ? 'success' : val === 'Requested' ? 'warning' : 'secondary'}>{val}</Badge>
    )},
    { key: 'actions', title: 'Actions', render: (_, row) => (
      row.status === 'Booked' && row.joinLink && (
        <a href={row.joinLink} target="_blank" rel="noreferrer">
          <Button size="sm" className="flex items-center gap-2">
              <PlayCircle size={16} /> Join Waiting Room
          </Button>
        </a>
      )
    )}
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] p-6 lg:p-10 font-sans">
       {/* Header */}
       <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-2xl bg-[#F0F5FF] flex items-center justify-center shrink-0 shadow-sm border border-blue-50">
                <Video className="w-6 h-6 text-[#2864FF]" />
             </div>
             <div>
                <h1 className="text-[22px] font-extrabold text-slate-900 mb-0.5 tracking-tight">Teleconsultations</h1>
                <p className="text-[13.5px] font-medium text-slate-500">Manage your virtual visits and history.</p>
             </div>
          </div>
          
          <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-[#2864FF] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-[13px] flex items-center gap-2 transition-all shadow-[0_2px_12px_rgba(40,100,255,0.25)] cursor-pointer"
          >
             <Calendar className="w-4 h-4" /> Book Teleconsult
          </button>
       </div>

       {/* Main Card Container */}
       <div className="max-w-[1200px] mx-auto">
          {teleconsults.length === 0 && !isLoading ? (
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
                        {/* Paper Airplane */}
                        <path d="M72 32L88 24L80 40L72 32Z" stroke="#2864FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M72 32L80 40L85 45L70 42L72 32Z" fill="#2864FF" fillOpacity="0.4"/>
                        {/* dashed flight path */}
                        <path d="M88 24C96 26 102 32 98 44C94 50 86 56 80 50" stroke="#A6C8FF" strokeWidth="1.5" strokeDasharray="2 3" strokeLinecap="round"/>
                        
                        {/* Box Back */}
                        <path d="M35 55H85L90 70H30L35 55Z" fill="#2864FF" />
                        
                        {/* Papers */}
                        <rect x="42" y="45" width="26" height="25" rx="3" fill="#D0E2FF" transform="rotate(-5 55 57.5)" />
                        <rect x="52" y="40" width="22" height="28" rx="3" fill="white" />
                        <path d="M58 48H68 M58 53H64" stroke="#2864FF" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
                        
                        {/* Box Front Inner */}
                        <path d="M32 70H88V78C88 79.1 87.1 80 86 80H34C32.9 80 32 79.1 32 78V70Z" fill="#F0F5FF" />
                        {/* Box Front Main */}
                        <path d="M28 70H92V82C92 84.2 90.2 86 88 86H32C29.8 86 28 84.2 28 82V70Z" fill="#E8F0FE" />
                        <path d="M28 70H92V74C92 74 90 75 88 75H32C30 75 28 74 28 70Z" fill="#D0E2FF" />

                        {/* Decorative Sparkles */}
                        <path d="M25 40L27 45L32 47L27 49L25 54L23 49L18 47L23 45L25 40Z" fill="#2864FF" fillOpacity="0.6"/>
                        <circle cx="95" cy="65" r="2" fill="#2864FF" fillOpacity="0.4"/>
                        <circle cx="20" cy="70" r="1.5" fill="#2864FF" fillOpacity="0.5"/>
                     </svg>
                  </div>

                  <h2 className="text-[20px] font-extrabold text-slate-900 mb-2">No Teleconsults Found</h2>
                  <p className="text-[13.5px] text-slate-500 mb-8 font-medium">
                     There are no entries to display at this time.
                  </p>

                  <button 
                     onClick={() => setIsModalOpen(true)}
                     className="bg-[#F8FAFC] border border-[#D0E2FF] hover:bg-[#F0F5FF] hover:border-[#A6C8FF] text-[#2864FF] px-6 py-2.5 rounded-xl font-semibold text-[13px] flex items-center gap-2 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                     <Calendar className="w-4 h-4" /> Book Your First Teleconsult
                  </button>
               </div>

            </div>
          ) : (
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden p-6">
              <DataTable columns={columns} data={teleconsults} isLoading={isLoading} emptyTitle="No Teleconsults Found" />
            </div>
          )}
       </div>

       {/* Modal for Booking */}
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Book Teleconsultation">
         <form onSubmit={handleSubmit} className="space-y-4">
           <FormField label="Preferred Date" required id="preferredDates">
             <input 
               id="preferredDates"
               type="date"
               className="input-field"
               value={formData.preferredDates}
               onChange={(e) => setFormData({ ...formData, preferredDates: e.target.value })}
               required
             />
           </FormField>
           <FormField label="Preferred Time" required id="preferredTimes">
             <select 
               id="preferredTimes"
               className="input-field"
               value={formData.preferredTimes}
               onChange={(e) => setFormData({ ...formData, preferredTimes: e.target.value })}
             >
               <option value="Morning">Morning (9AM - 12PM)</option>
               <option value="Afternoon">Afternoon (12PM - 4PM)</option>
               <option value="Evening">Evening (4PM - 7PM)</option>
             </select>
           </FormField>
           <FormField label="Language Preference" required id="languagePreference">
             <select 
               id="languagePreference"
               className="input-field"
               value={formData.languagePreference}
               onChange={(e) => setFormData({ ...formData, languagePreference: e.target.value })}
             >
               <option value="English">English</option>
               <option value="Spanish">Spanish</option>
               <option value="Mandarin">Mandarin</option>
             </select>
           </FormField>
           <FormField label="Reason for Visit" required id="reason">
             <textarea 
               id="reason"
               className="input-field min-h-[100px]"
               value={formData.reason}
               onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
               required
               placeholder="Describe your symptoms or reason for consult..."
             />
           </FormField>

           <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
             <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
             <Button type="submit" variant="primary" isLoading={bookMutation.isPending}>
               Submit Request
             </Button>
           </div>
         </form>
       </Modal>
    </div>
  );
};
export default Teleconsultations;
