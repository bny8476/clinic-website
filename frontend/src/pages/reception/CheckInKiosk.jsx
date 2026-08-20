import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

import toast from 'react-hot-toast';
import { staggerChildren, fadeIn } from '../../components/ui/motion';



const KIOSK_STATION = 'KIOSK-1';
const BRANCH_ID = 1; // Fixed for this kiosk terminal

const STEPS = ['welcome', 'search', 'confirm', 'done'];

const CheckInKiosk = () => {
  const [step, setStep] = useState('welcome');
  const [phone, setPhone] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [patientProfileId, setPatientProfileId] = useState(null);
  const [checkin, setCheckin] = useState(null);

  const selfCheckIn = useMutation({
    mutationFn: async () => {
      const res = await axios.post('/api/reception/kiosk/self-checkin', {
        branchId: BRANCH_ID,
        patientProfileId: patientProfileId || null,
        appointmentId: appointmentId ? Number(appointmentId) : null,
        kioskStation: KIOSK_STATION
      });
      return res.data;
    },
    onSuccess: (data) => {
      setCheckin(data);
      setStep('done');
    },
    onError: () => {
      toast.error('Check-in failed. Please see reception staff for assistance.');
    }
  });

  const handleReset = () => {
    setStep('welcome');
    setPhone('');
    setAppointmentId('');
    setPatientProfileId(null);
    setCheckin(null);
  };

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-navy-900)] via-[var(--color-navy-800)] to-[var(--color-navy-900)] flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <Monitor className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white font-display">Patient Check-In Kiosk</h1>
        <p className="text-white/60 mt-1 text-sm">Station: {KIOSK_STATION}</p>
      </div>

      {/* Step Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-8"
        >
          {step === 'welcome' && (
            <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="space-y-6 text-center">
              <motion.div variants={fadeIn}>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome!</h2>
                <p className="text-white/70">Please touch below to begin your check-in process.</p>
              </motion.div>
              <motion.div variants={fadeIn} className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setStep('search')}
                  className="w-full py-4 rounded-xl bg-white text-[var(--color-navy-900)] font-bold text-lg hover:bg-white/90 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" /> I Have an Appointment
                </button>
                <button
                  onClick={() => {
                    setPatientProfileId(null);
                    setStep('confirm');
                  }}
                  className="w-full py-4 rounded-xl bg-white/20 border border-white/30 text-white font-bold text-lg hover:bg-white/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <User className="w-5 h-5" /> Walk-In Visit
                </button>
              </motion.div>
            </motion.div>
          )}

          {step === 'search' && (
            <div className="space-y-6">
              <div className="text-center">
                <Search className="w-10 h-10 text-white mx-auto mb-3 opacity-80" />
                <h2 className="text-xl font-bold text-white">Find Your Appointment</h2>
                <p className="text-white/60 text-sm mt-1">Enter your registered phone number or appointment ID</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-white/80 mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full h-12 px-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 text-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-white/80 mb-1 block">Appointment ID (optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 12345"
                    value={appointmentId}
                    onChange={e => setAppointmentId(e.target.value)}
                    className="w-full h-12 px-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 text-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('welcome')}
                  className="flex-1 py-3 rounded-xl border border-white/30 text-white/80 hover:bg-white/10 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 py-3 rounded-xl bg-white text-[var(--color-navy-900)] font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="text-center">
                <AlertCircle className="w-10 h-10 text-yellow-300 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-white">Confirm Check-In</h2>
                <p className="text-white/60 text-sm mt-1">
                  {appointmentId
                    ? `Checking in for Appointment #${appointmentId}`
                    : 'Checking in as a walk-in patient'}
                </p>
              </div>

              <div className="bg-white/10 rounded-xl p-4 space-y-2 text-sm">
                {phone && (
                  <div className="flex justify-between text-white/80">
                    <span>Phone:</span><span className="font-semibold">{phone}</span>
                  </div>
                )}
                {appointmentId && (
                  <div className="flex justify-between text-white/80">
                    <span>Appointment ID:</span><span className="font-semibold">#{appointmentId}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/80">
                  <span>Station:</span><span className="font-semibold">{KIOSK_STATION}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Type:</span><span className="font-semibold">{appointmentId ? 'Appointment' : 'Walk-In'}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(appointmentId ? 'search' : 'welcome')}
                  className="flex-1 py-3 rounded-xl border border-white/30 text-white/80 hover:bg-white/10 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => selfCheckIn.mutate()}
                  disabled={selfCheckIn.isPending}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {selfCheckIn.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Checking in...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Confirm Check-In</>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'done' && checkin && (
            <div className="space-y-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-4 border-emerald-400 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-white">You're Checked In!</h2>
                <p className="text-white/60 mt-1">Please take a seat. A staff member will call you shortly.</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/80 text-sm">Check-In ID</p>
                <p className="text-3xl font-bold text-white font-display mt-1">#{checkin.id}</p>
                <p className="text-white/60 text-xs mt-1">Status: {checkin.status}</p>
              </div>
              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl bg-white/20 border border-white/30 text-white font-semibold hover:bg-white/30 transition-all"
              >
                Done — Next Patient
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
    
  );
};

export default CheckInKiosk;
