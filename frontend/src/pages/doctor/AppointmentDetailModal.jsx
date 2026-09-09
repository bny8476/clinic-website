import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { X, Calendar, Clock, User, FileText, CheckCircle2, AlertCircle, Activity, ShieldCheck, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return iso;
  }
};

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return iso;
  }
};

const AppointmentDetailModal = ({ appointmentId, onClose }) => {
  const { data: detail, isLoading, error } = useQuery({
    queryKey: ['appointmentDetail', appointmentId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/appointments/${appointmentId}/detail`);
      return res.data?.data || res.data;
    },
    enabled: !!appointmentId,
  });

  if (!appointmentId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg">
                <Stethoscope size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-snug">Appointment Summary</h3>
                <p className="text-xs text-slate-300">
                  {detail?.appointmentNumber ? `ID: ${detail.appointmentNumber}` : `Appointment #${appointmentId}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
            {isLoading ? (
              <div className="py-12 text-center text-slate-500 font-medium animate-pulse">
                Loading appointment details...
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm font-medium">
                Failed to load appointment details.
              </div>
            ) : (
              <>
                {/* Status & Quick Info */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Status</span>
                    <div className="mt-1">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full">
                        {detail?.status || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Date</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{formatDate(detail?.appointmentDate)}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Time</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{formatTime(detail?.startTime)}</p>
                  </div>
                  {detail?.tokenNumber && (
                    <div>
                      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Token #</span>
                      <p className="text-sm font-black text-indigo-600 mt-0.5">#{detail.tokenNumber}</p>
                    </div>
                  )}
                </div>

                {/* Patient Information */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <User size={16} className="text-indigo-600" /> Patient Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">Name</p>
                      <p className="font-bold text-slate-800">
                        {detail?.patient?.firstName} {detail?.patient?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">Email</p>
                      <p className="font-medium text-slate-700">{detail?.patient?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">Phone</p>
                      <p className="font-medium text-slate-700">{detail?.patient?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">Assigned Doctor</p>
                      <p className="font-bold text-slate-800">{detail?.doctor?.doctorName || 'Assigned Doctor'}</p>
                    </div>
                  </div>
                </div>

                {/* Reason & Notes */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <FileText size={16} className="text-indigo-600" /> Visit Details & Notes
                  </h4>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Reason for Visit</p>
                    <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-xl mt-1 border border-slate-100">
                      {detail?.reasonForVisit || 'No reason specified'}
                    </p>
                  </div>
                  {detail?.notes && (
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mt-2">Clinical Notes</p>
                      <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-xl mt-1 border border-slate-100">
                        {detail.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Audit Timeline */}
                {detail?.timeline && detail.timeline.length > 0 && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Activity size={16} className="text-indigo-600" /> Event Timeline
                    </h4>
                    <div className="relative border-l-2 border-slate-200 ml-3 pl-5 space-y-4">
                      {detail.timeline.map((event, idx) => (
                        <div key={event.id || idx} className="relative">
                          <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900">{event.action}</p>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {formatTime(event.createdAt)} - {formatDate(event.createdAt)}
                            </span>
                          </div>
                          {event.reason && (
                            <p className="text-xs text-slate-500 mt-0.5">{event.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AppointmentDetailModal;
