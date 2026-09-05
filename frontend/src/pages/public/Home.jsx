import './Home.css';
import Card from '../../components/ui/Card';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Activity, ArrowLeft, ArrowRight, BadgeCheck, Bell, Bone, Box, Brain, Calendar, CheckCircle2, ChevronDown, ChevronRight, Circle, Clock, FlaskConical, Headphones, Heart, HeartPulse, HomeIcon, Image, Info, Mail, MapPin, Menu, MessageCircle, MessageSquare, Monitor, Phone, PhoneCall, Pill, Play, Plus, Printer, Quote, ShieldCheck, Star, Stethoscope, Target, ThumbsUp, User, UserCheck, Users, Video } from 'lucide-react';
import { usePublicDepartments, usePublicDoctors } from '../../api/publicApi';

/* ════════════════════════════════════════════════════════════════════════════
   STATIC DATA & TOKENS
════════════════════════════════════════════════════════════════════════════ */
const BLUE = '#2B4AFE';

const FacebookIcon = ({ size=16, className="" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);
const TwitterIcon = ({ size=16, className="" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
);
const InstagramIcon = ({ size=16, className="" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);
const LinkedinIcon = ({ size=16, className="" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
);


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
const TESTIMONIALS_DATA = [
  {
    name: "Anna",
    date: "20.04.2025",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
    photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600",
    quote: "I felt calm and cared for from the first step inside. The doctor took time to explain everything clearly — I've never felt more confident in a diagnosis.",
    rating: 5
  },
  {
    name: "Michael T.",
    date: "15.03.2025",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    photo: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
    quote: "The level of professionalism and care here is unmatched. State-of-the-art facilities and doctors who genuinely listen to your concerns.",
    rating: 5
  },
  {
    name: "Sarah Jenkins",
    date: "02.02.2025",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    photo: "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=600&q=80",
    quote: "Booking was a breeze, and my appointment started right on time. Outstanding service and the entire staff was incredibly welcoming.",
    rating: 5
  }
];

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  const handleNextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS_DATA.length);
  };
  
  const handlePrevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + TESTIMONIALS_DATA.length) % TESTIMONIALS_DATA.length);
  };

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
    <div className="min-h-screen bg-[#F4F6FF] font-inter">
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
          className="flex items-center justify-between mb-8 px-3 py-3 bg-white/70 backdrop-blur-xl border border-white/50 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
        >
          {/* Left Side: Logo & Menu */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <motion.div variants={navItem} className="flex items-center gap-3 cursor-pointer select-none pl-1" onClick={() => scrollTo('hero')}>
              <div className="w-12 h-12 rounded-[16px] bg-blue-600 flex items-center justify-center text-white shadow-md">
                <HeartPulse size={24} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-gray-900 text-[18px] tracking-tight">Aurelian Health</span>
            </motion.div>
            
            {/* Hamburger */}
            <button className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-700 ml-2 border border-gray-100">
              <Menu size={22} strokeWidth={2} />
            </button>
          </div>

          {/* Center Pill Nav */}
          <motion.div variants={navItem} className="hidden lg:flex items-center bg-white/50 border border-white/60 rounded-full px-8 py-3.5 gap-8">
            <button onClick={() => scrollTo('about')} className="text-[14px] font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              About Us
            </button>
            <button onClick={() => scrollTo('services')} className="text-[14px] font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Services
            </button>
            <button onClick={() => scrollTo('doctors')} className="text-[14px] font-semibold text-blue-600 relative group">
              Doctors
              <span className="absolute -bottom-3.5 left-0 w-full h-[3px] bg-blue-600 rounded-t-full"></span>
            </button>
            <button onClick={() => scrollTo('contact')} className="text-[14px] font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Contact
            </button>
          </motion.div>

          {/* Right Actions */}
          <motion.div variants={navItem} className="flex items-center gap-6 pr-1">
            <div className="hidden xl:flex items-center gap-3 text-gray-600">
              <MapPin size={20} className="text-gray-500" strokeWidth={1.5} />
              <div className="leading-tight text-[12px] font-medium">
                <p>Medychinyi Avenue,</p>
                <p>8-A, Lviv</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Phone Button */}
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-12 h-12 rounded-[16px] bg-white text-gray-700 flex items-center justify-center shadow-sm border border-gray-100 hover:shadow transition-shadow">
                <Phone size={18} strokeWidth={2} />
              </motion.button>
              
              {/* Bell Button */}
              <div className="relative">
                 <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-12 h-12 rounded-[16px] bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-white hover:bg-blue-100 transition-colors">
                   <Bell size={18} strokeWidth={2} />
                 </motion.button>
                 <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full"></div>
              </div>
              
              {/* User Button */}
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/patient/login')} className="w-12 h-12 rounded-[16px] bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors">
                <User size={18} strokeWidth={2} />
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
              <h1 className="text-[3rem] sm:text-[4rem] xl:text-[5.5rem] font-medium leading-[0.85] tracking-tight text-gray-900 mb-8" style={{ fontFamily: 'var(--font-display, Inter)' }}>
                <div className="overflow-hidden pr-4"><motion.div variants={heroHeadingLine}>Innovation</motion.div></div>
                <div className="overflow-hidden pr-4"><motion.div variants={heroHeadingLine}>Clinic</motion.div></div>
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
                onClick={() => navigate('/patient/login')} 
                className="bg-[#2B4AFE] text-white px-8 py-4 rounded-full font-medium text-[15px] hover:bg-blue-700 transition-colors flex items-center gap-2 group shadow-[0_10px_30px_rgba(43,74,254,0.3)] hover:shadow-[0_15px_40px_rgba(43,74,254,0.4)]"
              >
                Find Doctor
                <div className="bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.button>
            </motion.div>

            {/* Stats Card */}
            <div className="mt-auto pt-16 flex flex-col sm:flex-row relative z-30">
              <motion.div variants={cardSequence} initial="hidden" animate="show" className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[24px] p-4 pr-6 flex flex-col sm:flex-row gap-5 items-center w-max max-w-full">
                <motion.div whileHover={{ y: -3 }} className="w-28 h-20 rounded-xl overflow-hidden relative shrink-0 shadow-inner group cursor-pointer">
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
                    <motion.div variants={playButtonReveal} className="w-6 h-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white border border-white/50 group-hover:scale-110 transition-transform">
                      <Play className="w-2.5 h-2.5 ml-0.5 fill-current" />
                    </motion.div>
                  </div>
                  <span className="absolute bottom-1.5 left-0 right-0 text-center text-white text-[9px] font-bold tracking-wide z-10 uppercase">Virtual tour</span>
                </motion.div>
                <motion.div variants={statsSequence} initial="hidden" animate="show">
                  <motion.div variants={statsItem} className="flex items-center gap-2 mb-3">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Results we are proud of</p>
                    <div className="w-6 h-3 rounded-full bg-blue-100 flex items-center p-0.5"><div className="w-2 h-2 rounded-full bg-blue-600" /></div>
                  </motion.div>
                  <motion.div className="flex gap-4 sm:gap-5">
                    <motion.div variants={statsItem}>
                      <p className="text-2xl font-medium text-blue-600 leading-none mb-1.5"><AnimatedCounter value={10} delay={1.5} suffix="+" /></p>
                      <p className="text-[9px] text-gray-500 uppercase font-bold leading-tight">years of<br/>experience</p>
                    </motion.div>
                    <motion.div variants={statsItem}>
                      <p className="text-2xl font-medium text-blue-600 leading-none mb-1.5"><AnimatedCounter value={20} delay={1.6} suffix="+" /></p>
                      <p className="text-[9px] text-gray-500 uppercase font-bold leading-tight">highly qualified<br/>doctors</p>
                    </motion.div>
                    <motion.div variants={statsItem}>
                      <p className="text-2xl font-medium text-blue-600 leading-none mb-1.5"><AnimatedCounter value={100} delay={1.7} suffix="%" /></p>
                      <p className="text-[9px] text-gray-500 uppercase font-bold leading-tight">digital<br/>diagnostics</p>
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
          <div 
            className="absolute bottom-0 left-[52%] -translate-x-[50%] w-[340px] lg:w-[400px] xl:w-[500px] h-[75%] lg:h-[80%] z-40 pointer-events-none hidden md:block"
          >
            <div className="w-full h-full">
              <motion.img 
                variants={heroImage}
                initial="hidden"
                animate="show"
                src="/images/doctor-hero.png" 
                className="w-full h-full object-contain object-bottom drop-shadow-[0_25px_50px_rgba(0,0,0,0.3)]" 
                alt="Doctor" 
              />
            </div>
          </div>

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
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const el = document.getElementById('about');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              else navigate('/about');
            }}
            className="group relative inline-flex items-center justify-between gap-4 md:gap-8 bg-gradient-to-r from-[#0038FF] via-[#0052FF] to-[#0070FF] text-white rounded-full p-2.5 pl-3 pr-3 md:p-3.5 md:pl-4 md:pr-4 shadow-[0_16px_40px_-6px_rgba(0,85,255,0.45),0_0_20px_rgba(0,90,255,0.35)] hover:shadow-[0_22px_50px_-4px_rgba(0,85,255,0.65)] border border-[#4B84FF]/60 ring-1 ring-white/20 transition-all duration-300 overflow-hidden text-left cursor-pointer mx-auto"
          >
            {/* Top Gloss Specular Highlight */}
            <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/30 via-white/10 to-transparent rounded-t-full pointer-events-none" />

            {/* Subtle Dot Matrix Pattern Overlay */}
            <div className="absolute right-16 bottom-0 w-48 h-16 opacity-30 pointer-events-none mix-blend-overlay overflow-hidden rounded-r-full">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="dot-grid-button" width="6" height="6" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#ffffff" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dot-grid-button)" />
              </svg>
            </div>

            {/* Left Glass Circle Hospital Icon */}
            <div className="w-13 h-13 md:w-15 md:h-15 rounded-full bg-white/20 backdrop-blur-md border border-white/35 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),0_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center shrink-0 z-10">
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6V3" />
                <path d="M10.5 4.5h3" />
                <rect x="7" y="6" width="10" height="15" rx="1.5" />
                <rect x="3" y="10" width="4" height="11" rx="1" />
                <rect x="17" y="10" width="4" height="11" rx="1" />
                <path d="M10 10h4" />
                <path d="M12 8v4" />
                <rect x="10" y="15" width="4" height="6" />
              </svg>
            </div>

            {/* Center Text Block & Arrow */}
            <div className="flex items-center gap-3 md:gap-6 z-10 pl-1 pr-1">
              <div>
                <span className="block text-white font-extrabold text-[20px] md:text-[24px] leading-snug tracking-tight">
                  More about us
                </span>
                <span className="block text-blue-100/90 text-[12px] md:text-[13.5px] font-normal leading-tight mt-0.5">
                  Learn more about our clinic
                </span>
              </div>

              {/* Right Arrow */}
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-white shrink-0 group-hover:translate-x-2 transition-transform duration-300 stroke-[2.2] ml-1 md:ml-3" />
            </div>

            {/* Right White Squircle User Container */}
            <div className="w-13 h-13 md:w-15 md:h-15 rounded-[22px] md:rounded-[26px] bg-white flex items-center justify-center shadow-[0_6px_16px_rgba(0,40,150,0.25)] shrink-0 z-10">
              <User className="w-7 h-7 md:w-8 md:h-8 text-[#0038FF] stroke-[2.2]" />
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
                        <button onClick={() => navigate('/patient/login')} className="text-[14px] text-blue-600 font-bold hover:underline decoration-2 underline-offset-4">
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

            {/* Fixed Doctors Image */}
            <div className="hidden xl:block absolute bottom-0 left-[25%] w-[450px] z-10 pointer-events-none">
               <img src="https://pngimg.com/uploads/doctor/doctor_PNG15988.png" alt="Doctors" className="w-full h-auto drop-shadow-2xl object-bottom object-contain" />
            </div>

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
                     whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
                     transition={{ duration: 0.3 }}
                     className="bg-white rounded-[24px] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 border-l-[4px] border-l-blue-600 relative overflow-hidden group cursor-pointer"
                  >
                     <div className="absolute top-6 right-6 grid grid-cols-4 gap-1.5 opacity-20">
                        {[...Array(12)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-blue-500"></div>)}
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-start gap-5 mb-5">
                           <div className="w-[60px] h-[60px] rounded-[18px] bg-blue-50 flex items-center justify-center shrink-0">
                              <Calendar size={28} className="text-blue-600" strokeWidth={1.5} />
                           </div>
                           <div className="flex flex-col items-start mt-0.5">
                              <span className="text-[40px] font-black text-blue-600 tracking-tight leading-none mb-1">10+</span>
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3">Years of Experience</span>
                              <div className="w-8 h-[2px] bg-blue-600 rounded-full"></div>
                           </div>
                        </div>
                        <p className="text-gray-500 text-[14px] leading-relaxed font-medium">We have been working since 2012, improving the quality of services every day.</p>
                     </div>
                  </motion.div>
                  
                  {/* 15+ Areas of Medicine */}
                  <motion.div 
                     initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} 
                     whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
                     transition={{ duration: 0.3 }}
                     className="bg-white rounded-[24px] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 border-l-[4px] border-l-blue-600 relative overflow-hidden group cursor-pointer"
                  >
                     <div className="absolute top-6 right-6 grid grid-cols-4 gap-1.5 opacity-20">
                        {[...Array(12)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-blue-500"></div>)}
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-start gap-5 mb-5">
                           <div className="w-[60px] h-[60px] rounded-[18px] bg-blue-50 flex items-center justify-center shrink-0">
                              <Activity size={28} className="text-blue-600" strokeWidth={1.5} />
                           </div>
                           <div className="flex flex-col items-start mt-0.5">
                              <span className="text-[40px] font-black text-blue-600 tracking-tight leading-none mb-1">15+</span>
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3">Areas of Medicine</span>
                              <div className="w-8 h-[2px] bg-blue-600 rounded-full"></div>
                           </div>
                        </div>
                        <p className="text-gray-500 text-[14px] leading-relaxed font-medium">From family medicine to cardiology and laboratory diagnostics.</p>
                     </div>
                  </motion.div>
                  
                  {/* 95% Satisfied Patients */}
                  <motion.div 
                     initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} 
                     whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
                     transition={{ duration: 0.3 }}
                     className="bg-white rounded-[24px] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 border-l-[4px] border-l-[#00A96E] relative overflow-hidden group cursor-pointer"
                  >
                     <div className="absolute top-6 right-6 grid grid-cols-4 gap-1.5 opacity-30">
                        {[...Array(12)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-[#00A96E]"></div>)}
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-start gap-5 mb-5">
                           <div className="w-[60px] h-[60px] rounded-[18px] bg-[#00A96E]/10 flex items-center justify-center shrink-0">
                              <ThumbsUp size={28} className="text-[#00A96E]" strokeWidth={1.5} />
                           </div>
                           <div className="flex flex-col items-start mt-0.5">
                              <span className="text-[40px] font-black text-[#00A96E] tracking-tight leading-none mb-1">95%</span>
                              <span className="text-[10px] font-bold text-[#00A96E] uppercase tracking-widest mb-3">Satisfied Patients</span>
                              <div className="w-8 h-[2px] bg-[#00A96E] rounded-full"></div>
                           </div>
                        </div>
                        <p className="text-gray-500 text-[14px] leading-relaxed font-medium">According to internal surveys over the past year.</p>
                     </div>
                  </motion.div>
                  
                  {/* 98% Diagnostic Accuracy */}
                  <motion.div 
                     initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} 
                     whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
                     transition={{ duration: 0.3 }}
                     className="bg-white rounded-[24px] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 border-l-[4px] border-l-[#5B3DF0] relative overflow-hidden group cursor-pointer"
                  >
                     <div className="absolute top-6 right-6 grid grid-cols-4 gap-1.5 opacity-25">
                        {[...Array(12)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-[#5B3DF0]"></div>)}
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-start gap-5 mb-5">
                           <div className="w-[60px] h-[60px] rounded-[18px] bg-[#5B3DF0]/10 flex items-center justify-center shrink-0">
                              <Target size={28} className="text-[#5B3DF0]" strokeWidth={1.5} />
                           </div>
                           <div className="flex flex-col items-start mt-0.5">
                              <span className="text-[40px] font-black text-[#5B3DF0] tracking-tight leading-none mb-1">98%</span>
                              <span className="text-[10px] font-bold text-[#5B3DF0] uppercase tracking-widest mb-3">Diagnostic Accuracy</span>
                              <div className="w-8 h-[2px] bg-[#5B3DF0] rounded-full"></div>
                           </div>
                        </div>
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
                  <button onClick={() => navigate('/patient/login')} className="bg-blue-600 text-white rounded-full pl-8 pr-2 py-2 flex items-center gap-6 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
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
               
               <motion.button initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} onClick={() => navigate('/patient/login')} className="bg-blue-600 text-white rounded-xl px-8 py-4 text-[15px] font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-colors w-fit mb-16 shadow-lg shadow-blue-600/20">
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
                  <motion.button onClick={handlePrevTestimonial} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-14 h-14 rounded-full border-2 border-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors">
                     <ArrowLeft size={24} strokeWidth={1.5} />
                  </motion.button>
                  <div className="flex items-center gap-3">
                     {TESTIMONIALS_DATA.map((_, idx) => (
                        <div key={idx} className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === currentTestimonial ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                     ))}
                  </div>
                  <motion.button onClick={handleNextTestimonial} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-14 h-14 rounded-full border-2 border-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors">
                     <ArrowRight size={24} strokeWidth={1.5} />
                  </motion.button>
               </div>
            </motion.div>
            
            {/* Right Card */}
            <motion.div 
               initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}
               whileHover={{ y: -8 }} transition={{ duration: 0.3 }} 
               className="w-full lg:w-[65%] bg-white rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.06)] hover:shadow-xl transition-shadow border border-gray-50 p-8 md:p-12 relative overflow-hidden"
            >
               <AnimatePresence mode="wait">
                  <motion.div 
                     key={currentTestimonial}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                     {/* Card Header */}
                     <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-5">
                           <img src={TESTIMONIALS_DATA[currentTestimonial].avatar} alt={TESTIMONIALS_DATA[currentTestimonial].name} className="w-16 h-16 rounded-full object-cover shadow-sm" />
                           <div>
                              <h4 className="font-bold text-gray-900 text-[19px] mb-1">{TESTIMONIALS_DATA[currentTestimonial].name}</h4>
                              <div className="flex gap-1 text-yellow-400">
                                 {[...Array(TESTIMONIALS_DATA[currentTestimonial].rating)].map((_, i) => (
                                    <Star key={i} size={18} fill="currentColor" className="text-yellow-400" />
                                 ))}
                              </div>
                           </div>
                        </div>
                        <span className="text-gray-500 font-medium text-[15px]">{TESTIMONIALS_DATA[currentTestimonial].date}</span>
                     </div>
                     
                     {/* Card Body */}
                     <div className="flex flex-col md:flex-row gap-10 mb-10 items-center">
                        <div className="w-full md:w-[45%] h-[220px] rounded-2xl overflow-hidden shadow-sm shrink-0">
                           <img src={TESTIMONIALS_DATA[currentTestimonial].photo} alt="Doctor interaction" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-full md:w-[55%] pt-2">
                           <Quote size={40} className="text-blue-600 mb-6 opacity-80" fill="currentColor" strokeWidth={1} />
                           <p className="text-gray-700 text-[18px] leading-relaxed font-medium">
                              {TESTIMONIALS_DATA[currentTestimonial].quote}
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
               </AnimatePresence>
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
                     <motion.button onClick={() => navigate('/patient/login')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-4 font-bold text-[15px] flex items-center justify-center gap-3 transition-colors shadow-[0_8px_20px_rgba(37,99,235,0.25)]">
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
                  <img 
                     src="https://pngimg.com/uploads/doctor/doctor_PNG15988.png" 
                     alt="Doctor" 
                     className="relative z-10 w-[75%] max-w-[450px] object-contain object-bottom" 
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
      <footer id="contact" className="bg-[#0A0E17] text-white pt-10 pb-6 px-4 md:px-16 mt-10">
         <div className="max-w-[1600px] mx-auto">
            {/* Top: Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-gray-800/60 rounded-2xl p-6 lg:p-8 mb-8 shadow-lg bg-[#0E131F]">
               
               <div className="flex items-center gap-4 lg:border-r border-gray-800/60 p-4">
                  <div className="w-12 h-12 rounded-full bg-blue-900/20 flex items-center justify-center shrink-0">
                     <PhoneCall size={20} className="text-blue-500" strokeWidth={1.5} />
                  </div>
                  <div>
                     <p className="text-sm text-gray-300 mb-1">Phone</p>
                     <p className="text-[15px] font-medium tracking-wide">310-437-2766</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-4 lg:border-r border-gray-800/60 p-4">
                  <div className="w-12 h-12 rounded-full bg-blue-900/20 flex items-center justify-center shrink-0">
                     <Mail size={20} className="text-blue-500" strokeWidth={1.5} />
                  </div>
                  <div>
                     <p className="text-sm text-gray-300 mb-1">Email</p>
                     <p className="text-[15px] font-medium tracking-wide">clinic@outlook.com</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-4 lg:border-r border-gray-800/60 p-4">
                  <div className="w-12 h-12 rounded-full bg-blue-900/20 flex items-center justify-center shrink-0">
                     <MapPin size={20} className="text-blue-500" strokeWidth={1.5} />
                  </div>
                  <div>
                     <p className="text-sm text-gray-300 mb-1">Address</p>
                     <p className="text-[15px] font-medium leading-snug">Medcynnyi Avenue,<br/>8-A, Lviv</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 rounded-full bg-blue-900/20 flex items-center justify-center shrink-0">
                     <Printer size={20} className="text-blue-500" strokeWidth={1.5} />
                  </div>
                  <div>
                     <p className="text-sm text-gray-300 mb-1">Fax</p>
                     <p className="text-[15px] font-medium tracking-wide">+1-000-0000</p>
                  </div>
               </div>
            </div>
            
            {/* Divider */}
            <div className="h-[1px] w-full bg-gray-800/60 mb-8"></div>
            
            {/* Middle: Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20 mb-8">
               
               <div className="col-span-1">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="text-blue-500">
                        <HeartPulse size={36} strokeWidth={2.5} />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold tracking-tight leading-none text-white">Aurelian Health</h3>
                        <p className="text-[10px] tracking-[0.2em] text-gray-300 mt-1.5 uppercase">Care That Connects</p>
                     </div>
                  </div>
                  <p className="text-[14px] text-gray-300 leading-relaxed mb-8 pr-4">
                     Delivering compassionate, high-quality healthcare with modern technology and a patient-first approach.
                  </p>
                  <button className="border border-gray-600/80 rounded-full px-6 py-2 hover:bg-gray-700 transition-colors inline-flex items-center gap-3 text-sm font-medium group">
                     About Us <ArrowRight size={16} className="text-gray-300 group-hover:text-white transition-colors" />
                  </button>
               </div>
               
               <div>
                  <h4 className="text-lg font-medium mb-8 relative inline-block text-white">
                     Support
                     <span className="absolute -bottom-3 left-0 w-8 h-[2px] bg-blue-500"></span>
                  </h4>
                  <ul className="space-y-4 text-[14px] text-gray-300 font-medium">
                     <li><a href="#" className="hover:text-white transition-colors flex items-center justify-between group">Contact Us <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform" /></a></li>
                     <li><a href="#" className="hover:text-white transition-colors flex items-center justify-between group">Book An Appointment <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform" /></a></li>
                     <li><a href="#" className="hover:text-white transition-colors flex items-center justify-between group">How To Find Us <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform" /></a></li>
                     <li><a href="#" className="hover:text-white transition-colors flex items-center justify-between group">Insurance Information <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform" /></a></li>
                     <li><a href="#" className="hover:text-white transition-colors flex items-center justify-between group">Privacy Policy <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform" /></a></li>
                  </ul>
               </div>
               
               <div>
                  <h4 className="text-lg font-medium mb-8 relative inline-block text-white">
                     FAQ
                     <span className="absolute -bottom-3 left-0 w-8 h-[2px] bg-blue-500"></span>
                  </h4>
                  <ul className="space-y-4 text-[14px] text-gray-300 font-medium">
                     <li><a href="#" className="hover:text-white transition-colors flex items-center justify-between group">Account <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform" /></a></li>
                     <li><a href="#" className="hover:text-white transition-colors flex items-center justify-between group">Manage Appointments <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform" /></a></li>
                     <li><a href="#" className="hover:text-white transition-colors flex items-center justify-between group">FAQ <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform" /></a></li>
                     <li><a href="#" className="hover:text-white transition-colors flex items-center justify-between group">Account & Support <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform" /></a></li>
                     <li><a href="#" className="hover:text-white transition-colors flex items-center justify-between group">Patient Portal <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform" /></a></li>
                  </ul>
               </div>

               <div>
                  <h4 className="text-lg font-medium mb-8 relative inline-block text-white">
                     Quick Links
                     <span className="absolute -bottom-3 left-0 w-8 h-[2px] bg-blue-500"></span>
                  </h4>
                  <ul className="space-y-4 text-[14px] text-gray-300 font-medium">
                     <li><a href="#" className="hover:text-white transition-colors flex items-center justify-between group">Doctors <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform" /></a></li>
                     <li><a href="#" className="hover:text-white transition-colors flex items-center justify-between group">Departments <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform" /></a></li>
                     <li><a href="#" className="hover:text-white transition-colors flex items-center justify-between group">Services <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform" /></a></li>
                     <li><a href="#" className="hover:text-white transition-colors flex items-center justify-between group">Blog <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform" /></a></li>
                     <li><a href="#" className="hover:text-white transition-colors flex items-center justify-between group">Careers <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform" /></a></li>
                  </ul>
               </div>
            </div>
            
            {/* Divider */}
            <div className="h-[1px] w-full bg-gray-800/60 mb-6"></div>
            
            {/* Bottom: Copyright & Socials */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-8 lg:gap-4 text-xs font-medium text-gray-300 pt-2">
               
               <div className="flex flex-col gap-3 text-center lg:text-left">
                  <p>© {new Date().getFullYear()} <span className="text-blue-400">Aurelian Health</span>. All rights reserved.</p>
                  <div className="flex items-center gap-4 justify-center lg:justify-start">
                     <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
                     <span className="text-gray-600">|</span>
                     <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                     <span className="text-gray-600">|</span>
                     <a href="#" className="hover:text-white transition-colors">Sitemap</a>
                  </div>
               </div>

               <div className="flex flex-col items-center gap-3">
                  <p className="text-white">Follow Us</p>
                  <div className="flex items-center gap-3">
                     <a href="#" className="w-10 h-10 rounded-full bg-[#161C26] flex items-center justify-center hover:bg-gray-800 transition-colors text-white">
                        <FacebookIcon size={16} />
                     </a>
                     <a href="#" className="w-10 h-10 rounded-full bg-[#161C26] flex items-center justify-center hover:bg-gray-800 transition-colors text-white">
                        <TwitterIcon size={16} />
                     </a>
                     <a href="#" className="w-10 h-10 rounded-full bg-[#161C26] flex items-center justify-center hover:bg-gray-800 transition-colors text-white">
                        <InstagramIcon size={16} />
                     </a>
                     <a href="#" className="w-10 h-10 rounded-full bg-[#161C26] flex items-center justify-center hover:bg-gray-800 transition-colors text-white">
                        <LinkedinIcon size={16} />
                     </a>
                  </div>
               </div>

               <div className="flex items-center gap-4 text-left border border-transparent">
                  <div className="text-blue-500 rounded-full border border-blue-500/20 bg-blue-500/5 p-2">
                     <ShieldCheck size={28} strokeWidth={1.5} />
                  </div>
                  <div>
                     <p className="text-white text-sm mb-1 font-medium">Your health. Our priority.</p>
                     <p className="text-gray-300 text-xs">Trusted by <span className="text-blue-400">15,000+</span> patients worldwide.</p>
                  </div>
               </div>

            </div>
         </div>
      </footer>

    </div>
  );
};

export default Home;
