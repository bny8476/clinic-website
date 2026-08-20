import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logger from '../../utils/logger';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore, { isTokenValid } from '../../store/authStore';
import { getPortalConfig, PORTAL_CONFIGS } from '../../config/portalConfig';
import { Mail, Lock } from 'lucide-react';
import { listStagger } from '../../components/ui/motion';
/* ─── Medvice colour tokens ──────────────────────────────────────────────── */
const BLUE   = '#2B4AFE';
const BLUE_D = '#1648C0';
const BG     = '#EEF2FB';   // page background
const CARD   = '#FFFFFF';

/* ─── Tiny SVG logo mark (shield + H2) ─────────────────────────────────── */
const MedviceLogo = () => (
  <div className="flex items-center gap-2.5">
    <div
      style={{ background: BLUE }}
      className="w-9 h-9 rounded-xl flex items-center justify-center shadow"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 1.5L3 4.5V10c0 4.1 2.9 7.6 7 8.5 4.1-.9 7-4.4 7-8.5V4.5L10 1.5z" fill="white" fillOpacity=".25"/>
        <path d="M10 1.5L3 4.5V10c0 4.1 2.9 7.6 7 8.5 4.1-.9 7-4.4 7-8.5V4.5L10 1.5z" stroke="white" strokeWidth="1.2"/>
        <path d="M7 10h2v-2h2v2h2v2h-2v2H9v-2H7v-2z" fill="white"/>
      </svg>
    </div>
    <div>
      <p className="font-bold text-[15px] leading-none text-gray-900">Medvice</p>
      <p className="text-[10px] text-gray-500 leading-tight">Medical Clinic</p>
    </div>
  </div>
);

/* ─── Medical Shield + Stethoscope illustration ─────────────────────────── */
const ShieldIllustration = () => (
  <svg viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[240px] mx-auto drop-shadow-xl">
    {/* Outer glow circle */}
    <ellipse cx="130" cy="200" rx="90" ry="18" fill="#2B4AFE" fillOpacity="0.08"/>
    {/* Shield body */}
    <path d="M130 20L48 54v62c0 52 34 98 82 110 48-12 82-58 82-110V54L130 20z" fill="url(#shieldGrad)" />
    <path d="M130 20L48 54v62c0 52 34 98 82 110 48-12 82-58 82-110V54L130 20z" stroke="white" strokeWidth="2" strokeOpacity="0.3"/>
    {/* Cross */}
    <rect x="110" y="102" width="40" height="12" rx="4" fill="white"/>
    <rect x="124" y="88" width="12" height="40" rx="4" fill="white"/>
    {/* Stethoscope arc */}
    <path d="M80 180 Q78 210 98 220 Q118 230 120 210" stroke="#2B4AFE" strokeWidth="8" strokeLinecap="round" fill="none"/>
    <path d="M180 180 Q182 210 162 220 Q142 230 140 210" stroke="#2B4AFE" strokeWidth="8" strokeLinecap="round" fill="none"/>
    <path d="M80 180 Q130 160 180 180" stroke="#2B4AFE" strokeWidth="8" strokeLinecap="round" fill="none"/>
    {/* Stethoscope head */}
    <circle cx="130" cy="208" r="14" fill="#2B4AFE"/>
    <circle cx="130" cy="208" r="8" fill="#2B4AFE" stroke="white" strokeWidth="3"/>
    {/* Ear pieces */}
    <circle cx="78" cy="178" r="6" fill="#2B4AFE"/>
    <circle cx="182" cy="178" r="6" fill="#2B4AFE"/>
    <defs>
      <linearGradient id="shieldGrad" x1="130" y1="20" x2="130" y2="196" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2563EB"/>
        <stop offset="1" stopColor="#1A3A8F"/>
      </linearGradient>
    </defs>
  </svg>
);

/* ─── Google SVG ─────────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

/* ─── Apple SVG ──────────────────────────────────────────────────────────── */
const AppleIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.05 20.28c-.98.74-2.039 1.49-3.26 1.52-1.24.03-1.63-.73-3.04-.73-1.42 0-1.84.72-3.04.76-1.25.04-2.42-.8-3.41-2.24-2.04-2.93-3.6-8.29-1.52-11.9 1.03-1.8 2.87-2.95 4.9-2.98 1.2-.02 2.32.8 3.01.8.7 0 2.06-1 3.48-.85 1.47.05 2.8.71 3.55 1.83-3.08 1.88-2.58 6.13.43 7.37-.73 1.76-1.58 3.51-3.1 5.42zm-3.67-17.75c.61-.75 1.02-1.8 1.02-2.85-.97.05-2.08.68-2.73 1.45-.58.69-1.05 1.78-.9 2.8 1.05.09 2.03-.64 2.61-1.4z"/>
  </svg>
);

/* ─── Divider ────────────────────────────────────────────────────────────── */
const OrDivider = ({ label = 'or continue with' }) => (
  <div className="flex items-center gap-3 my-5">
    <div className="flex-1 h-px bg-gray-200"/>
    <span className="text-[11px] text-gray-400 whitespace-nowrap">{label}</span>
    <div className="flex-1 h-px bg-gray-200"/>
  </div>
);

/* ─── Input wrapper ─────────────────────────────────────────────────────── */
const InputField = ({ icon: Icon, rightSlot, ...props }) => (
  <div className="relative">
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
      <Icon size={15}/>
    </span>
    <input
      {...props}
      className="input-field pl-10 pr-10 w-full py-3 text-[13px]"
    />
    {rightSlot && (
      <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</span>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════════════════ */
export default function PortalLoginPage() {
  const { portalSlug = 'patient' } = useParams();
  const navigate  = useNavigate();
  const config    = getPortalConfig(portalSlug);

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [rememberMe,  setRememberMe]  = useState(false);
  const [otp,         setOtp]         = useState('');
  const [forgotStep,  setForgotStep]  = useState(0);
  const [newPassword, setNewPassword] = useState('');

  const {
    login: storeLogin, verifyMfa, mfaPending, error, isLoading,
    mfaEmail, clearError, token, roles, clearStaleToken,
    forgotPassword, resetPassword,
  } = useAuthStore();

  const resolveTarget = (cfg) => {
    const userRoles = useAuthStore.getState().roles || [];
    const isSuperOrAdmin = userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_SUPER_ADMIN');
    if (isSuperOrAdmin) return cfg.dashboardRoute || '/super-admin/dashboard';
    if (cfg.role && userRoles.includes(cfg.role)) return cfg.dashboardRoute;
    const match = PORTAL_CONFIGS.find(p => userRoles.includes(p.role));
    return match ? match.dashboardRoute : (cfg.dashboardRoute || '/');
  };

  useEffect(() => { clearStaleToken?.(); }, []); // eslint-disable-line
  useEffect(() => {
    if (isTokenValid(token) && roles?.length > 0) navigate(resolveTarget(config), { replace: true });
  }, [token]); // eslint-disable-line
  useEffect(() => { clearError?.(); }, [portalSlug, clearError]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const ok = await storeLogin(portalSlug, email, password);
      if (ok) navigate(resolveTarget(config));
    } catch (err) { logger.error('Login failed:', err); }
  };

  const handleMfa = async (e) => {
    e.preventDefault();
    const ok = await verifyMfa(portalSlug, mfaEmail, otp);
    if (ok) navigate(resolveTarget(config));
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    const ok = await forgotPassword(email);
    if (ok) setForgotStep(2);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const ok = await resetPassword(email, otp, newPassword);
    if (ok) { setForgotStep(0); setPassword(''); setOtp(''); setNewPassword(''); }
  };

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ background: BG, fontFamily: "'Inter', 'Onest', sans-serif" }}
    >
      {/* Card container */}
      <div
        className="w-full max-w-[920px] flex rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: CARD }}
      >

        {/* ── LEFT PANE ─────────────────────────────────────────────────── */}
        <div
          className="hidden lg:flex lg:w-[44%] flex-col p-10"
          style={{ background: BG }}
        >
          {/* Logo */}
          <MedviceLogo />

          {/* Headline */}
          <div className="mt-10">
            <h1 className="text-[26px] font-bold text-gray-900 leading-tight">
              Welcome <span style={{ color: BLUE }}>Back!</span>
            </h1>
            <p className="text-[13px] text-gray-500 mt-2 leading-relaxed max-w-[240px]">
              Sign in to continue to your account and access your healthcare services.
            </p>
          </div>

          {/* Illustration */}
          <div className="flex-1 flex items-center justify-center mt-6">
            <ShieldIllustration />
          </div>

          {/* Bottom link */}
          <p className="text-[12px] text-gray-500 text-center mt-4">
            Don't have an account?{' '}
            <Link to="/register" style={{ color: BLUE }} className="font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

        {/* ── RIGHT PANE ────────────────────────────────────────────────── */}
        <div className="w-full lg:w-[56%] flex flex-col justify-center p-8 sm:p-10">

          {/* Mobile logo */}
          <div className="flex lg:hidden mb-6">
            <MedviceLogo />
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl mb-5 text-[12px]"
              >
                {typeof error === 'string' ? error : error?.message || 'Authentication failed.'}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── FORGOT STEP 1 ── */}
          {forgotStep === 1 ? (
            <form onSubmit={handleForgotRequest}>
              <h2 className="text-[22px] font-bold text-gray-900 mb-1">Reset Password</h2>
              <p className="text-[12px] text-gray-500 mb-6">Enter your email to receive a reset code.</p>
              <InputField icon={Mail} type="email" required value={email}
                onChange={e => setEmail(e.target.value)} placeholder="Email Address" />
              <Button type="submit" isLoading={isLoading}
                className="w-full mt-4 py-3 rounded-xl text-[13px] font-semibold text-white transition-all shadow-md"
                style={{ background: BLUE }}
              >Send Reset Code</Button>
              <button type="button" onClick={() => setForgotStep(0)}
                className="w-full mt-3 py-2 text-[12px] font-semibold"
                style={{ color: BLUE }}
              >Back to Sign In</button>
            </form>

          /* ── FORGOT STEP 2 ── */
          ) : forgotStep === 2 ? (
            <form onSubmit={handleResetPassword}>
              <h2 className="text-[22px] font-bold text-gray-900 mb-1">Create New Password</h2>
              <p className="text-[12px] text-gray-500 mb-6">Enter the code sent to {email}</p>
              <div className="space-y-3">
                <input type="text" required value={otp} onChange={e => setOtp(e.target.value)}
                  className="input-field w-full py-3 px-4 text-center tracking-widest font-mono text-[13px]"
                  placeholder="123456"/>
                <InputField icon={Lock} type={showPass ? 'text' : 'password'} required
                  value={newPassword} onChange={e => setNewPassword(e.newPassword)} placeholder="New Password"
                  rightSlot={
                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  }
                />
              </div>
              <Button type="submit" isLoading={isLoading}
                className="w-full mt-4 py-3 rounded-xl text-[13px] font-semibold text-white transition-all shadow-md"
                style={{ background: BLUE }}
              >Reset Password</Button>
              <button type="button" onClick={() => { setForgotStep(0); setOtp(''); setNewPassword(''); }}
                className="w-full mt-3 py-2 text-[12px] font-semibold" style={{ color: BLUE }}
              >Cancel</button>
            </form>

          /* ── MFA ── */
          ) : mfaPending ? (
            <form onSubmit={handleMfa}>
              <h2 className="text-[22px] font-bold text-gray-900 mb-1">Security Verification</h2>
              <p className="text-[12px] text-gray-500 mb-6">Enter the code sent to {mfaEmail}</p>
              <input type="text" required value={otp} onChange={e => setOtp(e.target.value)}
                className="input-field w-full py-3 px-4 text-center tracking-widest font-mono text-lg"
                placeholder="123456"/>
              <Button type="submit" isLoading={isLoading}
                className="w-full mt-4 py-3 rounded-xl text-[13px] font-semibold text-white transition-all shadow-md"
                style={{ background: BLUE }}
              >Verify Code</Button>
              <button type="button" onClick={() => window.location.reload()}
                className="w-full mt-3 py-2 text-[12px] font-semibold" style={{ color: BLUE }}
              >Back to Login</button>
            </form>

          /* ── DYNAMIC FLOW ── */
          ) : (
            <form onSubmit={handleLogin}>
              <h2 className="text-[22px] font-bold text-gray-900 mb-0.5">
                Sign <span style={{ color: BLUE }}>In</span>
              </h2>
              <p className="text-[12px] text-gray-500 mb-6">
                Welcome back! Please sign in to your account.
              </p>

              <div className="space-y-3">
                <InputField
                  icon={Mail}
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email Address"
                />
                <InputField
                  icon={Lock}
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  rightSlot={
                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  }
                />
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between mt-3.5 mb-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 accent-[#2B4AFE]"
                  />
                  <span className="text-[12px] text-gray-600">Remember Me</span>
                </label>
                <button type="button" onClick={() => setForgotStep(1)}
                  className="text-[12px] font-semibold hover:underline" style={{ color: BLUE }}
                >Forgot Password?</button>
              </div>

              {/* Submit */}
              <Button type="submit" isLoading={isLoading}
                className="w-full mt-4 py-3 rounded-xl text-[13px] font-semibold text-white transition-all shadow-md"
                style={{ background: BLUE }}
              >Sign In</Button>

              {/* OAuth — patient only */}
              {portalSlug === 'patient' && (
                <>
                  <OrDivider />
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button"
                      className="flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl py-2.5 text-[12px] font-semibold text-gray-700 transition-all"
                    >
                      <GoogleIcon /> Google
                    </button>
                    <button type="button"
                      className="flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl py-2.5 text-[12px] font-semibold text-gray-700 transition-all"
                    >
                      <AppleIcon /> Apple
                    </button>
                  </div>
                </>
              )}

              {portalSlug === 'patient' && (
                <p className="text-center text-[12px] text-gray-500 mt-5">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-semibold hover:underline" style={{ color: BLUE }}>
                    Sign Up
                  </Link>
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
