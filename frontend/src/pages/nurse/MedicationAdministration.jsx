import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { axiosPrivate } from '../../api/axios';
import { Pill, User, Clock, CheckCircle2, MoreVertical, Loader2 } from 'lucide-react';
import logger from '../../utils/logger';

const MedicationAdministration = () => {
  const [marList, setMarList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarList = async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get('/nursing/mar');
      setMarList(response.data.data || []);
      setError(null);
    } catch (err) {
      logger.error(err);
      setError('Failed to load Medication Administration Records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarList();
  }, []);

  const markGiven = async (id) => {
    try {
      await axiosPrivate.post(`/nursing/mar/${id}/administer`);
      fetchMarList();
      toast.success('Medication marked as administered.');
    } catch (err) {
      logger.error(err);
      toast.error('Failed to update status.');
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-full bg-[#F4F7FB] p-6 lg:p-10 w-full font-sans">
      <div className="max-w-[1200px] mx-auto space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-50 rounded-2xl flex-shrink-0 border border-blue-100">
              <Pill className="w-8 h-8 text-[#2160FF]" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[28px] font-extrabold text-slate-900 mb-1 tracking-tight">Medication Administration Record (MAR)</h1>
              <p className="text-[15px] text-gray-500 font-medium">View and manage all medications administered to the patient.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 font-medium">
            {error}
          </div>
        )}

        {/* Main Content Card (Table) */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#F8FAF9] border-b border-gray-200">
                  <th className="py-5 px-6 font-semibold text-[14px] text-slate-700 w-[25%]">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#2160FF]" /> Patient & Bed
                    </div>
                  </th>
                  <th className="py-5 px-6 font-semibold text-[14px] text-slate-700 w-[30%]">
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-[#2160FF]" /> Medication & Dose
                    </div>
                  </th>
                  <th className="py-5 px-6 font-semibold text-[14px] text-slate-700 w-[20%]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#2160FF]" /> Scheduled Time
                    </div>
                  </th>
                  <th className="py-5 px-6 font-semibold text-[14px] text-slate-700 w-[15%]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2160FF]" /> Status
                    </div>
                  </th>
                  <th className="py-5 px-6 font-semibold text-[14px] text-slate-700 w-[10%]">
                    <div className="flex items-center gap-2">
                      <MoreVertical className="w-4 h-4 text-[#2160FF]" /> Action
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
                      <div className="flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#2160FF]" />
                      </div>
                    </td>
                  </tr>
                ) : marList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20">
                      <div className="flex flex-col items-center justify-center text-center">
                        {/* Custom Empty State Illustration */}
                        <div className="relative w-28 h-28 flex items-center justify-center mb-6">
                           <div className="absolute inset-0 bg-blue-50 rounded-full"></div>
                           
                           {/* Sparkles */}
                           <div className="absolute top-4 left-2 w-1.5 h-1.5 bg-[#2160FF]/40 rotate-45"></div>
                           <div className="absolute bottom-6 left-4 w-2 h-2 bg-[#2160FF]/50 rotate-45"></div>
                           <div className="absolute top-6 right-0 w-2.5 h-2.5 bg-[#2160FF]/60 rotate-45"></div>
                           <div className="absolute bottom-8 right-3 w-1.5 h-1.5 bg-[#2160FF]/40 rotate-45"></div>

                           {/* Clipboard + Pill */}
                           <div className="relative z-10 w-14 h-18 bg-white border-2 border-[#2160FF] rounded-lg flex flex-col items-center pt-3 pb-2 px-2 shadow-sm">
                             {/* Clip */}
                             <div className="absolute -top-1.5 w-6 h-2 bg-white border-2 border-[#2160FF] rounded-sm"></div>
                             {/* Lines */}
                             <div className="w-full h-0.5 bg-[#2160FF] rounded-full mt-1 opacity-40"></div>
                             <div className="w-full h-0.5 bg-[#2160FF] rounded-full mt-2 opacity-40"></div>
                             <div className="w-2/3 h-0.5 bg-[#2160FF] rounded-full mt-2 self-start opacity-40"></div>
                           </div>
                           
                           {/* Overlaid Pill */}
                           <div className="absolute -bottom-1 -right-1 z-20 bg-white rounded-full p-0.5">
                             <div className="w-8 h-8 rounded-full border-2 border-[#2160FF] bg-white flex items-center justify-center transform -rotate-45">
                               <div className="w-full h-1/2 bg-[#2160FF]/10 border-b-2 border-[#2160FF] rounded-t-full absolute top-0"></div>
                             </div>
                           </div>
                        </div>

                        <h3 className="text-[20px] font-extrabold text-slate-900 mb-2 tracking-tight">No medication data.</h3>
                        <p className="text-[14.5px] text-gray-500 font-medium">There are no medication administration records available for this patient.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  marList.map((m, index) => (
                    <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 px-6">
                        <div className="font-extrabold text-slate-900 text-[15px]">{m.patientName}</div>
                        <div className="text-[13px] text-gray-500 font-medium mt-0.5">Bed {m.bedNumber}</div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="font-bold text-slate-800 text-[14.5px]">{m.medicationName}</div>
                        <div className="text-[13px] text-gray-500 font-medium mt-0.5">{m.dosage}</div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="font-semibold text-slate-700 text-[14.5px]">{formatTime(m.scheduledTime)}</div>
                      </td>
                      <td className="py-5 px-6">
                        {m.status === 'GIVEN' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-green-100 text-green-700">
                            Given at {formatTime(m.administeredAt)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-700">
                            DUE NOW
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        {m.status === 'DUE' ? (
                          <button 
                            onClick={() => markGiven(m.id)}
                            className="bg-[#2160FF] hover:bg-blue-600 text-white border-none py-2 px-4 rounded-lg text-[13px] font-bold cursor-pointer transition-all shadow-md shadow-blue-500/20 whitespace-nowrap"
                          >
                            Mark Administered
                          </button>
                        ) : (
                          <span className="text-gray-400 font-medium text-[13px] italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationAdministration;
