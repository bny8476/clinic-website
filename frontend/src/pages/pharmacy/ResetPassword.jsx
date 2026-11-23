import React, { useState, useMemo } from 'react';
import pharmacyService from '../../utils/pharmacy/pharmacyService';
import { toast } from 'react-hot-toast';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Info,
  Clock,
  Check,
  Building,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/pharmacy/AuthContext';

export default function ResetPassword() {
  const { user, activeRole, roles } = useAuth();
  const currentRole = activeRole || roles?.[0] || 'ROLE_PHARMACIST';

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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleResetForm = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const checks = useMemo(() => {
    const pw = formData.newPassword;
    return {
      length: pw.length >= 8,
      upperLower: /[A-Z]/.test(pw) && /[a-z]/.test(pw),
      number: /[0-9]/.test(pw),
      special: /[^A-Za-z0-9]/.test(pw)
    };
  }, [formData.newPassword]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (checks.length) score++;
    if (checks.upperLower) score++;
    if (checks.number) score++;
    if (checks.special) score++;
    return score;
  }, [checks]);

  const passwordsMatch = formData.confirmPassword.length > 0 && formData.newPassword === formData.confirmPassword;
  const isFormValid = formData.currentPassword.trim() && strengthScore === 4 && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      if (!passwordsMatch && formData.confirmPassword) {
        toast.error('New password and confirm password do not match');
      } else {
        toast.error('Please fulfill all password security requirements');
      }
      return;
    }

    setLoading(true);
    try {
      if (pharmacyService.api) {
        await pharmacyService.api.post('/auth/password/reset', {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });
      }
      toast.success('Pharmacy credentials updated successfully!');
      handleResetForm();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update credentials. Check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthMeta = () => {
    if (!formData.newPassword) {
      return { label: 'Empty', color: 'bg-slate-200', text: 'text-slate-400' };
    }
    if (strengthScore <= 1) {
      return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
    }
    if (strengthScore <= 3) {
      return { label: 'Moderate', color: 'bg-amber-500', text: 'text-amber-600' };
    }
    return { label: 'Strong & Secure', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const strengthMeta = getStrengthMeta();

  return (
    <div className="w-full max-w-full space-y-6 font-sans">
      
      {/* ── Breadcrumb & Page Header ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
              <span>Pharmacy Portal</span>
              <span>›</span>
              <span>Account Settings</span>
              <span>›</span>
              <span className="text-slate-700 font-bold">Reset Password</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight m-0">
              Account Credential Security
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 m-0 mt-1">
              Update your pharmacy terminal access credentials to comply with clinical inventory and dispensing policies.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-blue-600" />
              <span>Role: {String(currentRole).replace('ROLE_', '')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── 2-Column Responsive Layout ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── Left Column: Password Reset Form (8 cols) ─────────────── */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl shadow-2xs border border-slate-200/90 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-[#2563EB] border border-blue-100 rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                <KeyRound className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 m-0">Change Access Password</h3>
                <p className="text-xs text-slate-500 m-0 mt-0.5">Use a minimum of 8 characters with mixed casing, digits, and symbols</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showCurrent ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  placeholder="Enter your current active password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                />
                <button 
                  type="button" 
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer border-0 bg-transparent"
                  title={showCurrent ? "Hide password" : "Show password"}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  New Password <span className="text-rose-500">*</span>
                </label>
                {formData.newPassword && (
                  <span className={`text-[11px] font-bold ${strengthMeta.text}`}>
                    Strength: {strengthMeta.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showNew ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  placeholder="Enter a new strong password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                />
                <button 
                  type="button" 
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer border-0 bg-transparent"
                  title={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Meter Bar */}
              {formData.newPassword && (
                <div className="pt-1.5 flex gap-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div 
                      key={step} 
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        step <= strengthScore ? strengthMeta.color : 'bg-slate-100'
                      }`} 
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Re-type your new password"
                  className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-xs font-medium text-slate-900 outline-none focus:bg-white transition-all placeholder:text-slate-400 ${
                    formData.confirmPassword && !passwordsMatch 
                      ? 'border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                      : formData.confirmPassword && passwordsMatch
                      ? 'border-emerald-300 bg-emerald-50/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50/50 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer border-0 bg-transparent"
                  title={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {formData.confirmPassword && (
                <div className="pt-1 flex items-center gap-1.5 text-xs font-semibold">
                  {passwordsMatch ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Passwords match
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1">
                      <XCircle size={13} /> Passwords do not match yet
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Password Complexity Matrix Requirements */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-bold text-slate-700 m-0">Complexity Checklist:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <RequirementRow fulfilled={checks.length} label="At least 8 characters in length" />
                <RequirementRow fulfilled={checks.upperLower} label="Upper & lowercase letters (A-Z, a-z)" />
                <RequirementRow fulfilled={checks.number} label="At least one numeric digit (0-9)" />
                <RequirementRow fulfilled={checks.special} label="At least one symbol (!@#$%^&*)" />
              </div>
            </div>

            {/* Form Footer Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>Clear Form</span>
              </button>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0"
              >
                <span>{loading ? 'Updating Credentials...' : 'Update Password'}</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </form>
        </div>

        {/* ── Right Column: Security Policies & Context (4 cols) ────── */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          
          {/* Best Practices Banner Card */}
          <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-white border border-blue-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                <Shield size={20} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-blue-950 m-0">Pharmacy Compliance SLA</h4>
                <p className="text-[11px] text-blue-800/80 m-0 mt-0.5">Drugs &amp; Cosmetics Regulatory Guidelines</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Dispensary staff credentials provide direct authorization to dispense Schedule H/H1 medications and sign off on narcotics logs. 
            </p>

            <div className="pt-2 border-t border-blue-100 space-y-2 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>Rotate dispensary terminal passwords every 90 days.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>Never share pharmacist logins with billing assistants.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>Lock the POS terminal whenever stepping away from the counter.</span>
              </div>
            </div>
          </div>

          {/* Account Security Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Security Profile
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE SESSION
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Terminal User</span>
                <span className="font-bold text-slate-800">{user?.name || user?.email || 'Authorized Pharmacist'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Security Clearance</span>
                <span className="font-bold text-slate-800 font-mono text-[11px]">{String(currentRole)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Audit Status</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Logged &amp; Verified
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

function RequirementRow({ fulfilled, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
        fulfilled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/70 text-slate-400'
      }`}>
        <Check size={10} strokeWidth={3} />
      </div>
      <span className={`transition-colors font-medium ${fulfilled ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}
