import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { axiosPublic } from '../../api/axios';
import { Mail, Phone, Lock, User } from 'lucide-react';

/* ─── Medvice colour tokens ──────────────────────────────────────────────── */
const BLUE = '#2B4AFE';
const BG   = '#EEF2FB';
const CARD = '#FFFFFF';

/* ─── Shared sub-components (same as PortalLoginPage) ───────────────────── */
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

/* Doctor illustration — female doctor with stethoscope + floating badges */
const DoctorIllustration = () => (
  <div className="relative w-full flex justify-center">
    {/* Floating badge — heart monitor */}
    <motion.div
      animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
      className="absolute top-0 left-4 bg-white rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2 z-10"
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EEF2FB' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 7h2l2-4 2 8 2-6 1 2h2" stroke="#2B4AFE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <p className="text-[9px] font-bold text-gray-800 leading-none">Heart Rate</p>
        <p className="text-[9px] text-gray-500">72 BPM</p>
      </div>
    </motion.div>

    {/* Floating badge — shield */}
    <motion.div
      animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut', delay: 0.4 }}
      className="absolute top-12 right-2 bg-white rounded-xl shadow-lg p-2 z-10"
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EEF2FB' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L1.5 3.5V7c0 3 2 5.5 5.5 6 3.5-.5 5.5-3 5.5-6V3.5L7 1z" fill="#2B4AFE" fillOpacity=".2" stroke="#2B4AFE" strokeWidth="1"/>
          <path d="M5 7h1v-1h2v1h1v2H8v1H6v-1H5V7z" fill="#2B4AFE"/>
        </svg>
      </div>
    </motion.div>

    {/* Floating badge — medical bag */}
    <motion.div
      animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.8 }}
      className="absolute bottom-4 right-6 bg-white rounded-xl shadow-lg p-2 z-10"
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EEF2FB' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="4" width="12" height="9" rx="1.5" stroke="#2B4AFE" strokeWidth="1"/>
          <path d="M5 4V3a2 2 0 014 0v1" stroke="#2B4AFE" strokeWidth="1"/>
          <path d="M7 7v4M5 9h4" stroke="#2B4AFE" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      </div>
    </motion.div>

    {/* Doctor image / avatar placeholder */}
    <div
      className="relative rounded-3xl overflow-hidden mx-auto"
      style={{
        width: 200, height: 260,
        background: 'linear-gradient(160deg, #dbeafe 0%, #eff6ff 100%)',
      }}
    >
      {/* Simple illustrated doctor figure */}
      <svg viewBox="0 0 200 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Body */}
        <rect x="60" y="120" width="80" height="120" rx="16" fill="#FFFFFF" stroke="#dbeafe" strokeWidth="1"/>
        {/* Coat lapels */}
        <path d="M100 125 L80 145 L80 220 L100 220 L100 125z" fill="#f0f7ff"/>
        <path d="M100 125 L120 145 L120 220 L100 220 L100 125z" fill="#f0f7ff"/>
        {/* Stethoscope */}
        <path d="M85 145 Q78 165 84 175 Q92 183 100 178" stroke="#2B4AFE" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <circle cx="100" cy="178" r="6" fill="#2B4AFE"/>
        <circle cx="100" cy="178" r="3" fill="white"/>
        {/* Head */}
        <ellipse cx="100" cy="98" rx="30" ry="32" fill="#FDDCB5"/>
        {/* Hair */}
        <ellipse cx="100" cy="75" rx="30" ry="16" fill="#4B3621"/>
        <ellipse cx="100" cy="78" rx="28" ry="14" fill="#6B4C30"/>
        {/* Coat collar */}
        <path d="M78 120 Q100 112 122 120 L118 126 Q100 118 82 126z" fill="#dbeafe"/>
        {/* Tablet / clipboard */}
        <rect x="118" y="150" width="26" height="34" rx="3" fill="#e0edff" stroke="#2B4AFE" strokeWidth="1"/>
        <line x1="122" y1="158" x2="140" y2="158" stroke="#2B4AFE" strokeWidth="1" strokeLinecap="round"/>
        <line x1="122" y1="164" x2="140" y2="164" stroke="#2B4AFE" strokeWidth="1" strokeLinecap="round"/>
        <line x1="122" y1="170" x2="134" y2="170" stroke="#2B4AFE" strokeWidth="1" strokeLinecap="round"/>
        {/* Arms */}
        <path d="M60 130 Q42 155 48 175 Q52 185 60 182" stroke="#FDDCB5" strokeWidth="12" strokeLinecap="round" fill="none"/>
        <path d="M140 130 Q158 150 158 168 Q158 176 152 178" stroke="#FDDCB5" strokeWidth="12" strokeLinecap="round" fill="none"/>
        {/* Left hand with stethoscope */}
        <circle cx="60" cy="184" r="10" fill="#FDDCB5"/>
      </svg>
    </div>
  </div>
);

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.05 20.28c-.98.74-2.039 1.49-3.26 1.52-1.24.03-1.63-.73-3.04-.73-1.42 0-1.84.72-3.04.76-1.25.04-2.42-.8-3.41-2.24-2.04-2.93-3.6-8.29-1.52-11.9 1.03-1.8 2.87-2.95 4.9-2.98 1.2-.02 2.32.8 3.01.8.7 0 2.06-1 3.48-.85 1.47.05 2.8.71 3.55 1.83-3.08 1.88-2.58 6.13.43 7.37-.73 1.76-1.58 3.51-3.1 5.42zm-3.67-17.75c.61-.75 1.02-1.8 1.02-2.85-.97.05-2.08.68-2.73 1.45-.58.69-1.05 1.78-.9 2.8 1.05.09 2.03-.64 2.61-1.4z"/>
  </svg>
);

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

/* ═══════════════════════════════════════════════════════════════════════════ */
const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', agreeTerms: false,
  });
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleNameChange = (e) => {
    const parts = e.target.value.split(' ');
    setFormData({ ...formData, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
    if (!formData.agreeTerms) { setError('You must agree to the Terms of Service and Privacy Policy.'); return; }
    setLoading(true);
    try {
      await axiosPublic.post('/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName || formData.firstName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phone,
      });
      setSuccess('Registration successful! Redirecting to login…');
      setTimeout(() => navigate('/patient/login'), 1500);
    } catch (err) {
      let msg = 'Registration failed. Please check details.';
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === 'string') msg = d;
        else if (d.data && typeof d.data === 'object') msg = d.message + ': ' + Object.values(d.data).join(', ');
        else if (d.message) msg = d.message;
      }
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ background: BG, fontFamily: "'Inter', 'Onest', sans-serif" }}
    >
      {/* Card */}
      <div className="w-full max-w-[920px] flex rounded-3xl overflow-hidden shadow-2xl" style={{ background: CARD }}>

        {/* ── LEFT PANE ───────────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[44%] flex-col p-10" style={{ background: BG }}>
          <MedviceLogo />

          <div className="mt-10">
            <h1 className="text-[26px] font-bold text-gray-900 leading-tight">
              We Care For{' '}
              <span style={{ color: BLUE }}>Your Health</span>
            </h1>
            <p className="text-[13px] text-gray-500 mt-2 leading-relaxed max-w-[240px]">
              Create your account to access personalized healthcare services and manage your appointments with ease.
            </p>
          </div>

          {/* Doctor illustration */}
          <div className="flex-1 flex items-center justify-center mt-6">
            <DoctorIllustration />
          </div>

          {/* Bottom link */}
          <p className="text-[12px] text-gray-500 text-center mt-4">
            Already have an account?{' '}
            <Link to="/patient/login" style={{ color: BLUE }} className="font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        {/* ── RIGHT PANE ──────────────────────────────────────────────── */}
        <div className="w-full lg:w-[56%] flex flex-col justify-center p-8 sm:p-10 overflow-y-auto max-h-screen">

          {/* Mobile logo */}
          <div className="flex lg:hidden mb-6">
            <MedviceLogo />
          </div>

          {/* Heading */}
          <h2 className="text-[22px] font-bold text-gray-900 mb-0.5">
            Create <span style={{ color: BLUE }}>Your Account</span>
          </h2>
          <p className="text-[12px] text-gray-500 mb-5">Sign up to get started with Medvice</p>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl mb-4 text-[12px]"
              >{error}</motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-green-50 border border-green-200 text-green-700 p-3.5 rounded-xl mb-4 text-[12px]"
              >{success}</motion.div>
            )}
          </AnimatePresence>

          <motion.form 
            onSubmit={handleRegister} 
            className="space-y-3"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            initial="hidden"
            animate="visible"
          >
            {/* Full Name */}
            <motion.div variants={listStagger}>
              <InputField icon={User} type="text" required onChange={handleNameChange} placeholder="Full Name"/>
            </motion.div>

            {/* Email */}
            <motion.div variants={listStagger}>
              <InputField icon={Mail} type="email" required name="email" value={formData.email} onChange={handleChange} placeholder="Email Address"/>
            </motion.div>

            {/* Phone */}
            <motion.div variants={listStagger}>
              <InputField icon={Phone} type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number"/>
            </motion.div>

            {/* Password */}
            <motion.div variants={listStagger}>
              <InputField
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                required name="password" value={formData.password} onChange={handleChange}
                placeholder="Password"
                rightSlot={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                }
              />
            </motion.div>

            {/* Confirm Password */}
            <motion.div variants={listStagger}>
              <InputField
                icon={Lock}
                type={showConfirmPassword ? 'text' : 'password'}
                required name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                placeholder="Confirm Password"
                rightSlot={
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                }
              />
            </motion.div>

            {/* Terms checkbox */}
            <motion.div variants={listStagger} className="flex items-start gap-2.5 mt-4 mb-5">
              <input
                type="checkbox" required
                name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 accent-[#2B4AFE]"
              />
              <span className="text-[12px] text-gray-500 leading-tight">
                I agree to Medvice's <a href="#" style={{ color: BLUE }} className="hover:underline">Terms of Service</a> and <a href="#" style={{ color: BLUE }} className="hover:underline">Privacy Policy</a>
              </span>
            </motion.div>

            {/* Submit */}
            <motion.div variants={listStagger}>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-[13px] font-semibold text-white shadow-md transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ background: BLUE }}
              >
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Create Account
              </button>
            </motion.div>

            {/* OAuth */}
            <motion.div variants={listStagger}>
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gray-200"/>
                <span className="text-[11px] text-gray-400 whitespace-nowrap">or continue with</span>
                <div className="flex-1 h-px bg-gray-200"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button"
                  className="flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl py-2.5 text-[12px] font-semibold text-gray-700 transition-all"
                ><GoogleIcon /> Google</button>
                <button type="button"
                  className="flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl py-2.5 text-[12px] font-semibold text-gray-700 transition-all"
                ><AppleIcon /> Apple</button>
              </div>
            </motion.div>

            {/* Mobile bottom link */}
            <motion.p variants={listStagger} className="text-center text-[12px] text-gray-500 lg:hidden pt-1">
              Already have an account?{' '}
              <Link to="/patient/login" style={{ color: BLUE }} className="font-semibold hover:underline">Sign In</Link>
            </motion.p>

          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default Register;
