import useAuthStore from '../../store/authStore';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { FileHeart, Upload } from 'lucide-react';

const MedicalRecords = () => {
  const { user } = useAuthStore();

  const { data: records, isLoading } = useQuery({
    queryKey: ['patientRecords', user?.id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/medical-records/patient/${user.id}`);
      return res.data;
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] p-6 lg:p-10 font-sans">
       {/* Header */}
       <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-[14px] bg-[#F0F5FF] flex items-center justify-center shrink-0 shadow-sm border border-blue-50">
                <FileHeart className="w-6 h-6 text-[#2864FF]" />
             </div>
             <div>
                <h1 className="text-[22px] font-extrabold text-slate-900 mb-0.5 tracking-tight">My Medical Records</h1>
                <p className="text-[13.5px] font-medium text-slate-500">Access and manage your medical records securely.</p>
             </div>
          </div>
       </div>

       {/* Main Card Container */}
       <div className="max-w-[1200px] mx-auto">
          {(!records || records.length === 0) ? (
            <div className="relative bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-10">
               
               {/* Decorative Circle - Mid Left */}
               <div className="absolute top-1/2 -left-16 -translate-y-1/2 w-32 h-32 bg-[#F8FAFC] rounded-full blur-[40px] pointer-events-none"></div>

               {/* Decorative Circle - Bottom Right */}
               <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] bg-[#F8FAFC] rounded-full blur-[50px] pointer-events-none"></div>
               
               {/* Empty State Content */}
               <div className="relative z-10 flex flex-col items-center text-center max-w-sm mt-4">
                  
                  {/* Custom Illustration */}
                  <div className="relative w-[180px] h-[180px] mb-6 flex items-center justify-center">
                     <div className="absolute inset-0 bg-[#F5F8FF] rounded-full scale-[0.85]"></div>
                     
                     <svg width="140" height="140" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                        {/* Folder Back */}
                        <path d="M30 55H56L61 62H90V80H30V55Z" fill="#2864FF" />
                        
                        {/* Document */}
                        <rect x="42" y="42" width="36" height="40" rx="3" fill="white" />
                        <path d="M42 45C42 43.3431 43.3431 42 45 42H68L78 52V79C78 80.6569 76.6569 82 75 82H45C43.3431 82 42 80.6569 42 79V45Z" fill="white" />
                        {/* Folded Corner */}
                        <path d="M68 42V52H78" fill="#D0E2FF" />
                        {/* Medical Cross */}
                        <path d="M48 52H56 M52 48V56" stroke="#2864FF" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Text Lines */}
                        <path d="M48 64H72 M48 70H66" stroke="#A6C8FF" strokeWidth="2" strokeLinecap="round" />
                        
                        {/* Folder Front Inner */}
                        <path d="M28 65H92V84C92 85.1 91.1 86 90 86H30C28.9 86 28 85.1 28 84V65Z" fill="#F0F5FF" />
                        
                        {/* Folder Front Main */}
                        <path d="M26 68H94L90 86C89.5 87.1 88.3 88 87 88H33C31.7 88 30.5 87.1 30 86L26 68Z" fill="#E8F0FE" />
                        <path d="M26 68H94L92.5 73H27.5L26 68Z" fill="#D0E2FF" />

                        {/* Decorative Sparkles */}
                        <path d="M20 45L22 50L27 52L22 54L20 59L18 54L13 52L18 50L20 45Z" fill="#2864FF" fillOpacity="0.5"/>
                        <path d="M95 55L96 58L99 59L96 60L95 63L94 60L91 59L94 58L95 55Z" fill="#2864FF" fillOpacity="0.4"/>
                        <circle cx="85" cy="35" r="2" fill="#2864FF" fillOpacity="0.4"/>
                        <circle cx="30" cy="35" r="1.5" fill="#2864FF" fillOpacity="0.5"/>

                        {/* Dashed swoop */}
                        <path d="M75 35C85 30 95 40 90 50" stroke="#A6C8FF" strokeWidth="1.5" strokeDasharray="2 3" strokeLinecap="round" fill="none"/>
                        {/* Decorative Plus sign in bg */}
                        <path d="M25 35H31 M28 32V38" stroke="#A6C8FF" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M100 70H104 M102 68V72" stroke="#A6C8FF" strokeWidth="1.5" strokeLinecap="round" />
                     </svg>
                  </div>

                  <h2 className="text-[20px] font-extrabold text-slate-900 mb-2">No Records Found</h2>
                  <p className="text-[13.5px] text-slate-500 mb-8 font-medium">
                     You don't have any medical records available yet.
                  </p>

                  <button 
                     className="bg-[#F8FAFC] border border-[#D0E2FF] hover:bg-[#F0F5FF] hover:border-[#A6C8FF] text-[#2864FF] px-8 py-2.5 rounded-[12px] font-semibold text-[13px] flex items-center gap-2 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                     <Upload className="w-4 h-4" /> Upload Records
                  </button>
               </div>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden p-6">
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                       <tr>
                          <th className="px-4 py-3">Title</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Doctor</th>
                          <th className="px-4 py-3">Date</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                       {records.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50/50">
                             <td className="px-4 py-4 font-semibold text-slate-900">{r.title}</td>
                             <td className="px-4 py-4">{r.recordType}</td>
                             <td className="px-4 py-4">Dr. {r.doctorName}</td>
                             <td className="px-4 py-4">{new Date(r.createdAt).toLocaleDateString()}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </div>
          )}
       </div>
    </div>
  );
};

export default MedicalRecords;
