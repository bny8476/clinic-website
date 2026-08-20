import { useState } from 'react';
import { toast } from 'react-hot-toast';
import pharmacyService from '../../utils/pharmacy/pharmacyService';



export default function ResetPassword() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getStrength = (pw) => {
    return {
      length: pw.length >= 8,
      upperLower: /[A-Z]/.test(pw) && /[a-z]/.test(pw),
      number: /[0-9]/.test(pw),
      special: /[^A-Za-z0-9]/.test(pw)
    };
  };

  const checks = getStrength(formData.newPassword);
  const isFormValid = formData.currentPassword && checks.length && checks.upperLower && checks.number && checks.special && formData.newPassword === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      if (pharmacyService.api) {
        await pharmacyService.api.post('/auth/password/reset', {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });
      }
      toast.success('Password updated successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 p-2 md:p-6 lg:p-8 font-sans">
      
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-sm mb-4">
          <span className="text-slate-500">Account Settings</span>
          <span className="text-slate-400">›</span>
          <span className="font-bold text-slate-900">Reset Password</span>
        </div>
        <h1 className="text-[32px] font-bold text-[#0f172a] tracking-tight mb-2">Reset Password</h1>
        <p className="text-[#64748b]">Update your credentials and improve your account security</p>
      </div>

      {/* Security Best Practices Banner */}
      <div className="bg-[#eff6ff] border border-[#f0e6ff] p-6 rounded-xl flex items-start gap-4 relative overflow-hidden">
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 z-10">
          <Shield className="w-6 h-6 text-[#2563EB]" />
        </div>
        <div className="z-10 relative flex-1 pr-20">
          <h4 className="text-lg font-bold text-[#1e40af] mb-1">Security Best Practices</h4>
          <p className="text-[13px] text-[#2563EB]/80 leading-relaxed max-w-2xl">
            Ensure your account uses a long, random password. Avoid using dictionary words, dates,
            or sequential numbers. We recommend a passphrase or a password manager.
          </p>
        </div>
        {/* Background Decorative Icon */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
          <div className="w-24 h-24 bg-[#2563EB] blur-2xl rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          <Shield className="w-24 h-24 text-[#2563EB] relative z-0" />
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        
        <div className="p-8 border-b border-slate-50 flex items-start gap-4">
          <div className="w-10 h-10 bg-[#eff6ff] text-[#2563EB] rounded-full flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[#0f172a]">Change Password</h3>
            <p className="text-[13px] text-[#64748b] mt-1">Choose a strong password to keep your account secure</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          
          <div className="max-w-3xl space-y-7">
            
            {/* Current Password */}
            <div className="space-y-2.5">
              <label className="text-[14px] font-bold text-[#0f172a]">Current Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showCurrent ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 text-[14px] text-slate-800 outline-none focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 transition-all placeholder:text-slate-400"
                  placeholder="Enter current password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2.5">
              <label className="text-[14px] font-bold text-[#0f172a]">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showNew ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 text-[14px] text-slate-800 outline-none focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 transition-all placeholder:text-slate-400"
                  placeholder="Enter new strong password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2.5">
              <label className="text-[14px] font-bold text-[#0f172a]">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 text-[14px] text-slate-800 outline-none focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 transition-all placeholder:text-slate-400"
                  placeholder="Confirm new password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="pt-2">
              <p className="text-[13px] text-[#64748b] mb-4">
                Password must be at least 8 characters with a combination of letters, numbers & symbols.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <RequirementBadge fulfilled={checks.length} label="8+ Characters" />
                <RequirementBadge fulfilled={checks.upperLower} label="Upper & Lowercase" />
                <RequirementBadge fulfilled={checks.number} label="Number" />
                <RequirementBadge fulfilled={checks.special} label="Special Character" />
              </div>
            </div>
            
          </div>

          {/* Submit Button */}
          <div className="mt-10 flex justify-end">
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="flex items-center gap-2 px-6 py-3 bg-[#2563EB] text-white rounded-xl text-[14px] font-medium shadow-md shadow-[#2563EB]/20 hover:bg-[#1e40af] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Update Password</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

function RequirementBadge({ fulfilled, label }) {
  return (
    
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${fulfilled ? 'bg-[#ede9fe] text-[#7c3aed]' : 'bg-slate-100 text-slate-300'}`}>
        <Check className="w-2.5 h-2.5 stroke-[3]" />
      </div>
      <span className={`text-[13px] ${fulfilled ? 'text-[#334155]' : 'text-[#94a3b8]'}`}>
        {label}
      </span>
    </div>
    
  );
}
