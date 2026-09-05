import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { User, Layers, Calendar, MessageSquare, Flag, Settings, CheckCircle, XCircle, Hourglass } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn, staggerChildren } from '../../components/ui/motion';
import toast from 'react-hot-toast';

const LeaveManagement = () => {
  const queryClient = useQueryClient();
  const { data: leaves = [] } = useQuery({
    queryKey: ['hr-leave-requests'],
    queryFn: async () => (await axiosPrivate.get('/hr/leaves')).data,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await axiosPrivate.patch(`/hr/leaves/${id}/status?status=${status}`);
    },
    onSuccess: () => {
      toast.success('Leave request updated successfully');
      queryClient.invalidateQueries(['hr-leave-requests']);
    },
    onError: () => {
      toast.error('Failed to update leave request');
    },
  });

  const sampleLeaves = leaves.length > 0 ? leaves : [
    { id: 1, employeeName: 'Nurse Sunita Sharma', initials: 'NS', leaveType: 'Casual Leave', startDate: '2026-07-30', endDate: '2026-07-31', days: 2, status: 'PENDING', reason: 'Personal family event' },
    { id: 2, employeeName: 'Anjali Gupta', initials: 'AG', leaveType: 'Sick Leave', startDate: '2026-07-24', endDate: '2026-07-24', days: 1, status: 'APPROVED', reason: 'Fever' },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="w-full max-w-full px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 font-sans">
      
      {/* Custom Header matching mockup */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-[60px] h-[60px] bg-[#EEF2FF] rounded-[16px] flex items-center justify-center shrink-0">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="#2160FF" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 2V6" stroke="#2160FF" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 2V6" stroke="#2160FF" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 10H21" stroke="#2160FF" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="15" r="2.5" stroke="#2160FF" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 m-0 leading-tight tracking-tight">
              Leave Requests Management
            </h1>
            <p className="text-[15px] text-slate-500 m-0 mt-1">
              Review and manage employee leave requests efficiently.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFCFF] border-b border-slate-100">
                <th className="px-8 py-6">
                  <div className="flex items-center gap-3 text-[#2160FF] font-bold text-[14px]">
                    <User size={18} strokeWidth={2} /> Employee
                  </div>
                </th>
                <th className="px-8 py-6">
                  <div className="flex items-center gap-3 text-[#2160FF] font-bold text-[14px]">
                    <Layers size={18} strokeWidth={2} /> Type
                  </div>
                </th>
                <th className="px-8 py-6">
                  <div className="flex items-center gap-3 text-[#2160FF] font-bold text-[14px]">
                    <Calendar size={18} strokeWidth={2} /> Dates &amp; Duration
                  </div>
                </th>
                <th className="px-8 py-6">
                  <div className="flex items-center gap-3 text-[#2160FF] font-bold text-[14px]">
                    <MessageSquare size={18} strokeWidth={2} /> Reason
                  </div>
                </th>
                <th className="px-8 py-6">
                  <div className="flex items-center gap-3 text-[#2160FF] font-bold text-[14px]">
                    <Flag size={18} strokeWidth={2} /> Status
                  </div>
                </th>
                <th className="px-8 py-6">
                  <div className="flex items-center gap-3 text-[#2160FF] font-bold text-[14px]">
                    <Settings size={18} strokeWidth={2} /> Action
                  </div>
                </th>
              </tr>
            </thead>
            <motion.tbody
              variants={staggerChildren}
              initial="hidden"
              animate="visible"
              className="divide-y divide-slate-100"
            >
              {sampleLeaves.map(l => (
                <motion.tr key={l.id} variants={fadeIn} className="hover:bg-slate-50/70 transition-colors">
                  
                  {/* Employee */}
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[12px] bg-[#EEF2FF] text-[#2160FF] font-bold text-[15px] flex items-center justify-center shrink-0">
                        {l.initials || (l.employeeName && l.employeeName.substring(0, 2).toUpperCase()) || 'U'}
                      </div>
                      <span className="text-[15px] font-bold text-slate-900">{l.employeeName}</span>
                    </div>
                  </td>
                  
                  {/* Type */}
                  <td className="px-8 py-6">
                    <span className={`inline-flex px-3 py-1.5 rounded-lg text-[13px] font-bold ${l.leaveType === 'Casual Leave' ? 'bg-[#EEF2FF] text-[#2160FF]' : 'bg-[#E5F7ED] text-[#00B661]'}`}>
                      {l.leaveType}
                    </span>
                  </td>
                  
                  {/* Dates & Duration */}
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-[15px] font-medium text-slate-500">
                      <Calendar size={18} className="text-[#2160FF]" strokeWidth={2.5} /> 
                      {l.startDate} to {l.endDate} 
                      <span className="text-[#2160FF] bg-[#EEF2FF] px-2 py-0.5 rounded-[6px] text-[13px] font-bold ml-1">({l.days}d)</span>
                    </div>
                  </td>
                  
                  {/* Reason */}
                  <td className="px-8 py-6">
                    <span className="text-[15px] font-medium text-slate-500">{l.reason}</span>
                  </td>
                  
                  {/* Status */}
                  <td className="px-8 py-6">
                    {l.status === 'PENDING' ? (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#FFF8E6] text-[#FFA000] text-[13px] font-bold border border-[#FFA000]/20">
                        <Hourglass size={14} strokeWidth={2.5} /> PENDING
                      </div>
                    ) : l.status === 'APPROVED' ? (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#E5F7ED] text-[#00B661] text-[13px] font-bold border border-[#00B661]/20">
                        <CheckCircle size={14} strokeWidth={2.5} /> APPROVED
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#FFE5E5] text-[#FF4C4C] text-[13px] font-bold border border-[#FF4C4C]/20">
                        <XCircle size={14} strokeWidth={2.5} /> REJECTED
                      </div>
                    )}
                  </td>
                  
                  {/* Action */}
                  <td className="px-8 py-6">
                    {l.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => statusMutation.mutate({ id: l.id, status: 'APPROVED' })}
                          disabled={statusMutation.isPending}
                          className="bg-[#2160FF] text-white px-4 py-2 rounded-[8px] flex items-center gap-1.5 text-[14px] font-bold transition-all hover:bg-[#1A4CE6] shadow-sm disabled:opacity-50">
                          <CheckCircle size={16} strokeWidth={2.5} /> Approve
                        </button>
                        <button 
                          onClick={() => statusMutation.mutate({ id: l.id, status: 'REJECTED' })}
                          disabled={statusMutation.isPending}
                          className="border border-[#A6C8FF] text-[#2160FF] bg-white px-4 py-2 rounded-[8px] flex items-center gap-1.5 text-[14px] font-bold transition-all hover:bg-[#EEF2FF] shadow-sm disabled:opacity-50">
                          <XCircle size={16} strokeWidth={2.5} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[13px] font-bold text-slate-400">Processed</span>
                    )}
                  </td>

                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default LeaveManagement;
