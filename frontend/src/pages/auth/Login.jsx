import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldAlert, Sparkles, User } from 'lucide-react';
import useAuthStore, { getDefaultDashboardRoute, isTokenValid } from '../../store/authStore';

/* ── Medvice color tokens ────────────────────────────────────────────────── */
const BLUE = '#2B4AFE';
const BG = 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)';
const CARD_BG = 'rgba(255, 255, 255, 0.55)';

/* ── Medvice Logo ───────────────────────────────────────────────────────── */
const MedviceLogo = () => (
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
      <p className="font-extrabold text-lg leading-none text-slate-900 tracking-tight">Medvice</p>
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
    sessionExpiredNotice,
    forgotPassword,
    resetPassword,
  } = useAuthStore();

  // Validate internal returnTo parameter to prevent open redirects
  const getReturnTo = () => {
    const returnTo = searchParams.get('returnTo') || location.state?.from?.pathname;
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      return returnTo;
    }
    return null;
  };

  useEffect(() => {
    if (isTokenValid(token) && roles && roles.length > 0) {
      const target = getReturnTo() || getDefaultDashboardRoute(roles);
      navigate(target, { replace: true });
    }
  }, [token, roles, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();
    const res = await storeLogin(email.trim(), password, rememberMe);
    if (res.success) {
      const target = getReturnTo() || getDefaultDashboardRoute(res.roles);
      navigate(target, { replace: true });
    }
  };

  const handleMfa = async (e) => {
    e.preventDefault();
    clearError();
    const res = await verifyMfa(mfaEmail, otp.trim());
    if (res.success) {
      const target = getReturnTo() || getDefaultDashboardRoute(res.roles);
      navigate(target, { replace: true });
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
            <MedviceLogo />
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
            <MedviceLogo />
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

          {/* ── MFA FORM ─────────────────────────────────────────────────── */}
          {mfaPending ? (
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
                  Enter your credentials to access your account dashboard.
                </p>
              </div>

              {/* Email / Username / Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email, Username, or Phone Number
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. doctor@clinic.com or +1234567890"
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
                    placeholder="••••••••"
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
