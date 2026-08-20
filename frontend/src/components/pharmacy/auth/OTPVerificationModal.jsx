import { useState } from 'react';
import { toast } from 'react-hot-toast';
import pharmacyService from '../../../utils/pharmacy/pharmacyService';

export default function OTPVerificationModal({ isOpen, onClose, onVerifySuccess }) {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (!email) {
      toast.error("Please enter email address");
      return;
    }
    setLoading(true);
    try {
      await pharmacyService.sendOtp(email);
      setOtpSent(true);
      toast.success("OTP sent to your email!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!code) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      await pharmacyService.verifyOtp(email, code);
      toast.success("Verification successful!");
      onVerifySuccess();
      onClose();
    } catch (err) {
      toast.error("Verification failed: " + (err.response?.data?.message || "Invalid code"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-[520px] p-10 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-6 h-6" strokeWidth={2.5} />
        </button>

        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-[72px] h-[72px] bg-[#DBEAFE] rounded-full flex items-center justify-center text-[#2563EB] mb-6">
            <Shield className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <h3 className="text-[28px] font-bold text-[#0F172A] mb-3">Compliance 2FA Verification</h3>
          <p className="text-[16px] text-[#64748B] max-w-sm leading-relaxed">
            Enter your registered email address to receive a one-time passcode (OTP) for access.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[15px] font-bold text-[#0F172A] mb-2.5">Registered Email</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#94A3B8]" />
                </div>
                <input
                  type="email"
                  placeholder="staff@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpSent}
                  className="w-full text-[16px] text-[#334155] border border-[#E2E8F0] rounded-[12px] py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-blue-500/20 focus:border-[#3B82F6] outline-none transition-all placeholder:text-[#94A3B8]"
                />
              </div>
              {!otpSent && (
                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="bg-[#2563EB] text-white px-8 py-3.5 rounded-[12px] text-[16px] font-bold hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors whitespace-nowrap min-w-[140px] flex items-center justify-center shadow-sm"
                >
                  {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : "Send OTP"}
                </button>
              )}
            </div>
          </div>

          {otpSent && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[15px] font-bold text-[#0F172A] mb-2.5">One-Time Passcode</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 text-center text-xl tracking-[0.25em] font-bold border border-[#E2E8F0] rounded-[12px] py-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-[#3B82F6] outline-none transition-all placeholder:text-[#CBD5E1] placeholder:tracking-normal placeholder:font-medium placeholder:text-[16px]"
                />
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="bg-[#2563EB] text-white px-6 py-3.5 rounded-[12px] text-[16px] font-bold hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors whitespace-nowrap min-w-[140px] flex items-center justify-center shadow-sm gap-2"
                >
                  {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Verify Code
                </button>
              </div>
            </div>
          )}
          
          <div className="pt-4 flex items-center justify-center gap-2 text-[14px] font-medium text-[#64748B]">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            For security, the OTP will expire in 5 minutes.
          </div>
        </div>
      </div>
    </div>
  );
}
