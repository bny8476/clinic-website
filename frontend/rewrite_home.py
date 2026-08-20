import re
import sys

content = """import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Users, Building2, Phone, PhoneCall, ChevronDown,
  Calendar, User, Mail, ArrowRight, HeartPulse, Stethoscope,
  Brain, Bone, Activity, Menu, X, Star,
  CheckCircle2, Clock, Ambulance, Microscope,
  MapPin, ChevronRight, Quote, Loader2
} from 'lucide-react';
import { usePublicDoctors, usePublicDepartments, useBookAppointment, useClinicStats } from '../../api/publicApi';
import toast from 'react-hot-toast';
import './Home.css';

/* ════════════════════════════════════════════════════════════════════════════
   CONSTANTS & TOKENS
════════════════════════════════════════════════════════════════════════════ */
const BLUE     = '#2B4AFE';
const BLUE_D   = '#1A38E0';
const DARK     = '#0B1220';
const BG       = '#F4F6FF';
const BG_LIGHT = '#E8EDFF';
const MUTED    = '#667085';
const BORDER   = '#DCE3F5';
const WHITE    = '#FFFFFF';

/* ════════════════════════════════════════════════════════════════════════════
   STATIC DATA
════════════════════════════════════════════════════════════════════════════ */
const NAV_LINKS = [
  { label: 'Home', href: '#hero' },
  { label: 'About Us', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Doctors', href: '#doctors' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact Us', href: '#contact' },
];

const SERVICES = [
  {
    icon: HeartPulse, title: 'Cardiology',
    desc: 'Comprehensive heart care with advanced diagnostic tools and experienced cardiologists.',
    color: '#FF6B6B',
  },
  {
    icon: Activity, title: 'Pulmonary',
    desc: 'Expert lung and respiratory disease management for optimal breathing health.',
    color: '#4ECDC4',
  },
  {
    icon: Brain, title: 'Neurology',
    desc: 'State-of-the-art neurological treatment for brain and nervous system disorders.',
    color: '#A855F7',
  },
  {
    icon: Bone, title: 'Orthopedics',
    desc: 'Advanced bone, joint, and muscle care with minimally invasive surgery options.',
    color: '#F59E0B',
  },
  {
    icon: Microscope, title: 'Laboratory',
    desc: 'Cutting-edge diagnostic laboratory services for accurate and timely results.',
    color: '#10B981',
  },
];

const WHY_US = [
  { icon: ShieldCheck, title: 'Expert Doctors', desc: '25+ board-certified specialists across all major medical disciplines.' },
  { icon: PhoneCall, title: 'Emergency Care', desc: '24/7 emergency care with rapid response teams always ready.' },
  { icon: Building2, title: 'Modern Facilities', desc: 'State-of-the-art equipment and internationally accredited facilities.' },
  { icon: Clock, title: '24/7 Support', desc: 'Round-the-clock patient support and telemedicine consultations.' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah Johnson', role: 'Patient', rating: 5,
    text: 'The level of care I received was exceptional. The doctors were knowledgeable, compassionate, and took time to explain everything. Highly recommend!',
    avatar: 'https://i.pravatar.cc/80?img=47',
  },
  {
    name: 'Michael Chen', role: 'Patient', rating: 5,
    text: 'World-class facility with cutting-edge technology. My surgery was a complete success and recovery was smooth thanks to the amazing nursing staff.',
    avatar: 'https://i.pravatar.cc/80?img=33',
  },
  {
    name: 'Emily Rodriguez', role: 'Patient', rating: 5,
    text: 'After years of dealing with chronic pain, the orthopedics team here finally gave me my life back. I cannot thank them enough for their expertise.',
    avatar: 'https://i.pravatar.cc/80?img=32',
  },
];

const BLOG_POSTS = [
  {
    tag: 'Cardiology', date: 'August 15, 2026',
    title: '10 Warning Signs You Shouldn\\'t Ignore About Your Heart Health',
    img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop',
    excerpt: 'Early detection is key. Learn the critical warning signs that indicate you should see a cardiologist immediately.',
  },
  {
    tag: 'Wellness', date: 'August 10, 2026',
    title: 'How Modern Neurology Is Transforming Stroke Recovery',
    img: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=600&auto=format&fit=crop',
    excerpt: 'Innovative rehabilitation techniques are helping stroke survivors regain function faster than ever before.',
  },
  {
    tag: 'Orthopedics', date: 'August 5, 2026',
    title: 'Minimally Invasive Surgery: Faster Recovery, Better Outcomes',
    img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=600&auto=format&fit=crop',
    excerpt: 'Learn how our orthopedic surgeons use the latest arthroscopic techniques for better patient outcomes.',
  },
];

const DEPARTMENTS_FALLBACK = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pulmonary',
  'Pediatrics', 'Dermatology', 'Ophthalmology',
];

/* ════════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
════════════════════════════════════════════════════════════════════════════ */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

const floatAnim = {
  animate: {
    y: [0, -12, 0],
    transition: { duration: 4, ease: "easeInOut", repeat: Infinity }
  }
};

/* ════════════════════════════════════════════════════════════════════════════
   SVG LOGO MARK
════════════════════════════════════════════════════════════════════════════ */
const AurelianLogo = ({ size = 40 }) => (
  <div className="flex items-center gap-2.5 select-none cursor-pointer">
    <div
      className="rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
      style={{ width: size, height: size, background: BLUE }}
    >
      <HeartPulse className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2.5}/>
    </div>
    <div>
      <p className="font-black text-[17px] leading-none tracking-tight" style={{ color: DARK }}>Aurelian Health</p>
      <p className="text-[10px] font-medium leading-tight" style={{ color: MUTED }}>Medical Center</p>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════
   STAT COUNTER COMPONENT (Framer Motion driven)
════════════════════════════════════════════════════════════════════════════ */
const StatCounter = ({ value, suffix, label, icon: Icon }) => {
  const num = parseInt(String(value).replace(/\D/g, '')) || 0;
  // Fallback to static render or a simple animated counter. Let's do simple static for now to avoid custom hooks causing flicker
  const display = num >= 1000
    ? `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`
    : String(num);

  return (
    <motion.div variants={fadeUp} className="text-center bg-white p-6 rounded-2xl border border-[#DCE3F5] shadow-sm hover:shadow-md transition-shadow">
      <div
        className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3"
        style={{ background: BG_LIGHT }}
      >
        <Icon className="w-5 h-5" style={{ color: BLUE }}/>
      </div>
      <p className="text-2xl font-black leading-none mb-1" style={{ color: BLUE }}>
        {display}{suffix}
      </p>
      <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">{label}</p>
    </motion.div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   DOCTOR CARD
════════════════════════════════════════════════════════════════════════════ */
const DoctorCard = ({ doc, getBookLink }) => {
  const name = doc.firstName && doc.lastName
    ? `Dr. ${doc.firstName} ${doc.lastName}`
    : `Dr. ${doc.name || 'Specialist'}`;

  const avatarUrl = doc.profilePictureUrl
    || doc.photoUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E8EDFF&color=2B4AFE&size=200&bold=true&format=png`;

  return (
    <motion.div
      variants={fadeUp}
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-[#DCE3F5] group hover:shadow-2xl transition-all duration-500"
    >
      <div className="relative overflow-hidden" style={{ background: BG }}>
        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6 }}
          src={avatarUrl}
          alt={name}
          loading="lazy"
          className="w-full h-56 object-cover object-top origin-bottom"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E8EDFF&color=2B4AFE&size=200&bold=true`;
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </div>
      <div className="p-6 relative bg-white z-10 -mt-4 rounded-t-2xl">
        <h3 className="font-black text-gray-900 text-[16px] leading-tight mb-1">{name}</h3>
        <p className="text-[13px] font-semibold mb-3" style={{ color: BLUE }}>
          {doc.specialty || doc.specialization || 'General Practitioner'}
        </p>
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>
            ))}
            <span className="text-[12px] font-semibold text-gray-600 ml-1">5.0</span>
            </div>
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{doc.experience || '10+'} yrs exp</span>
        </div>
        <Link
          to={getBookLink(doc.userId || doc.id)}
          className="block w-full text-center py-3 rounded-xl text-[13px] font-bold transition-all hover:bg-opacity-90 active:scale-[0.98]"
          style={{ background: BLUE, color: WHITE }}
        >
          Book Appointment
        </Link>
      </div>
    </motion.div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   APPOINTMENT FORM
════════════════════════════════════════════════════════════════════════════ */
const AppointmentForm = ({ departments }) => {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', department: '', date: '',
  });
  const [errors, setErrors] = useState({});
  const { mutate, isPending, isSuccess } = useBookAppointment();

  const validate = () => {
    const errs = {};
    if (!form.name.trim())        errs.name       = 'Name is required';
    if (!form.phone.trim())       errs.phone      = 'Phone is required';
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
    if (!form.department)         errs.department = 'Select a department';
    if (!form.date)               errs.date       = 'Select a date';
    return errs;
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    mutate(form, {
      onSuccess: () => {
        toast.success('Appointment request submitted! We will confirm shortly.', { duration: 5000 });
        setForm({ name: '', phone: '', email: '', department: '', date: '' });
      },
      onError: (err) => {
        const msg = err?.response?.data?.message || 'Failed to book. Please try again.';
        toast.error(msg);
      },
    });
  };

  if (isSuccess) return (
    <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="bg-white rounded-3xl p-8 shadow-2xl border border-[#DCE3F5]">
      <div className="text-center py-8">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: BLUE }}/>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
        <p className="text-sm text-gray-500">Our team will contact you within 24 hours to confirm your appointment.</p>
        <button
          onClick={() => setForm({ name: '', phone: '', email: '', department: '', date: '' })}
          className="mt-6 text-sm font-semibold hover:underline"
          style={{ color: BLUE }}
        >Book Another →</button>
      </div>
    </motion.div>
  );

  const Field = ({ name, placeholder, type = 'text', Icon }) => (
    <div className="relative mb-4">
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full border-b-2 py-3.5 pr-8 text-[14px] font-medium bg-transparent outline-none transition-colors placeholder-gray-400
          ${errors[name] ? 'border-red-400 text-red-600' : 'border-gray-200 focus:border-[#2B4AFE]'}`}
      />
      {Icon && <Icon className="w-4 h-4 absolute right-0 top-4" style={{ color: errors[name] ? '#ef4444' : MUTED }}/>}
      {errors[name] && <p className="text-[11px] font-medium text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-[#DCE3F5] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2" style={{ background: `linear-gradient(90deg, ${BLUE}, #4ECDC4)` }} />
      <h3 className="text-[22px] font-black text-gray-900 mb-6">Book Appointment</h3>
      <form onSubmit={handleSubmit} noValidate>
        <Field name="name" placeholder="Your Full Name" Icon={User}/>
        <Field name="phone" placeholder="Phone Number" type="tel" Icon={Phone}/>
        <Field name="email" placeholder="Your Email Address" type="email" Icon={Mail}/>

        <div className="relative mb-4">
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            className={`w-full border-b-2 py-3.5 pr-8 text-[14px] font-medium bg-transparent outline-none appearance-none transition-colors
              ${errors.department ? 'border-red-400 text-red-600' : 'border-gray-200 focus:border-[#2B4AFE]'}
              ${!form.department ? 'text-gray-400' : 'text-gray-900'}`}
          >
            <option value="">Select Department</option>
            {(departments?.length ? departments : DEPARTMENTS_FALLBACK).map((d) => (
              <option key={typeof d === 'string' ? d : d.id} value={typeof d === 'string' ? d : d.name}>
                {typeof d === 'string' ? d : d.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-0 top-4 pointer-events-none" style={{ color: errors.department ? '#ef4444' : MUTED }}/>
          {errors.department && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.department}</p>}
        </div>

        <div className="relative mb-6">
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full border-b-2 py-3.5 pr-8 text-[14px] font-medium bg-transparent outline-none transition-colors
              ${errors.date ? 'border-red-400 text-red-600' : 'border-gray-200 focus:border-[#2B4AFE]'}
              ${!form.date ? 'text-gray-400' : 'text-gray-900'}`}
          />
          <Calendar className="w-4 h-4 absolute right-0 top-4 pointer-events-none" style={{ color: errors.date ? '#ef4444' : MUTED }}/>
          {errors.date && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.date}</p>}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isPending}
          className="w-full text-white py-4 rounded-xl text-[14px] font-black mt-2 flex items-center justify-center gap-2 shadow-lg"
          style={{ background: BLUE, boxShadow: `0 8px 30px ${BLUE}40` }}
        >
          {isPending ? <><Loader2 className="w-5 h-5 animate-spin"/> Submitting…</> : 'Book Appointment'}
        </motion.button>
      </form>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   MAIN HOME COMPONENT
════════════════════════════════════════════════════════════════════════════ */
const Home = () => {
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false);
  const [activeSection,   setActiveSection]   = useState('hero');
  const [scrolled,        setScrolled]        = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const navigate = useNavigate();

  const { data: doctors,     isLoading: loadingDoctors }  = usePublicDoctors();
  const { data: departments, isLoading: loadingDepts }    = usePublicDepartments();
  const { data: stats }                                   = useClinicStats();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      const sectionIds = ['hero', 'about', 'services', 'doctors', 'blog', 'contact'];
      for (const id of [...sectionIds].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 150) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id.replace('#', ''));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  }, []);

  const getBookLink = (docId) => {
    const token = window.__CLINIC_TOKEN__;
    if (!token) return '/register';
    return `/patient/book/${docId}`;
  };

  const displayedDoctors = (doctors || []).slice(0, 4);
  const deptList         = departments || [];

  return (
    <div className="min-h-screen font-inter" style={{ background: WHITE, color: DARK, overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════════════ */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)',
          borderBottom: scrolled ? `1px solid ${BORDER}` : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 h-[80px] flex items-center justify-between">
          <div onClick={() => scrollTo('hero')}>
            <AurelianLogo size={44} />
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <button
                key={label}
                onClick={() => scrollTo(href)}
                className="text-[14px] font-bold transition-all relative py-2"
                style={{
                  color: activeSection === href.replace('#', '') ? BLUE : DARK,
                }}
              >
                {label}
                {activeSection === href.replace('#', '') && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full"
                    style={{ background: BLUE }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-6">
            <Link to="/auth/login" className="text-[14px] font-bold hover:text-[#2B4AFE] transition-colors">
              Login Portal
            </Link>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-full text-white font-black text-[13px] shadow-lg flex items-center gap-2"
              style={{ background: BLUE, boxShadow: `0 8px 24px ${BLUE}40` }}
              onClick={() => scrollTo('about')}
            >
              Book Appointment
            </motion.button>
          </div>

          <button
            className="lg:hidden p-2 rounded-full bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" style={{ color: BLUE }}/> : <Menu className="w-5 h-5" style={{ color: BLUE }}/>}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-white border-b border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-6 flex flex-col gap-4">
                {NAV_LINKS.map(({ label, href }) => (
                  <button
                    key={label}
                    onClick={() => scrollTo(href)}
                    className="text-left text-[16px] font-bold py-2 border-b border-gray-100"
                    style={{ color: activeSection === href.replace('#', '') ? BLUE : DARK }}
                  >
                    {label}
                  </button>
                ))}
                <Link to="/auth/login" className="text-[16px] font-bold py-2 border-b border-gray-100">
                  Login Portal
                </Link>
                <button
                  className="w-full mt-4 py-4 rounded-xl text-white font-black text-[15px]"
                  style={{ background: BLUE }}
                  onClick={() => { scrollTo('about'); setMobileMenuOpen(false); }}
                >
                  Book Appointment
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section id="hero" className="relative pt-[120px] lg:pt-[160px] pb-20 lg:pb-32 px-4 sm:px-6 lg:px-16 overflow-hidden">
        {/* Soft Background Gradient Blob */}
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full blur-[120px] opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle, ${BLUE} 0%, transparent 70%)` }} />
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <motion.div 
            className="lg:w-1/2"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold mb-8 bg-blue-50 border border-blue-100 text-blue-700">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
              </span>
              Modern Healthcare for Everyone
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-[clamp(44px,5.5vw,76px)] font-black leading-[1.05] tracking-tight mb-6">
              Exceptional <br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(90deg, ${BLUE}, #4ECDC4)` }}>Medical Care</span> <br />
              Closer to You.
            </motion.h1>

            <motion.p variants={fadeUp} className="text-[16px] lg:text-[18px] text-gray-600 leading-relaxed mb-10 max-w-[500px]">
              Aurelian Health combines cutting-edge medical technology with compassionate specialists to provide world-class healthcare for you and your family.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full text-white font-black text-[15px] flex items-center justify-center gap-3 shadow-xl"
                style={{ background: BLUE, boxShadow: `0 12px 30px ${BLUE}40` }}
                onClick={() => scrollTo('about')}
              >
                Book Appointment <ArrowRight className="w-5 h-5"/>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: BG_LIGHT }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full font-black text-[15px] flex items-center justify-center gap-3 border-2 transition-colors"
                style={{ color: BLUE, borderColor: BLUE }}
                onClick={() => scrollTo('services')}
              >
                Explore Services
              </motion.button>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-14 flex items-center gap-6 pt-8 border-t border-gray-100">
                <div className="flex -space-x-4">
                    <img className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&auto=format&fit=crop" alt="Doctor" />
                    <img className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&auto=format&fit=crop" alt="Doctor" />
                    <img className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&auto=format&fit=crop" alt="Doctor" />
                </div>
                <div>
                    <div className="flex items-center gap-1 mb-1">
                        {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                    </div>
                    <p className="text-[13px] font-bold text-gray-800">Over 15,000+ Happy Patients</p>
                </div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="lg:w-1/2 relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="relative z-10 rounded-[40px] overflow-hidden shadow-2xl" style={{ border: '8px solid white' }}>
              <img 
                src="https://images.unsplash.com/photo-1638202993928-7267aad84c31?q=80&w=1000&auto=format&fit=crop" 
                alt="Modern Clinic" 
                className="w-full h-[600px] object-cover"
              />
            </div>

            <motion.div 
              variants={floatAnim}
              animate="animate"
              className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 z-20 flex items-center gap-5"
            >
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <Ambulance className="w-8 h-8" style={{ color: BLUE }} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-1">Emergency Service</p>
                <p className="text-2xl font-black text-gray-900">24/7 Available</p>
              </div>
            </motion.div>

            <motion.div 
              variants={floatAnim}
              animate="animate"
              style={{ animationDelay: '2s' }}
              className="absolute top-12 -right-8 bg-white px-6 py-4 rounded-full shadow-2xl border border-gray-100 z-20 flex items-center gap-3"
            >
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[14px] font-bold text-gray-900">Online Consultations Available</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          ABOUT US + BOOKING
      ══════════════════════════════════════════════════════════════════ */}
      <section id="about" className="py-24 bg-gray-50 px-4 sm:px-6 lg:px-16">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
            
          <motion.div 
            className="lg:w-[40%]"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.p variants={fadeUp} className="text-[13px] font-black uppercase tracking-widest mb-4" style={{ color: BLUE }}>Welcome to Aurelian Health</p>
            <motion.h2 variants={fadeUp} className="text-[clamp(32px,4vw,48px)] font-black leading-tight mb-6">
              Complete Medical Solutions in One Place
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[16px] leading-relaxed text-gray-600 mb-10">
              For over two decades, Aurelian Health has been at the forefront of medical excellence. We combine state-of-the-art technology with compassionate, patient-centered care.
            </motion.p>

            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-6">
                <StatCounter value={stats?.expertDoctors || 45} suffix="+" label="Specialists" icon={Stethoscope} />
                <StatCounter value={stats?.happyPatients || 15000} suffix="+" label="Patients" icon={Users} />
                <StatCounter value={12} suffix="+" label="Departments" icon={Building2} />
                <StatCounter value={24} suffix="/7" label="Emergency" icon={Ambulance} />
            </motion.div>
          </motion.div>

          <motion.div 
            className="lg:w-[60%] w-full relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <AppointmentForm departments={deptList}/>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SERVICES
      ══════════════════════════════════════════════════════════════════ */}
      <section id="services" className="py-24 px-4 sm:px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16 max-w-2xl mx-auto"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.p variants={fadeUp} className="text-[13px] font-black uppercase tracking-widest mb-4" style={{ color: BLUE }}>Medical Departments</p>
            <motion.h2 variants={fadeUp} className="text-[clamp(32px,4vw,48px)] font-black leading-tight mb-6">
              Premium Healthcare Services
            </motion.h2>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {SERVICES.map((srv, i) => (
              <motion.div
                key={srv.title}
                variants={scaleIn}
                whileHover={{ y: -10, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)' }}
                className="bg-gray-50 rounded-3xl p-8 cursor-pointer transition-colors hover:bg-white border border-transparent hover:border-gray-200 group"
                onClick={() => scrollTo('about')}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                  style={{ background: WHITE, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                >
                  <srv.icon className="w-8 h-8" style={{ color: BLUE }}/>
                </div>
                <h3 className="font-black text-[18px] text-gray-900 mb-3">{srv.title}</h3>
                <p className="text-[14px] leading-relaxed text-gray-500 mb-6">{srv.desc}</p>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          DOCTORS
      ══════════════════════════════════════════════════════════════════ */}
      <section id="doctors" className="py-24 bg-gray-50 px-4 sm:px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <div>
              <motion.p variants={fadeUp} className="text-[13px] font-black uppercase tracking-widest mb-4" style={{ color: BLUE }}>Meet Our Specialists</p>
              <motion.h2 variants={fadeUp} className="text-[clamp(32px,4vw,48px)] font-black leading-tight">
                Top Rated Doctors
              </motion.h2>
            </div>
            <motion.button variants={fadeUp} className="px-6 py-3 rounded-full border-2 border-gray-300 font-bold text-[14px] hover:border-blue-600 hover:text-blue-600 transition-colors flex items-center gap-2">
                View All Directory <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {loadingDoctors ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
          ) : (
            <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={staggerContainer}
            >
                {(displayedDoctors.length > 0 ? displayedDoctors : [
                  { name: 'Dr. James Wilson',   specialty: 'Cardiologist',      img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=400&auto=format&fit=crop' },
                  { name: 'Dr. Sarah Mitchell', specialty: 'Neurologist',       img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop' },
                  { name: 'Dr. Michael Park',   specialty: 'Orthopedic Surgeon',img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop' },
                  { name: 'Dr. Emily Torres',   specialty: 'Pulmonologist',     img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=400&auto=format&fit=crop' },
                ]).map((doc, i) => (
                    <DoctorCard key={i} doc={doc} getBookLink={getBookLink} />
                ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CTA SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="rounded-[40px] p-12 lg:p-20 text-center relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${DARK} 0%, #1a2942 100%)` }}
            >
                <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cubes.png')` }} />
                
                <h2 className="text-[clamp(32px,4vw,56px)] font-black text-white leading-tight mb-6 relative z-10">
                    Your Health Cannot Wait. <br/> Get The Best Care Today.
                </h2>
                <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto relative z-10">
                    Join thousands of patients who trust Aurelian Health for their medical needs. Schedule your appointment online in seconds.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                    <button className="px-10 py-5 rounded-full bg-white text-gray-900 font-black text-[16px] hover:scale-105 transition-transform" onClick={() => scrollTo('about')}>
                        Book an Appointment
                    </button>
                    <a href="tel:+11234567890" className="px-10 py-5 rounded-full bg-blue-600 text-white font-black text-[16px] flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors">
                        <PhoneCall className="w-5 h-5" /> Contact Us
                    </a>
                </div>
            </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-50 pt-20 pb-10 border-t border-gray-200 px-4 sm:px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                <div>
                    <div className="mb-6"><AurelianLogo size={40} /></div>
                    <p className="text-gray-500 text-[14px] leading-relaxed mb-6">Providing world-class medical excellence with a compassionate touch. Your health is our priority.</p>
                    <div className="flex gap-3">
                        {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-blue-600 hover:text-white transition-colors" />)}
                    </div>
                </div>
                <div>
                    <h4 className="font-black text-[18px] text-gray-900 mb-6">Quick Links</h4>
                    <ul className="space-y-4">
                        {NAV_LINKS.map(l => (
                            <li key={l.label}><button onClick={() => scrollTo(l.href)} className="text-gray-500 hover:text-blue-600 font-semibold text-[14px] transition-colors">{l.label}</button></li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="font-black text-[18px] text-gray-900 mb-6">Services</h4>
                    <ul className="space-y-4">
                        {SERVICES.map(s => (
                            <li key={s.title}><button onClick={() => scrollTo('services')} className="text-gray-500 hover:text-blue-600 font-semibold text-[14px] transition-colors">{s.title}</button></li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="font-black text-[18px] text-gray-900 mb-6">Contact Us</h4>
                    <ul className="space-y-4 text-gray-500 text-[14px] font-semibold">
                        <li className="flex items-center gap-3"><MapPin className="w-5 h-5 text-blue-600" /> 121 Clinic Ave, New York</li>
                        <li className="flex items-center gap-3"><PhoneCall className="w-5 h-5 text-blue-600" /> +1 (234) 567-890</li>
                        <li className="flex items-center gap-3"><Mail className="w-5 h-5 text-blue-600" /> support@aurelian.health</li>
                    </ul>
                </div>
            </div>
            <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-[14px] font-medium">
                <p>© {new Date().getFullYear()} Aurelian Health. All rights reserved.</p>
                <div className="flex gap-6">
                    <span className="cursor-pointer hover:text-blue-600">Privacy Policy</span>
                    <span className="cursor-pointer hover:text-blue-600">Terms of Service</span>
                </div>
            </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
