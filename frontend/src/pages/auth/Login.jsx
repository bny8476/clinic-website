import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldAlert, Sparkles, User } from 'lucide-react';
import useAuthStore, { getDefaultDashboardRoute, isTokenValid } from '../../store/authStore';

/* ── Medvice color tokens ────────────────────────────────────────────────── */
const BLUE = '#2B4AFE';
const BG = 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)';
const CARD_BG = 'rgba(255, 255, 255, 0.55)';

/* ── Elixir Health Care Logo ─────────────────────────────────────────────── */
const ElixirLogo = () => (
  <div className="flex items-center gap-3">
    <div
      style={{ background: BLUE }}
      className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30"
    >
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <path d="M10 1.5L3 4.5V10c0 4.1 2.9 7.6 7 8.5 4.1-.9 7-4.4 7-8.5V4.5L10 1.5z" fill="white" fillOpacity=".25"/>
        <path d="M10 1.5L3 4.5V10c0 4.1 2.9 7.6 7 8.5 4.1-.9 7-4.4 7-8.5V4.5L10 1.5z" stroke="white" strokeWidth="1.2"/>
        <path d="M7 10h2v-2h2v2h2v2h-2v2H9v-2H7v-2z" fill="white"/>
      </svg>
    </div>
    <div>
      <p className="font-extrabold text-lg leading-none text-slate-900 tracking-tight">Elixir Health Care</p>
      <p className="text-xs text-slate-500 font-medium leading-tight">Healthcare Platform</p>
    </div>
  </div>
);

/* ── Shield Illustration ───────────────────────────────────────────────── */
const ShieldIllustration = () => (
  <svg viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[240px] mx-auto drop-shadow-2xl">
    <ellipse cx="130" cy="200" rx="90" ry="18" fill="#2B4AFE" fillOpacity="0.1"/>
    <path d="M130 20L48 54v62c0 52 34 98 82 110 48-12 82-58 82-110V54L130 20z" fill="url(#shieldGrad)" />
    <path d="M130 20L48 54v62c0 52 34 98 82 110 48-12 82-58 82-110V54L130 20z" stroke="white" strokeWidth="2" strokeOpacity="0.4"/>
    <rect x="110" y="102" width="40" height="12" rx="4" fill="white"/>
    <rect x="124" y="88" width="12" height="40" rx="4" fill="white"/>
    <path d="M80 180 Q78 210 98 220 Q118 230 120 210" stroke="#2B4AFE" strokeWidth="8" strokeLinecap="round" fill="none"/>
    <path d="M180 180 Q182 210 162 220 Q142 230 140 210" stroke="#2B4AFE" strokeWidth="8" strokeLinecap="round" fill="none"/>
    <circle cx="130" cy="208" r="14" fill="#2B4AFE"/>
    <circle cx="130" cy="208" r="8" fill="#2B4AFE" stroke="white" strokeWidth="3"/>
    <circle cx="78" cy="178" r="6" fill="#2B4AFE"/>
    <circle cx="182" cy="178" r="6" fill="#2B4AFE"/>
    <defs>
      <linearGradient id="shieldGrad" x1="130" y1="20" x2="130" y2="196" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2563EB"/>
        <stop offset="1" stopColor="#1E3A8A"/>
      </linearGradient>
    </defs>
  </svg>
);

/* ── Demo Roles Specification ───────────────────────────────────────────── */
const DEMO_ROLES = [
  // Clinical
  { label: 'Doctor', role: 'Physician', email: 'doctor@clinic.com', pass: 'Clinic@2026#Doctor', category: 'Clinical', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { label: 'Patient', role: 'Patient User', email: 'patient@clinic.com', pass: 'Clinic@2026#Patient', category: 'Clinical', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { label: 'Nurse', role: 'Clinical Nurse', email: 'nurse@clinic.com', pass: 'Clinic@2026#Nurse', category: 'Clinical', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
  { label: 'Lab Tech', role: 'Laboratory', email: 'labtech@clinic.com', pass: 'Clinic@2026#LabTech', category: 'Clinical', color: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100' },
  { label: 'Radiology', role: 'Radiologist', email: 'radiologist@clinic.com', pass: 'Clinic@2026#Radio', category: 'Clinical', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },

  // Operations & Front Desk
  { label: 'Pharmacist', role: 'Dispenser', email: 'pharmacist@clinic.com', pass: 'Clinic@2026#Pharmacy', category: 'Operations', color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' },
  { label: 'Pharma Mgr', role: 'Store Keeper', email: 'pharmacymanager@clinic.com', pass: 'Clinic@2026#PharmMgr', category: 'Operations', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  { label: 'Reception', role: 'Front Desk', email: 'receptionist@clinic.com', pass: 'Clinic@2026#Reception', category: 'Operations', color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' },
  { label: 'Accountant', role: 'Finance & Billing', email: 'accountant@clinic.com', pass: 'Clinic@2026#Account', category: 'Operations', color: 'bg-lime-50 text-lime-700 border-lime-200 hover:bg-lime-100' },
  { label: 'Support Desk', role: 'Helpdesk Staff', email: 'staff@clinic.com', pass: 'Clinic@2026#Staff', category: 'Operations', color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' },

  // Management & Administration
  { label: 'Admin', role: 'Clinic Admin', email: 'admin@clinic.com', pass: 'Clinic@2026#Admin', category: 'Management', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
  { label: 'Super Admin', role: 'Platform Owner', email: 'superadmin@clinic.com', pass: 'Clinic@2026#Super', category: 'Management', color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100' },
  { label: 'Branch Mgr', role: 'Branch Admin', email: 'manager@clinic.com', pass: 'Clinic@2026#Manager', category: 'Management', color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
  { label: 'HR Manager', role: 'HR & Personnel', email: 'hrmanager@clinic.com', pass: 'Clinic@2026#HR', category: 'Management', color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState('');
  const [forgotStep, setForgotStep] = useState(0); // 0 = login, 1 = send email, 2 = reset pass
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [demoCategory, setDemoCategory] = useState('All');

  const [showMustChangePassword, setShowMustChangePassword] = useState(false);
  const [forcedNewPassword, setForcedNewPassword] = useState('');
  const [forcedConfirmPassword, setForcedConfirmPassword] = useState('');
  const [showForcedPass, setShowForcedPass] = useState(false);
  const [forcedPassLoading, setForcedPassLoading] = useState(false);
  const [forcedPassError, setForcedPassError] = useState('');

  const {
    login: storeLogin,
    verifyMfa,
    mfaPending,
    error,
    isLoading,
    mfaEmail,
    clearError,
    token,
    roles,
    user,
    sessionExpiredNotice,
    forgotPassword,
    resetPassword,
  } = useAuthStore();

  // Validate internal returnTo parameter to prevent open redirects
  const getReturnTo = (userRoles = []) => {
    const isPatientOnly = userRoles.includes('ROLE_PATIENT') && !userRoles.includes('ROLE_ADMIN') && !userRoles.includes('ROLE_SUPER_ADMIN') && !userRoles.includes('ROLE_SYSTEM_ADMIN') && !userRoles.includes('ROLE_DOCTOR');
    if (isPatientOnly) {
      const pendingStr = localStorage.getItem('pendingBooking');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          if (pending.doctorId) {
            return `/patient/book/${pending.doctorId}?date=${pending.date || ''}`;
          }
        } catch (e) {
          // ignore
        }
        return '/patient/book';
      }
    }
    const returnTo = searchParams.get('redirect') || searchParams.get('returnTo') || location.state?.from?.pathname;
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      if (returnTo === '/403' || returnTo === '/unauthorized' || returnTo === '/login') {
        return null;
      }
      return returnTo;
    }
    return null;
  };

  useEffect(() => {
    if (isTokenValid(token) && roles && roles.length > 0) {
      if (user?.mustChangePassword) {
        setShowMustChangePassword(true);
        return;
      }
      const target = getReturnTo(roles) || getDefaultDashboardRoute(roles);
      navigate(target, { replace: true });
    }
  }, [token, roles, user?.mustChangePassword, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();
    const res = await storeLogin(email.trim(), password, rememberMe);
    if (res.success) {
      if (res.user?.mustChangePassword) {
        setShowMustChangePassword(true);
        return;
      }
      const target = getReturnTo(res.roles) || getDefaultDashboardRoute(res.roles);
      navigate(target, { replace: true });
    }
  };

  const handleMfa = async (e) => {
    e.preventDefault();
    clearError();
    const res = await verifyMfa(mfaEmail, otp.trim());
    if (res.success) {
      if (res.user?.mustChangePassword) {
        setShowMustChangePassword(true);
        return;
      }
      const target = getReturnTo(res.roles) || getDefaultDashboardRoute(res.roles);
      navigate(target, { replace: true });
    }
  };

  const handleForcedPasswordSubmit = async (e) => {
    e.preventDefault();
    setForcedPassError('');
    if (forcedNewPassword.length < 8) {
      setForcedPassError('Password must be at least 8 characters long');
      return;
    }
    const complexRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!complexRegex.test(forcedNewPassword)) {
      setForcedPassError('Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character');
      return;
    }
    if (forcedNewPassword !== forcedConfirmPassword) {
      setForcedPassError('Passwords do not match');
      return;
    }

    setForcedPassLoading(true);
    try {
      const { axiosPrivate } = await import('../../api/axios');
      await axiosPrivate.post('/users/change-password', { newPassword: forcedNewPassword });
      
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, mustChangePassword: false } : null
      }));

      setShowMustChangePassword(false);
      const target = getReturnTo(roles) || getDefaultDashboardRoute(roles);
      navigate(target, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update password';
      setForcedPassError(msg);
    } finally {
      setForcedPassLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    clearError();
    const ok = await forgotPassword(email.trim());
    if (ok) setForgotStep(2);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearError();
    const ok = await resetPassword(email.trim(), otp.trim(), newPassword);
    if (ok) {
      setResetSuccess(true);
      setTimeout(() => {
        setForgotStep(0);
        setResetSuccess(false);
        setPassword('');
        setOtp('');
        setNewPassword('');
      }, 2000);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden"
      style={{ background: BG, fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background Decorative Circles */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div
        className="w-full max-w-[960px] flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.12)] backdrop-blur-2xl border border-white/60 relative z-10"
        style={{ background: CARD_BG }}
      >
        {/* ── LEFT HERO PANE ───────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[44%] flex-col p-10 bg-white/40 backdrop-blur-md justify-between border-r border-white/40">
          <div>
            <ElixirLogo />
            <div className="mt-12">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Unified Portal <br />
                <span style={{ color: BLUE }}>Single Sign-On</span>
              </h1>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Secure access for Doctors, Patients, Clinical Staff, Pharmacy, Laboratory, and Administrators.
              </p>
            </div>
          </div>

          <div className="my-6">
            <ShieldIllustration />
          </div>

          <div className="space-y-3 border-t border-slate-200/60 pt-6">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
              <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
              <span>HIPAA & GDPR Compliant Security</span>
            </div>
            <p className="text-xs text-slate-500">
              Need an account?{' '}
              <Link to="/register" style={{ color: BLUE }} className="font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* ── RIGHT FORM PANE ──────────────────────────────────────────── */}
        <div className="w-full lg:w-[56%] flex flex-col justify-center p-8 sm:p-12 bg-white/50">
          <div className="flex lg:hidden mb-8 justify-between items-center">
            <ElixirLogo />
            <Link to="/register" style={{ color: BLUE }} className="text-xs font-bold hover:underline">
              Register
            </Link>
          </div>

          {/* Session Expired Notice */}
          <AnimatePresence>
            {sessionExpiredNotice && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-start gap-3 shadow-sm"
              >
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">Session Expired</p>
                  <p className="mt-0.5 text-amber-700">{sessionExpiredNotice}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-3 shadow-sm"
              >
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-900">Authentication Error</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reset Password Success Banner */}
          <AnimatePresence>
            {resetSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Password updated successfully! Redirecting to login...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── MANDATORY PASSWORD CHANGE FORM ─────────────────────────── */}
          {showMustChangePassword ? (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleForcedPasswordSubmit}
              className="space-y-5"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold mb-3">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Mandatory Security Update</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Set Permanent Password</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Your administrator has reset your account with a temporary password. For your security, you must create a new permanent password to continue.
                </p>
              </div>

              {forcedPassError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{forcedPassError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showForcedPass ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={forcedNewPassword}
                    onChange={(e) => setForcedNewPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol"
                    className="w-full pl-12 pr-12 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForcedPass(!showForcedPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer"
                  >
                    {showForcedPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showForcedPass ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={forcedConfirmPassword}
                    onChange={(e) => setForcedConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new permanent password"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700 m-0">Password must include:</p>
                <p className="m-0">• At least 8 characters</p>
                <p className="m-0">• Uppercase & lowercase letters</p>
                <p className="m-0">• At least 1 number & 1 special character (!@#$%^&*)</p>
              </div>

              <button
                type="submit"
                disabled={forcedPassLoading}
                style={{ background: BLUE }}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer border-0 flex items-center justify-center gap-2"
              >
                {forcedPassLoading ? 'Updating Password...' : 'Save Password & Enter Portal'}
              </button>
            </motion.form>
          ) : mfaPending ? (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleMfa}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Two-Factor Verification</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the 6-digit security OTP sent to <strong className="text-slate-800">{mfaEmail}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Security Code (OTP)
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 font-mono tracking-widest text-center text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                style={{ background: BLUE }}
                className="w-full py-4 rounded-2xl text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 hover:opacity-95 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify & Sign In</span>
                )}
              </button>
            </motion.form>
          ) : forgotStep === 1 ? (
            /* ── FORGOT PASSWORD STEP 1 ─────────────────────────────────── */
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleForgotRequest}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your account email to receive a password reset verification code.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@clinic.com"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotStep(0)}
                  className="w-1/3 py-3.5 rounded-2xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  style={{ background: BLUE }}
                  className="w-2/3 py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 hover:opacity-95 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Sending Code...' : 'Send Reset Code'}
                </button>
              </div>
            </motion.form>
          ) : forgotStep === 2 ? (
            /* ── FORGOT PASSWORD STEP 2 ─────────────────────────────────── */
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleResetPassword}
              className="space-y-5"
            >
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Set New Password</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the verification OTP and your new secure password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reset OTP Code
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotStep(0)}
                  className="w-1/3 py-3.5 rounded-2xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !otp || !newPassword}
                  style={{ background: BLUE }}
                  className="w-2/3 py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 hover:opacity-95 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </motion.form>
          ) : (
            /* ── MAIN LOGIN FORM ────────────────────────────────────────── */
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Sign in to continue to your account dashboard.
                </p>
              </div>

              {/* Email / Username / Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address, Username, or Phone Number
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address, Username, or Phone Number"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    style={{ color: BLUE }}
                    className="text-xs font-bold hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Remember me securely on this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                style={{ background: BLUE }}
                className="w-full py-4 rounded-2xl text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 hover:opacity-95 active:scale-[0.99] transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>

              {/* Quick Demo Accounts */}
              <div className="pt-3 border-t border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Quick Fill Demo Roles ({DEMO_ROLES.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">1-click test credentials</span>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-1 scrollbar-none">
                  {['All', 'Clinical', 'Operations', 'Management'].map((cat) => {
                    const count = cat === 'All' ? DEMO_ROLES.length : DEMO_ROLES.filter(r => r.category === cat).length;
                    const isActive = demoCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setDemoCategory(cat)}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer border ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-100 text-slate-600 border-slate-200/80 hover:bg-slate-200'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Roles Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-[190px] overflow-y-auto pr-1">
                  {DEMO_ROLES.filter(r => demoCategory === 'All' || r.category === demoCategory).map((demo) => {
                    const isSelected = email === demo.email;
                    return (
                      <button
                        key={demo.label}
                        type="button"
                        onClick={() => {
                          setEmail(demo.email);
                          setPassword(demo.pass);
                          clearError();
                        }}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer shadow-xs flex flex-col items-center justify-center ${demo.color} ${
                          isSelected ? 'ring-2 ring-blue-600 ring-offset-1 font-extrabold shadow-sm scale-[1.02]' : ''
                        }`}
                        title={`${demo.label} - ${demo.role} (${demo.email})`}
                      >
                        <span className="truncate w-full leading-tight">{demo.label}</span>
                        <span className="text-[9px] font-medium opacity-75 truncate w-full leading-tight mt-0.5">{demo.role}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-center pt-2 lg:hidden">
                <p className="text-xs text-slate-500">
                  Don't have an account?{' '}
                  <Link to="/register" style={{ color: BLUE }} className="font-bold hover:underline">
                    Register Now
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
