import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useInView, useReducedMotion } from 'framer-motion';
import { 
  HeartPulse, Brain, Bone, Activity, FlaskConical,
  ArrowLeft, ArrowRight, BadgeCheck, Bell, Calendar, CheckCircle, CheckCircle2,
  ChevronDown, Clock, Headphones, Heart, Mail, MapPin, Menu, 
  MessageCircle, MessageSquare, Monitor, Phone, PhoneCall, Play, 
  Plus, Printer, Quote, ShieldCheck, Star, Stethoscope, Target, 
  ThumbsUp, User, UserCheck, Users
} from 'lucide-react';
import { usePublicDoctors, usePublicDepartments } from '../../api/publicApi';
import './Home.css';

/* ════════════════════════════════════════════════════════════════════════════
   STATIC DATA & TOKENS
════════════════════════════════════════════════════════════════════════════ */
const BLUE = '#2B4AFE';

const SERVICES = [
  { num: '01', icon: HeartPulse, title: 'Cardiology', desc: 'Comprehensive heart care with advanced diagnostic tools.' },
  { num: '02', icon: Activity, title: 'Pulmonary', desc: 'Lung and respiratory disease management.' },
  { num: '03', icon: Brain, title: 'Neurology', desc: 'Brain and nervous system disorder treatment.' },
  { num: '04', icon: Bone, title: 'Orthopedics', desc: 'Bone, joint, and muscle care, minimally invasive surgery.' },
  { num: '05', icon: FlaskConical, title: 'Laboratory', desc: 'Diagnostic laboratory services.' },
];

/* ════════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
════════════════════════════════════════════════════════════════════════════ */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const cinematicReveal = {
  hidden: { opacity: 0, scale: 1.015 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

const navSequence = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.15 } }
};

const navItem = {
  hidden: { opacity: 0, y: -12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const heroHeadingContainer = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.35 } }
};

const heroHeadingLine = {
  hidden: { opacity: 0, y: 70 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const heroImage = {
  hidden: { opacity: 0, y: 80, scale: 0.92 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.0, delay: 0.50, ease: [0.16, 1, 0.3, 1] } }
};

const rightContentSequence = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.75 } }
};

const rightContentItem = {
  hidden: { opacity: 0, x: 50 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const floatingLabelSequence = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.95 } }
};

const floatingLabel = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

const heroCta = {
  hidden: { opacity: 0, scale: 0.97, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.45, delay: 1.20, ease: "easeOut" } }
};

const statsSequence = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 1.50 } }
};

const statsItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const cardSequence = {
  hidden: { opacity: 0, x: -40, scale: 0.96 },
  show: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.6, delay: 1.35, ease: "easeOut", staggerChildren: 0.1 } }
};

const cardImage = {
  hidden: { scale: 1.08 },
  show: { scale: 1, transition: { duration: 0.8, ease: "easeOut" } }
};

const playButtonReveal = {
  hidden: { opacity: 0, scale: 0 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, type: "spring", stiffness: 200, damping: 20 } }
};

const smallElementsSequence = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 1.75 } }
};

const smallElementItem = {
  hidden: { opacity: 0, x: 15 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

/* ════════════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER COMPONENT
════════════════════════════════════════════════════════════════════════════ */
const AnimatedCounter = ({ value, duration = 2, delay = 0, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (isInView) {
      if (shouldReduceMotion) {
        setCount(value);
        return;
      }
      
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
        
        // easeOutQuart
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeProgress * value));
        
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          setCount(value);
        }
      };
      
      const timeout = setTimeout(() => {
        window.requestAnimationFrame(step);
      }, delay * 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [isInView, value, duration, delay, shouldReduceMotion]);

  return <span ref={ref}>{count}{suffix}</span>;
};

/* ════════════════════════════════════════════════════════════════════════════
   MAIN HOME COMPONENT
════════════════════════════════════════════════════════════════════════════ */
const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { data: doctors, isLoading: loadingDoctors } = usePublicDoctors();
  const { data: departments } = usePublicDepartments();
  
  const { scrollYProgress } = useScroll();
  const parallaxY1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const parallaxY2 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  
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

  return (
    <div className="min-h-screen bg-[#F4F6FF] font-inter pb-20">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-[100]"
        style={{ scaleX: scrollYProgress }}
      />
      
      {/* ══════════════════════════════════════════════════════════════════
          HERO & HEADER BLOCK (Exact Design Match)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1600px] mx-auto p-4 pt-6">
        {/* HEADER */}
        <motion.header 
          variants={navSequence}
          initial="hidden"
          animate="show"
          className="flex items-center justify-between mb-6 px-4"
        >
          {/* Logo */}
          <motion.div variants={navItem} className="flex items-center gap-3 cursor-pointer select-none" onClick={() => scrollTo('hero')}>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md">
              <HeartPulse size={20} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Aurelian Health</span>
          </motion.div>

          {/* Center Pill Nav */}
          <motion.div variants={navItem} className="hidden lg:flex items-center bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100/50 rounded-full p-2 pr-10 gap-8">
            <button className="w-[52px] h-[52px] rounded-[18px] bg-[#F8F9FB] flex items-center justify-center hover:bg-gray-100 transition-colors text-[#334155] shrink-0">
              <Menu size={24} strokeWidth={2.5} />
            </button>
            <nav className="flex items-center gap-8">
              <button onClick={() => scrollTo('about')} className="text-[16px] font-black text-[#1E293B] tracking-tight relative group">
                About us
                <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-blue-600 group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
              </button>
              <button onClick={() => scrollTo('services')} className="text-[16px] font-black text-[#64748B] hover:text-[#1E293B] transition-colors tracking-tight relative group">
                Services
                <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-blue-600 group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
              </button>
              <button onClick={() => scrollTo('doctors')} className="text-[16px] font-black text-[#64748B] hover:text-[#1E293B] transition-colors tracking-tight relative group">
                Doctors
                <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-blue-600 group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
              </button>
              <button onClick={() => scrollTo('contact')} className="text-[16px] font-black text-[#64748B] hover:text-[#1E293B] transition-colors tracking-tight relative group">
                Contact
                <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-blue-600 group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
              </button>
            </nav>
          </motion.div>

          {/* Right Actions */}
          <motion.div variants={navItem} className="flex items-center gap-6">
            <div className="hidden xl:flex items-center gap-3 text-gray-500 text-sm">
              <MapPin size={18} className="text-gray-400" />
              <div className="leading-snug text-[12px] font-medium">
                <p>Medychinyi Avenue,</p>
                <p>8-A, Lviv</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-colors shadow-md">
                <Phone size={18} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors shadow-sm">
                <Bell size={18} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/auth/login')} className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-colors shadow-md">
                <User size={18} />
              </motion.button>
            </div>
          </motion.div>
        </motion.header>

        {/* HERO CONTAINER */}
        <motion.div 
          id="hero" 
          variants={cinematicReveal}
          initial="hidden"
          animate="show"
          className="relative rounded-[40px] overflow-hidden flex flex-col lg:flex-row min-h-[650px] xl:min-h-[750px] shadow-sm"
        >
          
          {/* Left Side (White) */}
          <motion.div 
            className="lg:w-[55%] bg-white p-10 lg:p-20 relative z-10 flex flex-col justify-center"
          >
            <motion.div variants={heroHeadingContainer} initial="hidden" animate="show" className="mb-10">
              <h1 className="text-[4rem] sm:text-[5.5rem] xl:text-[7.5rem] font-medium leading-[0.85] tracking-tight text-gray-900 mb-8" style={{ fontFamily: 'var(--font-display, Inter)' }}>
                <div className="overflow-hidden"><motion.div variants={heroHeadingLine}>Innovation</motion.div></div>
                <div className="overflow-hidden"><motion.div variants={heroHeadingLine}>Clinic</motion.div></div>
              </h1>
              <div className="overflow-hidden pl-2">
                <motion.div variants={heroHeadingLine} className="max-w-[280px]">
                  <p className="text-gray-500 text-[15px] font-medium leading-relaxed">
                    <strong className="text-gray-900">We treat</strong> not only symptoms<br/>- <strong className="text-gray-900">we care</strong> about each person.
                  </p>
                </motion.div>
              </div>
            </motion.div>
            
            <motion.div 
              initial="hidden" animate="show" variants={heroCta}
            >
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => scrollTo('doctors')} 
                className="bg-[#2B4AFE] text-white px-8 py-4 rounded-full font-medium text-[15px] hover:bg-blue-700 transition-colors flex items-center gap-2 group shadow-[0_10px_30px_rgba(43,74,254,0.3)] hover:shadow-[0_15px_40px_rgba(43,74,254,0.4)]"
              >
                Find Doctor
                <div className="bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.button>
            </motion.div>

            {/* Stats Card */}
            <div className="mt-auto pt-16 flex flex-col sm:flex-row gap-8 relative z-30">
              <motion.div variants={cardSequence} initial="hidden" animate="show" className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[32px] p-6 flex flex-col sm:flex-row gap-8 items-center max-w-xl">
                <motion.div whileHover={{ y: -3 }} className="w-32 h-24 rounded-2xl overflow-hidden relative shrink-0 shadow-inner group cursor-pointer">
                  <motion.div variants={cardImage} className="w-full h-full">
                    <motion.img 
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=300&auto=format&fit=crop" 
                      className="w-full h-full object-cover" 
                      alt="Virtual tour" 
                    />
                  </motion.div>
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                    <motion.div variants={playButtonReveal} className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white border border-white/50 group-hover:scale-110 transition-transform">
                      <Play className="w-3 h-3 ml-0.5 fill-current" />
                    </motion.div>
                  </div>
                  <span className="absolute bottom-2 left-0 right-0 text-center text-white text-[10px] font-bold tracking-wide z-10 uppercase">Virtual tour</span>
                </motion.div>
                <motion.div variants={statsSequence} initial="hidden" animate="show">
                  <motion.div variants={statsItem} className="flex items-center gap-3 mb-4">
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Results we are proud of</p>
                    <div className="w-8 h-4 rounded-full bg-blue-100 flex items-center p-0.5"><div className="w-3 h-3 rounded-full bg-blue-600" /></div>
                  </motion.div>
                  <motion.div className="flex gap-6 sm:gap-8">
                    <motion.div variants={statsItem}>
                      <p className="text-3xl font-medium text-blue-600 leading-none mb-2"><AnimatedCounter value={10} delay={1.5} suffix="+" /></p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold leading-tight">years of<br/>experience</p>
                    </motion.div>
                    <motion.div variants={statsItem}>
                      <p className="text-3xl font-medium text-blue-600 leading-none mb-2"><AnimatedCounter value={20} delay={1.6} suffix="+" /></p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold leading-tight">highly qualified<br/>doctors</p>
                    </motion.div>
                    <motion.div variants={statsItem}>
                      <p className="text-3xl font-medium text-blue-600 leading-none mb-2"><AnimatedCounter value={100} delay={1.7} suffix="%" /></p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold leading-tight">digital<br/>diagnostics</p>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side (Blue) */}
          <div className="lg:w-[45%] bg-[#2B4AFE] relative p-10 lg:p-20 flex flex-col justify-center overflow-hidden">
            {/* Hexagon Pattern Overlay */}
            <motion.div 
              className="absolute inset-0 opacity-10 mix-blend-overlay" 
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'100\' viewBox=\'0 0 60 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M30 100L0 50 30 0h60L60 50 30 100z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '120px', y: parallaxY2 }} 
            />
            
            <motion.div 
              variants={rightContentSequence} initial="hidden" animate="show"
              className="relative z-10 max-w-sm lg:ml-auto mt-10 lg:mt-0"
            >
              <motion.h2 variants={rightContentItem} className="text-[2.5rem] text-white font-medium leading-tight mb-4 tracking-tight">With Advanced<br/>Technologies</motion.h2>
              <motion.p variants={rightContentItem} className="text-white/80 text-[14px] leading-relaxed font-medium mb-8 pr-4">
                The latest generation equipment, digital diagnostics, advanced techniques — all of this works for your health.
              </motion.p>
            </motion.div>

            <motion.div 
              variants={smallElementsSequence} initial="hidden" animate="show"
              className="mt-auto relative z-10 lg:text-right pt-20"
            >
              <motion.p variants={smallElementItem} className="text-white/80 text-[12px] font-medium leading-relaxed mb-4">
                We appreciate every feedback,<br/>because it inspires us to<br/>become better.
              </motion.p>
              <motion.div variants={smallElementItem} className="flex lg:justify-end items-center gap-4">
                <motion.div
                   animate={{ x: [0, 5, 0] }}
                   transition={{ duration: 2, repeat: Infinity }}
                >
                  <ArrowRight className="text-white/50 w-5 h-5" />
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="flex -space-x-3 cursor-pointer">
                   <img className="w-10 h-10 rounded-full border-2 border-[#2B4AFE] object-cover" src="https://i.pravatar.cc/100?img=1" alt="Patient" />
                   <img className="w-10 h-10 rounded-full border-2 border-[#2B4AFE] object-cover" src="https://i.pravatar.cc/100?img=2" alt="Patient" />
                   <img className="w-10 h-10 rounded-full border-2 border-[#2B4AFE] object-cover" src="https://i.pravatar.cc/100?img=3" alt="Patient" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Doctor Image Overlay */}
          <motion.div 
            style={{ y: parallaxY1 }}
            className="absolute bottom-0 left-[50%] -translate-x-[50%] w-[380px] lg:w-[450px] xl:w-[580px] h-[85%] lg:h-[90%] z-40 pointer-events-none hidden md:block"
          >
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="w-full h-full">
              <motion.img 
                variants={heroImage}
                initial="hidden"
                animate="show"
                src="/images/doctor-hero.png" 
                className="w-full h-full object-contain object-bottom drop-shadow-[0_25px_50px_rgba(0,0,0,0.3)]" 
                alt="Doctor" 
              />
            </motion.div>
          </motion.div>

        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2: STATEMENT
      ══════════════════════════════════════════════════════════════════ */}
      <section id="about" className="py-32 px-4 relative overflow-hidden bg-white mt-4 rounded-[40px] max-w-[1600px] mx-auto">
        {/* Hex pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'100\' viewBox=\'0 0 60 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M30 100L0 50 30 0h60L60 50 30 100z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '120px' }} />
        
        <motion.div 
          initial="hidden" 
          whileInView="show" 
          viewport={{ once: true, margin: "-100px" }} 
          variants={staggerContainer}
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          <motion.div variants={fadeUp} className="text-gray-400 text-[11px] font-bold tracking-[0.2em] uppercase mb-12 flex items-center justify-center gap-6">
            <span className="w-16 h-px bg-gray-200"></span>
            Aurelian Health
            <span className="w-16 h-px bg-gray-200"></span>
          </motion.div>

          <motion.h2 variants={fadeUp} className="text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] font-medium text-gray-900 leading-[1.1] mb-10 tracking-tight" style={{ fontFamily: 'var(--font-display, Inter)' }}>
            We combine innovative <span className="inline-block bg-blue-50 p-2.5 rounded-2xl align-middle shadow-sm mx-2"><Activity size={36} className="text-blue-600"/></span> technologies with a human approach to make every patient <span className="inline-flex -space-x-3 align-middle mx-3">
              <img className="w-12 h-12 rounded-full border-[3px] border-white shadow-sm object-cover" src="https://i.pravatar.cc/100?img=5" alt="Patient"/>
              <img className="w-12 h-12 rounded-full border-[3px] border-white shadow-sm object-cover" src="https://i.pravatar.cc/100?img=6" alt="Patient"/>
              <img className="w-12 h-12 rounded-full border-[3px] border-white shadow-sm object-cover" src="https://i.pravatar.cc/100?img=7" alt="Patient"/>
            </span> feel confident and calm.
          </motion.h2>

          <motion.p variants={fadeUp} className="text-gray-500 max-w-2xl mx-auto mb-14 text-[15px] font-medium leading-relaxed">
            Our hospital is a <strong className="text-gray-900">space of trust</strong>, modern medicine and care, based<br className="hidden md:block"/> on many years of experience and love for people
          </motion.p>

          <motion.button 
            variants={fadeUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-between gap-8 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-[100px] p-1.5 pr-1.5 w-fit hover:shadow-xl transition-all h-[56px]"
          >
            <span className="pl-6 font-medium text-[16px] tracking-wide">More about us</span>
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-gray-800 shadow-sm shrink-0">
              <User size={18} strokeWidth={1.5} />
            </div>
          </motion.button>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SERVICES & DOCTORS
      ══════════════════════════════════════════════════════════════════ */}
      <section id="services" className="py-24 px-4 max-w-[1600px] mx-auto">
        <motion.div 
          initial="hidden" 
          whileInView="show" 
          viewport={{ once: true, margin: "-100px" }} 
          variants={staggerContainer}
          className="px-4"
        >
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 relative">
             <div className="absolute right-0 top-0 w-64 h-64 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'100\' viewBox=\'0 0 60 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M30 100L0 50 30 0h60L60 50 30 100z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '120px' }} />

             <div className="max-w-2xl">
                <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F4F6FF] border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">
                   Our Services
                </motion.div>
                <motion.h2 variants={fadeUp} className="text-[3.5rem] lg:text-[4.5rem] font-medium leading-[1.1] tracking-tight mb-6" style={{ fontFamily: 'var(--font-display, Inter)' }}>
                   <span className="text-gray-900">Our Medical</span><br/>
                   <span className="text-blue-600">Services</span>
                </motion.h2>
                <motion.p variants={fadeUp} className="text-gray-500 font-medium text-[16px] max-w-md leading-relaxed">
                   We provide a full range of medical services —<br className="hidden md:block"/>from consultation to diagnosis and treatment.
                </motion.p>
             </div>

             <motion.div variants={fadeUp} className="mt-10 lg:mt-0 text-left lg:text-right flex flex-col items-start lg:items-end">
                <p className="text-gray-500 font-medium text-[14px] mb-4 max-w-[250px] leading-relaxed">
                   Compassionate care. Advanced technology. Better health outcomes.
                </p>
                <motion.button 
                   whileHover={{ scale: 1.02 }} 
                   className="text-blue-600 font-bold text-[15px] flex items-center gap-2 hover:text-blue-700 transition-colors group"
                >
                   View all services 
                   <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                     <ArrowRight size={18} />
                   </motion.div>
                </motion.button>
             </motion.div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {SERVICES.map((s, i) => (
               <motion.div 
                 key={i} 
                 variants={fadeUp} 
                 whileHover={{ y: -8, scale: 1.01 }}
                 transition={{ duration: 0.3 }}
                 className="relative p-6 lg:p-8 rounded-[32px] bg-white border border-gray-100 text-gray-900 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden h-[300px] flex flex-col cursor-pointer"
               >
                  
                  {/* Vertical branding text (visible by default) */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-[10px] font-bold text-gray-200 tracking-widest uppercase transition-opacity duration-500 group-hover:opacity-0 origin-center">
                     SalvaMedic
                  </div>

                  {/* Base Content (Visible by default) */}
                  <div className="relative z-0 h-full flex flex-col transition-opacity duration-500 group-hover:opacity-0">
                     {/* Number in background */}
                     <div className="absolute -top-6 -left-2 text-[100px] font-thin text-blue-100/80 leading-none tracking-tighter select-none z-0" style={{ fontFamily: 'var(--font-display, Inter)' }}>
                        {s.num}
                     </div>
                     
                     <div className="relative z-10 mt-24">
                        <div className="flex items-center gap-3 mb-5">
                           <s.icon size={28} className="text-gray-800" strokeWidth={1.5} />
                           <h3 className="text-[22px] font-extrabold text-gray-900 tracking-tight">{s.title}</h3>
                        </div>
                        <p className="text-[14px] text-gray-500 font-medium leading-relaxed pl-10 max-w-[95%]">
                           {s.desc}
                        </p>
                     </div>

                     <div className="mt-auto flex justify-between items-end relative z-10">
                        <button className="text-[14px] text-blue-600 font-bold hover:underline decoration-2 underline-offset-4">
                           Make an appointment
                        </button>
                        <button className="text-[14px] font-bold text-gray-900 border-b-2 border-gray-900 hover:border-blue-600 hover:text-blue-600 transition-colors leading-tight pb-0.5">
                           Price
                        </button>
                     </div>
                  </div>

                  {/* Hover Overlay Content */}
                  <div className="absolute inset-0 bg-[#2B4AFE] text-white opacity-0 group-hover:opacity-100 transition-all duration-500 z-20 flex flex-col justify-center p-8 translate-y-8 group-hover:translate-y-0">
                     
                     {/* Bubble graphics */}
                     <div className="absolute bottom-0 right-0 w-full h-full pointer-events-none overflow-hidden">
                        <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-blue-500 rounded-full mix-blend-screen filter blur-xl opacity-60" />
                        <div className="absolute bottom-[20%] right-[10%] w-32 h-32 bg-blue-400 rounded-full mix-blend-screen filter blur-xl opacity-50" />
                        
                        {/* Sharp bubbles to match design */}
                        <div className="absolute bottom-6 left-10 w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 border border-blue-300/30 shadow-inner" />
                        <div className="absolute bottom-16 left-20 w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-blue-300 border border-blue-200/30 shadow-inner" />
                        <div className="absolute bottom-10 right-20 w-20 h-20 rounded-full bg-gradient-to-bl from-blue-400 to-blue-600 border border-blue-300/40 shadow-inner" />
                        <div className="absolute -bottom-8 right-8 w-32 h-32 rounded-full bg-gradient-to-tl from-blue-600 to-blue-500 border border-blue-400/20 shadow-inner" />
                     </div>

                     <div className="relative z-30">
                        <h3 className="text-[32px] font-light tracking-tight mb-6" style={{ fontFamily: 'var(--font-display, Inter)' }}>SalvaMedic</h3>
                        <p className="text-[14px] text-blue-100 leading-relaxed font-medium max-w-[85%]">
                           From consultation and diagnosis to treatment with care and attention to detail.
                        </p>
                     </div>
                  </div>
               </motion.div>
            ))}

            {/* CTA Card */}
            <motion.div 
               variants={fadeUp} 
               whileHover={{ y: -8, scale: 1.01 }}
               transition={{ duration: 0.3 }}
               className="relative p-6 lg:p-8 rounded-[32px] bg-white border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col justify-center h-[300px] group"
            >
               {/* Background Cross Element */}
               <div className="absolute right-[-10%] top-[10%] opacity-40 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                  <div className="w-32 h-32 bg-[#F4F6FF] rounded-[32px] rotate-45 transform flex items-center justify-center">
                     <div className="w-24 h-24 bg-white rounded-[24px] shadow-sm" />
                  </div>
               </div>

               <div className="relative z-10 max-w-[65%] mt-auto mb-auto">
                 <h3 className="text-[20px] font-bold text-gray-900 mb-3 leading-[1.2]">Need help choosing<br/>the right service?</h3>
                 <p className="text-[12px] font-medium text-gray-500 mb-6 leading-relaxed pr-2">Our specialists are here to guide you to the best care for your health.</p>
                 <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#2B4AFE] text-white rounded-[100px] px-5 py-2.5 font-bold text-[13px] flex items-center gap-2 hover:bg-blue-700 transition-colors w-fit"
                 >
                    Contact Us <ArrowRight size={14} />
                 </motion.button>
               </div>
               
               {/* Doctor Image */}
               <div className="absolute bottom-0 right-[-5%] w-[55%] h-[90%] pointer-events-none flex items-end justify-end group-hover:scale-105 transition-transform duration-500 origin-bottom">
                  <img src="/images/doctor-hero.png" className="w-full h-auto object-contain object-bottom drop-shadow-2xl" alt="Support Doctor" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=400&h=400'; e.target.className = 'w-32 h-32 rounded-full object-cover mb-8 mr-8 shadow-xl border-4 border-white'; }} />
               </div>
            </motion.div>
          </div>

        </motion.div>
      </section>

      {/* New Why Choose Us Section */}
      <section id="why-choose-us" className="px-4 max-w-[1600px] mx-auto mb-12">
         {/* Main Top Card */}
         <div className="bg-white rounded-[40px] shadow-sm flex flex-col xl:flex-row relative overflow-hidden mb-6">
            
            {/* Left Blue Area */}
            <div className="bg-gradient-to-br from-[#2563EB] to-[#3B82F6] w-full xl:w-[45%] p-10 lg:p-16 text-white relative z-0">
               {/* Background grid pattern */}
               <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
               
               <div className="relative z-10 max-w-sm">
                  <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-4xl lg:text-6xl font-bold mb-4 leading-tight tracking-tight">Why<br/>Choose Us</motion.h2>
                  <motion.p initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-blue-100 text-[15px] mb-10 leading-relaxed font-medium">Your health is our priority. Experience world-class care with compassion and trust.</motion.p>
                  
                  <div className="space-y-8">
                     <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="flex gap-4 items-start">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                           <Users size={22} className="text-white" />
                        </div>
                        <div>
                           <h4 className="font-bold text-[16px] mb-1">Experienced Doctors</h4>
                           <p className="text-blue-100 text-[13px] leading-relaxed">Highly qualified specialists<br/>with years of experience.</p>
                        </div>
                     </motion.div>
                     
                     <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="flex gap-4 items-start">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                           <Monitor size={22} className="text-white" />
                        </div>
                        <div>
                           <h4 className="font-bold text-[16px] mb-1">Modern Equipment</h4>
                           <p className="text-blue-100 text-[13px] leading-relaxed">State-of-the-art technology<br/>for accurate diagnostics.</p>
                        </div>
                     </motion.div>
                     
                     <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="flex gap-4 items-start">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                           <Heart size={22} className="text-white" />
                        </div>
                        <div>
                           <h4 className="font-bold text-[16px] mb-1">Human Care</h4>
                           <p className="text-blue-100 text-[13px] leading-relaxed">Personalized care with<br/>compassion and respect.</p>
                        </div>
                     </motion.div>
                  </div>
               </div>
            </div>

            {/* Floating Doctors Image */}
            <motion.div 
               animate={{ y: [0, -15, 0] }}
               transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
               className="hidden xl:block absolute bottom-0 left-[25%] w-[450px] z-10 pointer-events-none"
            >
               <img src="https://pngimg.com/uploads/doctor/doctor_PNG15988.png" alt="Doctors" className="w-full h-auto drop-shadow-2xl object-bottom object-contain" />
            </motion.div>

            {/* Right Stats Area */}
            <div className="w-full xl:w-[55%] bg-[#F8FAFC] p-10 lg:p-16 flex flex-col justify-center relative z-0 pl-10 xl:pl-56">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
                  <span className="text-gray-400 text-[13px] font-bold uppercase tracking-wider">{`{ Our Advantages }`}</span>
                  <span className="bg-blue-100 text-blue-600 text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">Looks Like: Modern Medicine</span>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 relative z-10">
                  {/* 10+ Years of Experience */}
                  <motion.div 
                     initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} 
                     whileHover={{ y: -5, scale: 1.02 }}
                     transition={{ duration: 0.3 }}
                     className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-xl relative overflow-hidden group cursor-pointer"
                  >
                     <div className="absolute top-6 right-6 grid grid-cols-3 gap-1.5 opacity-20">
                        {[...Array(9)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-300"></div>)}
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-5 mb-8">
                           <div className="w-[64px] h-[64px] rounded-full bg-[#F4F6FF] flex items-center justify-center shrink-0">
                              <Calendar size={32} className="text-blue-600" strokeWidth={1.5} />
                           </div>
                           <div className="flex flex-col items-start mt-2">
                              <span className="text-[44px] font-black text-blue-600 tracking-tight leading-none mb-1">10+</span>
                              <div className="flex items-center gap-1.5">
                                 <div className="h-[3px] w-8 bg-blue-600 rounded-full"></div>
                                 <div className="h-[3px] w-[4px] bg-blue-600 rounded-full"></div>
                              </div>
                           </div>
                        </div>
                        <h4 className="font-bold text-gray-900 text-[18px] mb-3 tracking-tight">Years of Experience</h4>
                        <p className="text-gray-500 text-[14px] leading-relaxed font-medium">We have been working since 2012, improving the quality of services every day.</p>
                     </div>
                  </motion.div>
                  
                  {/* 15+ Areas of Medicine */}
                  <motion.div 
                     initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} 
                     whileHover={{ y: -5, scale: 1.02 }}
                     transition={{ duration: 0.3 }}
                     className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-xl relative overflow-hidden group cursor-pointer"
                  >
                     <div className="absolute top-6 right-6 w-16 h-16 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')]"></div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-5 mb-8">
                           <div className="w-[64px] h-[64px] rounded-full bg-[#F4F6FF] flex items-center justify-center shrink-0">
                              <Activity size={32} className="text-blue-600" strokeWidth={1.5} />
                           </div>
                           <div className="flex flex-col items-start mt-2">
                              <span className="text-[44px] font-black text-blue-600 tracking-tight leading-none mb-1">15+</span>
                              <div className="flex items-center gap-1.5">
                                 <div className="h-[3px] w-8 bg-blue-600 rounded-full"></div>
                                 <div className="h-[3px] w-[4px] bg-blue-600 rounded-full"></div>
                              </div>
                           </div>
                        </div>
                        <h4 className="font-bold text-gray-900 text-[18px] mb-3 tracking-tight">Areas of Medicine</h4>
                        <p className="text-gray-500 text-[14px] leading-relaxed font-medium">From family medicine to cardiology and laboratory diagnostics.</p>
                     </div>
                  </motion.div>
                  
                  {/* 95% Satisfied Patients */}
                  <motion.div 
                     initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} 
                     whileHover={{ y: -5, scale: 1.02 }}
                     transition={{ duration: 0.3 }}
                     className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-xl relative overflow-hidden group cursor-pointer"
                  >
                     <div className="absolute top-6 right-6 grid grid-cols-3 gap-1.5 opacity-20">
                        {[...Array(5)].map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full bg-blue-300 ${i === 1 || i === 3 ? 'invisible' : ''}`}></div>)}
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-5 mb-8">
                           <div className="w-[64px] h-[64px] rounded-full bg-[#F4F6FF] flex items-center justify-center shrink-0">
                              <ThumbsUp size={32} className="text-blue-600" strokeWidth={1.5} />
                           </div>
                           <div className="flex flex-col items-start mt-2">
                              <span className="text-[44px] font-black text-blue-600 tracking-tight leading-none mb-1">95%</span>
                              <div className="flex items-center gap-1.5">
                                 <div className="h-[3px] w-8 bg-blue-600 rounded-full"></div>
                                 <div className="h-[3px] w-[4px] bg-blue-600 rounded-full"></div>
                              </div>
                           </div>
                        </div>
                        <h4 className="font-bold text-gray-900 text-[18px] mb-3 tracking-tight">Satisfied Patients</h4>
                        <p className="text-gray-500 text-[14px] leading-relaxed font-medium">According to internal surveys over the past year.</p>
                     </div>
                  </motion.div>
                  
                  {/* 98% Diagnostic Accuracy */}
                  <motion.div 
                     initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} 
                     whileHover={{ y: -5, scale: 1.02 }}
                     transition={{ duration: 0.3 }}
                     className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-xl relative overflow-hidden group cursor-pointer"
                  >
                     <div className="absolute top-6 right-6 grid grid-cols-3 gap-1.5 opacity-20">
                        {[...Array(9)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-300"></div>)}
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-5 mb-8">
                           <div className="w-[64px] h-[64px] rounded-full bg-[#F4F6FF] flex items-center justify-center shrink-0">
                              <Target size={32} className="text-blue-600" strokeWidth={1.5} />
                           </div>
                           <div className="flex flex-col items-start mt-2">
                              <span className="text-[44px] font-black text-blue-600 tracking-tight leading-none mb-1">98%</span>
                              <div className="flex items-center gap-1.5">
                                 <div className="h-[3px] w-8 bg-blue-600 rounded-full"></div>
                                 <div className="h-[3px] w-[4px] bg-blue-600 rounded-full"></div>
                              </div>
                           </div>
                        </div>
                        <h4 className="font-bold text-gray-900 text-[18px] mb-3 tracking-tight">Diagnostic Accuracy</h4>
                        <p className="text-gray-500 text-[14px] leading-relaxed font-medium">Thanks to modern equipment and experienced specialists.</p>
                     </div>
                  </motion.div>
               </div>
               
               <p className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mt-auto"><span className="text-blue-600">IN FACT:</span> Professional help you can trust.</p>
            </div>
         </div>

         {/* Bottom Banner */}
         <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="bg-white rounded-[40px] shadow-sm p-8 lg:p-12 xl:p-16 flex flex-col lg:flex-row items-center justify-center relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-64 h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')]"></div>

            {/* Left/Middle Content */}
            <div className="relative z-10 w-full flex flex-col items-center xl:pr-32">
               <h2 className="text-3xl lg:text-4xl xl:text-5xl font-medium text-gray-900 text-center mb-10 max-w-4xl leading-[1.2] tracking-tight">
                  Medicine <span className="text-blue-600 font-bold">starts with</span> science —<br className="hidden md:block" />
                  but true healing <span className="text-blue-600 font-bold">begins with</span> trust
               </h2>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
                  <span className="text-gray-400 font-bold text-[13px] tracking-widest uppercase">Aurelian Health</span>
                  <div className="hidden sm:block h-[1px] w-16 bg-gray-200"></div>
                  <button onClick={() => navigate('/appointment')} className="bg-blue-600 text-white rounded-full pl-8 pr-2 py-2 flex items-center gap-6 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                     <span className="font-bold text-[15px]">Make an Appointment</span>
                     <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shrink-0">
                        <User size={18} strokeWidth={2.5} />
                     </div>
                  </button>
               </div>
            </div>

            {/* Floating small doctor card on the right */}
            <motion.div 
               animate={{ y: ["-50%", "-60%", "-50%"] }} 
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
               className="hidden xl:flex absolute right-16 top-1/2 bg-[#E6EFFF] rounded-[32px] w-56 h-56 items-end justify-center overflow-hidden border-[6px] border-white shadow-xl"
            >
               <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300" className="w-[110%] h-auto object-cover object-top -mb-2" alt="Doctor" />
            </motion.div>
         </motion.div>
      </section>

      {/* Our Doctors Section */}
      <section className="py-24 px-4 bg-[#F8FAFC] max-w-[1600px] mx-auto mb-12 rounded-[40px]">
         <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
            {/* Left Content */}
            <div className="w-full lg:w-[35%] flex flex-col justify-center px-4 lg:pl-12">
               <div className="flex items-center gap-4 mb-6">
                  <h4 className="text-[13px] font-bold text-blue-600 uppercase tracking-widest">Our Doctors</h4>
                  <div className="w-12 h-[2px] bg-blue-600"></div>
               </div>
               
               <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-8 leading-[1.1] tracking-tight">
                  Meet the people<br/>who <span className="text-blue-600">care</span>
               </motion.h2>

               <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-[2px] bg-blue-600"></div>
                  <span className="text-gray-500 font-medium">Our doctors</span>
               </div>
               
               <motion.p initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-[15px] text-gray-500 font-medium leading-relaxed mb-12 max-w-md">
                  Our team brings together expertise, empathy, and a deep passion for helping others.
               </motion.p>
               
               <motion.button initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} onClick={() => navigate('/doctors')} className="bg-blue-600 text-white rounded-xl px-8 py-4 text-[15px] font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-colors w-fit mb-16 shadow-lg shadow-blue-600/20">
                  View All Doctors <ArrowRight size={18} />
               </motion.button>
               
               <div className="flex items-center gap-4">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm hover:shadow-md transition-shadow">
                     <ArrowLeft size={20} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md hover:bg-blue-700 transition-colors">
                     <ArrowRight size={20} />
                  </motion.button>
               </div>
            </div>

            {/* Right Doctors Carousel/Grid */}
            <div className="w-full lg:w-[65%] grid grid-cols-1 md:grid-cols-3 gap-6 pr-4 lg:pr-12">
               
               {/* Doctor Card 1 (Active/Highlighted) */}
               <motion.div 
                  initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} 
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-gradient-to-b from-[#2563EB] to-[#3B82F6] rounded-[32px] overflow-hidden group h-[500px]"
               >
                  {/* Floating Pill */}
                  <div className="absolute top-6 right-6 bg-white rounded-2xl px-4 py-2 flex flex-col items-center shadow-lg z-20">
                     <div className="flex items-center gap-1 text-blue-600 mb-1">
                        <User size={16} strokeWidth={2.5} />
                        <span className="font-extrabold text-[15px] leading-none">+</span>
                     </div>
                     <span className="font-extrabold text-gray-900 text-[15px] leading-none mb-0.5">15+</span>
                     <span className="text-[10px] text-gray-500 font-medium leading-none text-center">Years of<br/>practice</span>
                  </div>
                  
                  {/* Background Decoration */}
                  <div className="absolute top-10 left-6 grid grid-cols-3 gap-2 opacity-20">
                     {[...Array(9)].map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-white"></div>
                     ))}
                  </div>
                  
                  {/* Doctor Image */}
                  <img src="/images/doctor-hero.png" alt="Dr. Oleh Marchenko" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-auto min-w-[120%] h-[95%] max-w-none object-bottom object-contain z-10 group-hover:scale-[1.03] transition-transform duration-500" />
                  
                  {/* Bottom Info Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white rounded-2xl p-6 z-20 shadow-xl">
                     <h4 className="text-xl font-bold text-gray-900 mb-1">Dr. Oleh Marchenko</h4>
                     <p className="text-sm font-bold text-blue-600 mb-3">Cardiologist</p>
                     <div className="flex items-end justify-between">
                        <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[70%]">Personalized treatment and diagnostics</p>
                        <button className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
                           <Play size={16} className="ml-1" fill="currentColor" />
                        </button>
                     </div>
                  </div>
               </motion.div>

               {/* Doctor Card 2 */}
               <motion.div 
                  initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} 
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-white rounded-[32px] overflow-hidden group h-[500px] shadow-sm hover:shadow-xl transition-shadow"
               >
                  <div className="absolute inset-0 bg-white"></div>
                  <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400" alt="Dr. Anna Kovalenko" className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full h-[85%] object-cover object-top z-10 mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                  
                  {/* Bottom Info Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white rounded-2xl p-6 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-50">
                     <h4 className="text-xl font-bold text-gray-900 mb-1">Dr. Anna Kovalenko</h4>
                     <p className="text-sm font-bold text-blue-600 mb-3">Neurologist</p>
                     <div className="flex items-end justify-between">
                        <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[70%]">Brain and nervous system health specialist</p>
                        <button className="w-10 h-10 rounded-full bg-[#F4F6FF] flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors shrink-0">
                           <ArrowRight size={18} />
                        </button>
                     </div>
                  </div>
               </motion.div>

               {/* Doctor Card 3 */}
               <motion.div 
                  initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} 
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-white rounded-[32px] overflow-hidden group h-[500px] shadow-sm hover:shadow-xl transition-shadow"
               >
                  <div className="absolute inset-0 bg-white"></div>
                  <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400" alt="Dr. Andrii Melnyk" className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full h-[85%] object-cover object-top z-10 mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                  
                  {/* Bottom Info Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white rounded-2xl p-6 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-50">
                     <h4 className="text-xl font-bold text-gray-900 mb-1">Dr. Andrii Melnyk</h4>
                     <p className="text-sm font-bold text-blue-600 mb-3">Orthopedic Surgeon</p>
                     <div className="flex items-end justify-between">
                        <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[70%]">Joint, bone and muscle care expert</p>
                        <button className="w-10 h-10 rounded-full bg-[#F4F6FF] flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors shrink-0">
                           <ArrowRight size={18} />
                        </button>
                     </div>
                  </div>
               </motion.div>

            </div>
         </div>

         {/* Bottom Trust Indicators */}
         <div className="mt-20 border-t border-gray-200 pt-10 flex flex-wrap lg:flex-nowrap justify-between gap-8 px-4 lg:px-12">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 shrink-0">
                  <CheckCircle2 size={24} strokeWidth={1.5} />
               </div>
               <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">Certified</p>
                  <p className="text-sm font-medium text-gray-500 leading-tight">and Experienced</p>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 shrink-0">
                  <Users size={24} strokeWidth={1.5} />
               </div>
               <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">Patient</p>
                  <p className="text-sm font-medium text-gray-500 leading-tight">Focused Care</p>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 shrink-0">
                  <ShieldCheck size={24} strokeWidth={1.5} />
               </div>
               <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">Trusted by</p>
                  <p className="text-sm font-medium text-gray-500 leading-tight">Thousands</p>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 shrink-0">
                  <Star size={24} strokeWidth={1.5} />
               </div>
               <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">Excellence in</p>
                  <p className="text-sm font-medium text-gray-500 leading-tight">Healthcare</p>
               </div>
            </div>
         </div>
      </section>

      {/* Video Tour & Testimonials Section */}
      <section className="mt-20 max-w-[1600px] mx-auto pb-12">
         {/* Video Tour Background & Box */}
         <motion.div 
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}
            className="relative w-full h-[600px] rounded-[40px] overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000')" }}
         >
            {/* White gradient overlay on the left to make text readable */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent w-full md:w-[70%] z-10"></div>
            
            {/* Top Center Logo */}
            <div className="absolute top-10 left-0 w-full flex justify-center z-20">
               <div className="flex items-center gap-2">
                  <div className="text-blue-600 border-[2.5px] border-blue-600 rounded p-0.5"><Plus size={16} strokeWidth={3} /></div>
                  <span className="text-blue-600 font-bold text-[13px] tracking-widest uppercase">Aurelian Health</span>
               </div>
            </div>

            {/* Left Content Area */}
            <div className="absolute top-0 bottom-0 left-0 w-full md:w-1/2 flex flex-col justify-center px-8 md:pl-20 xl:pl-32 z-20">
               <h2 className="text-gray-900 text-6xl md:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
                  Take a look<br/>
                  <span className="text-blue-600">inside</span>
               </h2>
               <p className="text-gray-600 text-[17px] max-w-sm mb-10 leading-relaxed font-medium">
                  Personalized treatment and accurate diagnostics for better care.
               </p>
               
               <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  className="bg-blue-600 text-white rounded-xl pl-2 pr-6 py-2 flex items-center gap-4 hover:bg-blue-700 transition-colors w-fit mb-12 shadow-[0_8px_20px_rgba(37,99,235,0.25)]"
               >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shrink-0">
                     <Play size={18} fill="currentColor" className="ml-1" />
                  </div>
                  <span className="font-bold text-[15px]">Watch Video Tour</span>
               </motion.button>
               
               {/* Trusted By avatars */}
               <div className="flex items-center gap-5">
                  <div className="flex -space-x-3">
                     <img className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" alt="Patient 1" />
                     <img className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Patient 2" />
                     <img className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" alt="Patient 3" />
                  </div>
                  <p className="text-[15px] text-gray-900 font-medium">
                     Trusted by <span className="text-blue-600 font-bold">15,000+</span> patients
                  </p>
               </div>
            </div>
         </motion.div>

         {/* Features Banner */}
         <motion.div 
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}
            className="relative z-20 max-w-5xl mx-auto -mt-16 bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 md:p-10"
         >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:divide-x divide-gray-100">
               {/* Feature 1 */}
               <motion.div whileHover={{ y: -5 }} className="flex items-center gap-5 px-2 cursor-pointer group">
                  <div className="w-[52px] h-[52px] rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                     <UserCheck size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                     <h5 className="text-gray-900 font-bold text-[15px] mb-0.5 group-hover:text-blue-600 transition-colors duration-300">Expert Doctors</h5>
                     <p className="text-gray-500 text-[13px] leading-tight">Experienced specialists<br/>you can trust</p>
                  </div>
               </motion.div>
               
               {/* Feature 2 */}
               <motion.div whileHover={{ y: -5 }} className="flex items-center gap-5 md:px-6 cursor-pointer group">
                  <div className="w-[52px] h-[52px] rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                     <HeartPulse size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                     <h5 className="text-gray-900 font-bold text-[15px] mb-0.5 group-hover:text-blue-600 transition-colors duration-300">Advanced Care</h5>
                     <p className="text-gray-500 text-[13px] leading-tight">State-of-the-art technology<br/>for accurate diagnosis</p>
                  </div>
               </motion.div>
               
               {/* Feature 3 */}
               <motion.div whileHover={{ y: -5 }} className="flex items-center gap-5 md:px-6 cursor-pointer group">
                  <div className="w-[52px] h-[52px] rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                     <ShieldCheck size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                     <h5 className="text-gray-900 font-bold text-[15px] mb-0.5 group-hover:text-blue-600 transition-colors duration-300">Safe & Secure</h5>
                     <p className="text-gray-500 text-[13px] leading-tight">Your health and data<br/>are always protected</p>
                  </div>
               </motion.div>
               
               {/* Feature 4 */}
               <motion.div whileHover={{ y: -5 }} className="flex items-center gap-5 md:px-6 cursor-pointer group">
                  <div className="w-[52px] h-[52px] rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                     <Clock size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                     <h5 className="text-gray-900 font-bold text-[15px] mb-0.5 group-hover:text-blue-600 transition-colors duration-300">Fast & Easy</h5>
                     <p className="text-gray-500 text-[13px] leading-tight">Quick appointments<br/>and minimal wait time</p>
                  </div>
               </motion.div>
            </div>
         </motion.div>

         {/* Testimonials */}
         <div className="mt-24 px-4 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24 max-w-7xl mx-auto">
            {/* Left Content */}
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="w-full lg:w-[35%] flex flex-col">
               <span className="text-blue-600 font-bold text-[13px] tracking-widest uppercase mb-6">TESTIMONIALS</span>
               <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-[1.1] tracking-tight">
                  What our<br/><span className="text-blue-600">patients</span> say
               </h2>
               <p className="text-[17px] text-gray-500 font-medium leading-relaxed mb-12 max-w-md">
                  Real stories from real patients who trust Aurelian Health.
               </p>
               
               <div className="flex items-center gap-6">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-14 h-14 rounded-full border-2 border-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors">
                     <ArrowLeft size={24} strokeWidth={1.5} />
                  </motion.button>
                  <div className="flex items-center gap-3">
                     <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-14 h-14 rounded-full border-2 border-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors">
                     <ArrowRight size={24} strokeWidth={1.5} />
                  </motion.button>
               </div>
            </motion.div>
            
            {/* Right Card */}
            <motion.div 
               initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}
               whileHover={{ y: -8 }} transition={{ duration: 0.3 }} 
               className="w-full lg:w-[65%] bg-white rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.06)] hover:shadow-xl transition-shadow border border-gray-50 p-8 md:p-12"
            >
               {/* Card Header */}
               <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-5">
                     <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150" alt="Anna" className="w-16 h-16 rounded-full object-cover shadow-sm" />
                     <div>
                        <h4 className="font-bold text-gray-900 text-[19px] mb-1">Anna</h4>
                        <div className="flex gap-1 text-yellow-400">
                           <Star size={18} fill="currentColor" className="text-yellow-400" />
                           <Star size={18} fill="currentColor" className="text-yellow-400" />
                           <Star size={18} fill="currentColor" className="text-yellow-400" />
                           <Star size={18} fill="currentColor" className="text-yellow-400" />
                           <Star size={18} fill="currentColor" className="text-yellow-400" />
                        </div>
                     </div>
                  </div>
                  <span className="text-gray-500 font-medium text-[15px]">20.04.2025</span>
               </div>
               
               {/* Card Body */}
               <div className="flex flex-col md:flex-row gap-10 mb-10 items-center">
                  <div className="w-full md:w-[45%] h-[220px] rounded-2xl overflow-hidden shadow-sm shrink-0">
                     <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600" alt="Doctor interaction" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-full md:w-[55%] pt-2">
                     <Quote size={40} className="text-blue-600 mb-6 opacity-80" fill="currentColor" strokeWidth={1} />
                     <p className="text-gray-700 text-[18px] leading-relaxed font-medium">
                        I felt calm and cared for from the first step inside. The doctor took time to explain everything clearly — I've never felt more confident in a diagnosis.
                     </p>
                  </div>
               </div>
               
               {/* Card Footer */}
               <div className="flex items-center justify-between border-t border-gray-100 pt-8 mt-2">
                  <span className="text-gray-400 font-bold text-[13px] tracking-widest uppercase">Aurelian Health</span>
                  <div className="flex-1 h-[1px] bg-gray-100 mx-8"></div>
                  <div className="flex items-center gap-3">
                     <span className="text-gray-500 text-[15px] font-medium">Verified Patient</span>
                     <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <BadgeCheck size={14} strokeWidth={3} />
                     </div>
                  </div>
               </div>
            </motion.div>
         </div>
      </section>

      {/* Appointment & FAQ Section */}
      <section className="mt-20 max-w-[1600px] mx-auto pb-12 px-4 lg:px-8">
         <div className="bg-[#F8FAFC] rounded-[40px] p-8 md:p-12 lg:p-16">
            
            {/* Top Area: Appointment Form & Doctor Image */}
            <motion.div 
               initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}
               className="flex flex-col lg:flex-row gap-0 bg-white rounded-[32px] overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.04)] mb-16"
            >
               {/* Left: Form Area */}
               <div className="w-full lg:w-[55%] p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-10">
                     <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                        <HeartPulse size={18} strokeWidth={2.5} />
                     </div>
                     <span className="font-bold text-gray-900 text-[17px] tracking-tight">Aurelian Health</span>
                  </div>
                  
                  <div className="w-10 h-1 bg-blue-600 mb-6 rounded-full"></div>
                  <h2 className="text-5xl lg:text-[56px] font-bold text-gray-900 mb-5 leading-[1.1] tracking-tight">
                     Are you ready to<br/>make an <span className="text-blue-600">appointment?</span>
                  </h2>
                  <p className="text-gray-500 text-[16px] leading-relaxed mb-10 max-w-md">
                     Book your visit in just a few clicks and get the best care from our trusted specialists.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                     <div className="flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-4 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                        <User size={18} className="text-blue-400 shrink-0" />
                        <input type="text" placeholder="Name" className="bg-transparent border-none outline-none w-full text-[15px] placeholder:text-gray-400 text-gray-900 font-medium" />
                     </div>
                     <div className="flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-4 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                        <Phone size={18} className="text-blue-400 shrink-0" />
                        <input type="text" placeholder="Phone number" className="bg-transparent border-none outline-none w-full text-[15px] placeholder:text-gray-400 text-gray-900 font-medium" />
                     </div>
                     <div className="flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-4 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                        <Calendar size={18} className="text-blue-400 shrink-0" />
                        <input type="text" placeholder="Preferred date/time" className="bg-transparent border-none outline-none w-full text-[15px] placeholder:text-gray-400 text-gray-900 font-medium" />
                     </div>
                     <div className="flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-4 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                        <MessageSquare size={18} className="text-blue-400 shrink-0" />
                        <input type="text" placeholder="Message (optional)" className="bg-transparent border-none outline-none w-full text-[15px] placeholder:text-gray-400 text-gray-900 font-medium" />
                     </div>
                     <div className="flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-4 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all md:col-span-2">
                        <Stethoscope size={18} className="text-blue-400 shrink-0" />
                        <select className="bg-transparent border-none outline-none w-full text-[15px] text-gray-400 font-medium appearance-none cursor-pointer">
                           <option value="">Service needed</option>
                           <option value="consultation">General Consultation</option>
                           <option value="cardiology">Cardiology</option>
                           <option value="neurology">Neurology</option>
                        </select>
                        <ChevronDown size={18} className="text-blue-400 shrink-0 ml-auto pointer-events-none" />
                     </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                     <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-4 font-bold text-[15px] flex items-center justify-center gap-3 transition-colors shadow-[0_8px_20px_rgba(37,99,235,0.25)]">
                        Book an appointment
                        <ArrowRight size={18} strokeWidth={2.5} />
                     </motion.button>
                     <div className="flex items-center gap-2 text-gray-500 text-[13px] font-medium">
                        <ShieldCheck size={16} className="text-blue-400" />
                        Your information is safe with us
                     </div>
                  </div>
               </div>
               
               {/* Right: Doctor Image & Badges */}
               <div className="w-full lg:w-[45%] relative bg-blue-50 overflow-hidden min-h-[600px] flex items-end justify-center pt-10">
                  {/* Large Decorative Blue Circle */}
                  <div className="absolute top-[-10%] right-[-15%] w-[120%] aspect-square bg-blue-600 rounded-full opacity-90 blur-sm"></div>
                  
                  {/* Doctor Image */}
                  <motion.img 
                     animate={{ y: [0, -10, 0] }}
                     transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                     src="https://pngimg.com/uploads/doctor/doctor_PNG15988.png" 
                     alt="Doctor" 
                     className="relative z-10 w-[95%] object-contain" 
                  />
                  
                  {/* Floating Badges (Z-20) */}
                  <div className="absolute top-8 right-8 bg-white rounded-[20px] p-3 pr-6 shadow-xl z-20 flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-blue-600">
                        <Clock size={18} />
                     </div>
                     <div>
                        <p className="text-gray-500 text-[11px] font-medium leading-tight">It only takes</p>
                        <p className="text-blue-600 font-bold text-[13px] leading-tight">1 minute <span className="text-gray-900 font-medium">to book</span></p>
                     </div>
                  </div>
                  
                  <div className="absolute top-1/3 right-4 sm:right-[-10px] md:right-8 flex flex-col gap-4 z-20 scale-90 sm:scale-100 origin-right">
                     <div className="bg-white/95 backdrop-blur-sm rounded-[20px] p-3 pr-8 shadow-xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                           <Users size={20} />
                        </div>
                        <div>
                           <p className="text-gray-900 font-bold text-[14px] leading-tight mb-0.5">Experienced<br/>Doctors</p>
                           <p className="text-gray-500 text-[10px] leading-tight">Skilled & certified<br/>professionals</p>
                        </div>
                     </div>
                     
                     <div className="bg-white/95 backdrop-blur-sm rounded-[20px] p-3 pr-8 shadow-xl flex items-center gap-4 ml-6">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                           <ShieldCheck size={20} />
                        </div>
                        <div>
                           <p className="text-gray-900 font-bold text-[14px] leading-tight mb-0.5">Certified Clinic</p>
                           <p className="text-gray-500 text-[10px] leading-tight">Trusted by thousands<br/>of patients</p>
                        </div>
                     </div>
                     
                     <div className="bg-white/95 backdrop-blur-sm rounded-[20px] p-3 pr-8 shadow-xl flex items-center gap-4 ml-2">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                           <Monitor size={20} />
                        </div>
                        <div>
                           <p className="text-gray-900 font-bold text-[14px] leading-tight mb-0.5">Modern Equipment</p>
                           <p className="text-gray-500 text-[10px] leading-tight">Advanced technology<br/>for accurate care</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="absolute bottom-10 right-10 bg-[#1e40af] backdrop-blur-md rounded-[20px] p-4 shadow-2xl z-20 flex items-center gap-5">
                     <div className="flex -space-x-2">
                        <img className="w-9 h-9 rounded-full border-2 border-[#1e40af] object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" alt="Patient 1" />
                        <img className="w-9 h-9 rounded-full border-2 border-[#1e40af] object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Patient 2" />
                        <img className="w-9 h-9 rounded-full border-2 border-[#1e40af] object-cover" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" alt="Patient 3" />
                     </div>
                     <div>
                        <p className="text-blue-200 text-[11px] font-medium leading-tight mb-0.5">Trusted by</p>
                        <p className="text-white font-bold text-[16px] leading-tight tracking-tight">15,000+ <span className="font-normal text-[12px] opacity-80 tracking-normal">patients</span></p>
                     </div>
                  </div>
               </div>
            </motion.div>
            
            {/* Bottom Area: FAQ */}
            <div className="flex flex-col xl:flex-row gap-6 items-stretch pb-4">
               {/* Left: FAQ Header */}
               <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="w-full xl:w-[28%] flex flex-col justify-center xl:pr-6">
                  <span className="text-blue-600 font-bold text-[11px] tracking-widest uppercase mb-4">SUPPORT</span>
                  <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-5 leading-[1.1] tracking-tight">
                     Questions<br/>and answers
                  </h3>
                  <p className="text-gray-500 text-[15px] leading-relaxed mb-8 max-w-sm">
                     Find answers to common questions about your visit and our services.
                  </p>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="border-2 border-gray-200 hover:border-blue-600 text-gray-700 hover:text-blue-600 rounded-2xl px-6 py-3 font-bold text-[14px] flex items-center justify-center gap-3 transition-colors w-fit shadow-sm">
                     <Headphones size={18} />
                     Contact us
                  </motion.button>
               </motion.div>
               
               {/* Right: FAQ Cards */}
               <div className="w-full xl:w-[72%] grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1 */}
                  <motion.div whileHover={{ y: -5, scale: 1.02 }} className="bg-white rounded-[28px] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-50 flex flex-col transition-all duration-300 cursor-pointer group hover:shadow-xl">
                     <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-6 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <MessageCircle size={22} strokeWidth={1.5} />
                     </div>
                     <h4 className="font-bold text-gray-900 text-[18px] mb-4 leading-snug">What should I bring<br/>to my first visit?</h4>
                     <p className="text-gray-500 text-[14px] leading-relaxed mb-6 flex-1">
                        Please bring an ID, any relevant medical records, and your insurance information if applicable.
                     </p>
                     <div className="flex justify-end mt-auto text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight size={20} />
                     </div>
                  </motion.div>
                  
                  {/* Card 2 */}
                  <motion.div whileHover={{ y: -5, scale: 1.02 }} className="bg-white rounded-[28px] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-50 flex flex-col transition-all duration-300 cursor-pointer group hover:shadow-xl">
                     <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-6 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <Clock size={22} strokeWidth={1.5} />
                     </div>
                     <h4 className="font-bold text-gray-900 text-[18px] mb-4 leading-snug">How early should<br/>I arrive?</h4>
                     <p className="text-gray-500 text-[14px] leading-relaxed mb-6 flex-1">
                        We recommend arriving 15 minutes early to complete any necessary paperwork.
                     </p>
                     <div className="flex justify-end mt-auto text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight size={20} />
                     </div>
                  </motion.div>
                  
                  {/* Card 3 */}
                  <motion.div whileHover={{ y: -5, scale: 1.02 }} className="bg-white rounded-[28px] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-50 flex flex-col transition-all duration-300 cursor-pointer group hover:shadow-xl">
                     <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-6 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <ShieldCheck size={22} strokeWidth={1.5} />
                     </div>
                     <h4 className="font-bold text-gray-900 text-[18px] mb-4 leading-snug">Is my information<br/>secure?</h4>
                     <p className="text-gray-500 text-[14px] leading-relaxed mb-6 flex-1">
                        Yes, we follow strict privacy standards to keep your data safe and confidential.
                     </p>
                     <div className="flex justify-end mt-auto text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight size={20} />
                     </div>
                  </motion.div>
               </div>
            </div>
            
            {/* Footer tiny text inside container */}
            <div className="mt-16 flex flex-col items-center justify-center text-blue-300">
               <HeartPulse size={20} strokeWidth={2} className="mb-3 opacity-60" />
               <div className="flex items-center gap-4 w-full max-w-lg">
                  <div className="h-[1px] bg-gray-200 flex-1"></div>
                  <span className="text-[12px] font-medium text-gray-400">We're here to help you every step of the way.</span>
                  <div className="h-[1px] bg-gray-200 flex-1"></div>
               </div>
            </div>
         </div>
      </section>

      {/* FOOTER */}
      <motion.footer initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} id="contact" className="bg-[#0A0A0A] text-white pt-16 pb-8 px-8 md:px-16 mt-20">
         <div className="max-w-[1600px] mx-auto">
            {/* Top: Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
               <div className="flex items-start gap-4">
                  <PhoneCall size={24} className="text-gray-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                     <p className="text-sm text-gray-400 mb-1">Tel</p>
                     <p className="text-[15px] font-medium">310-437-2766</p>
                  </div>
               </div>
               
               <div className="flex items-start gap-4">
                  <Mail size={24} className="text-gray-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                     <p className="text-sm text-gray-400 mb-1">Mail</p>
                     <p className="text-[15px] font-medium">clinic@outlook.com</p>
                  </div>
               </div>
               
               <div className="flex items-start gap-4">
                  <MapPin size={24} className="text-gray-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                     <p className="text-sm text-gray-400 mb-1">Address</p>
                     <p className="text-[15px] font-medium leading-snug">Medcyhnyi Avenue,<br/>8-A, Lviv</p>
                  </div>
               </div>
               
               <div className="flex items-start gap-4">
                  <Printer size={24} className="text-gray-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                     <p className="text-sm text-gray-400 mb-1">Fax</p>
                     <p className="text-[15px] font-medium">+1-000-0000</p>
                  </div>
               </div>
            </div>
            
            {/* Divider */}
            <div className="h-[1px] w-full bg-gray-800 mb-12"></div>
            
            {/* Middle: Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
               <div className="hidden lg:block"></div>
               <div className="hidden lg:block"></div>
               
               <div>
                  <h4 className="text-lg font-medium mb-6">Support</h4>
                  <ul className="space-y-4 text-[14px] text-gray-400">
                     <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Book An Appointment</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">How To Find Us</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Insurance Information</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  </ul>
               </div>
               
               <div>
                  <h4 className="text-lg font-medium mb-6">FAQ</h4>
                  <ul className="space-y-4 text-[14px] text-gray-400">
                     <li><a href="#" className="hover:text-white transition-colors">Account</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Manage Appointments</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Account & Support</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Patient Portal</a></li>
                  </ul>
               </div>
            </div>
            
            {/* Divider */}
            <div className="h-[1px] w-full bg-gray-800 mb-8"></div>
            
            {/* Bottom: Copyright */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-medium">
               <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
               <p>© {new Date().getFullYear()} Aurelian Health. All rights reserved.</p>
            </div>
         </div>
      </motion.footer>

    </div>
  );
};

export default Home;
