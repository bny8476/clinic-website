import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, UserPlus, Phone, Mail, User, Droplet, Stethoscope, FileText, ChevronDown, MapPin, AlertCircle, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer } from '../../components/ui/motion';

const PatientRegistration = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [patient, setPatient] = useState({
    firstName: '', lastName: '', age: '', gender: 'Male', phone: '', email: '',
    address: '', bloodGroup: 'O+', emergencyContact: '', reasonForVisit: ''
  });

  const location = useLocation();
  const isDoctor = location.pathname.startsWith('/doctor');
  const returnPath = isDoctor ? '/doctor/dashboard?panel=patients' : '/reception';

  const registerPatient = useMutation({
    mutationFn: async () => axiosPrivate.post('/reception/patients/register', patient),
    onSuccess: (data) => {
      toast.success(`Patient registered successfully! OP Number: ${data.data.opNumber}`);
      setPatient({ firstName: '', lastName: '', age: '', gender: 'Male', phone: '', email: '', address: '', bloodGroup: 'O+', emergencyContact: '', reasonForVisit: '' });
      queryClient.invalidateQueries(['doctor-patients']);
      navigate(returnPath);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to register patient');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patient.firstName || !patient.phone || !patient.reasonForVisit) {
      toast.error('First Name, Phone and Reason for Visit are required fields');
      return;
    }
    registerPatient.mutate();
  };

  const inputClass = "w-full bg-white text-sm text-slate-800 font-semibold rounded-xl border border-slate-200/90 placeholder:text-slate-400 placeholder:font-normal focus:border-[#2160FF] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none py-3 px-3.5";
  const labelClass = "block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5";

  return (
    <div className="min-h-full bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 xl:p-10 w-full font-sans">
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={fadeIn}
        className="max-w-[1400px] mx-auto space-y-6"
      >
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-blue-50 text-[#2160FF] rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
              <UserPlus className="w-5 h-5 text-[#2160FF]" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight m-0">Patient Registration</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium m-0 mt-0.5">Enter new patient particulars for intake and clinical record creation.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to={returnPath} 
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs no-underline text-center"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Card 1: Personal & Demographics */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <User size={16} className="text-[#2160FF]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 m-0">Personal & Demographics</h3>
                </div>
                <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Step 1
                </span>
              </div>

              <div className="space-y-4">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>First Name <span className="text-rose-500">*</span></label>
                    <input 
                      type="text"
                      value={patient.firstName} 
                      onChange={e => setPatient({ ...patient, firstName: e.target.value })} 
                      placeholder="e.g. Ramesh" 
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input 
                      type="text"
                      value={patient.lastName} 
                      onChange={e => setPatient({ ...patient, lastName: e.target.value })} 
                      placeholder="e.g. Kumar" 
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Age, Gender & Blood Group in clean 3-col grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Age */}
                  <div>
                    <label className={labelClass}>Age</label>
                    <input 
                      type="number" 
                      min="0"
                      max="130"
                      value={patient.age} 
                      onChange={e => setPatient({ ...patient, age: e.target.value })} 
                      placeholder="e.g. 35"
                      className={inputClass}
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className={labelClass}>Gender</label>
                    <div className="relative">
                      <select 
                        value={patient.gender} 
                        onChange={e => setPatient({ ...patient, gender: e.target.value })} 
                        className={`${inputClass} pr-9 appearance-none cursor-pointer`}
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown size={15} />
                      </div>
                    </div>
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className={labelClass}>Blood Group</label>
                    <div className="relative">
                      <select 
                        value={patient.bloodGroup} 
                        onChange={e => setPatient({ ...patient, bloodGroup: e.target.value })} 
                        className={`${inputClass} pr-9 appearance-none cursor-pointer`}
                      >
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown size={15} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason for Visit (Clinical Requirement) */}
                <div className="pt-2">
                  <label className={labelClass}>Reason for Visit / Primary Complaint <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute top-3.5 left-3.5 pointer-events-none text-slate-400">
                      <Stethoscope size={16} />
                    </div>
                    <textarea 
                      rows="3"
                      value={patient.reasonForVisit} 
                      onChange={e => setPatient({ ...patient, reasonForVisit: e.target.value })} 
                      placeholder="e.g. High fever, chest pain, routine consultation..." 
                      className={`${inputClass} pl-10 resize-none`}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Contact & Residential Details */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Phone size={16} className="text-emerald-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 m-0">Contact & Address Particulars</h3>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  Step 2
                </span>
              </div>

              <div className="space-y-4">
                {/* Phone & Email in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label className={labelClass}>Phone Number <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone size={15} />
                      </div>
                      <input 
                        type="tel"
                        value={patient.phone} 
                        onChange={e => setPatient({ ...patient, phone: e.target.value })} 
                        placeholder="+91 98765 43210" 
                        className={`${inputClass} pl-10`}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail size={15} />
                      </div>
                      <input 
                        type="email"
                        value={patient.email} 
                        onChange={e => setPatient({ ...patient, email: e.target.value })} 
                        placeholder="patient@example.com" 
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className={labelClass}>Emergency Contact Phone</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone size={15} />
                    </div>
                    <input 
                      type="tel"
                      value={patient.emergencyContact} 
                      onChange={e => setPatient({ ...patient, emergencyContact: e.target.value })} 
                      placeholder="e.g. +91 91234 56789" 
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                {/* Residential Address */}
                <div>
                  <label className={labelClass}>Residential Address</label>
                  <div className="relative">
                    <div className="absolute top-3.5 left-3.5 pointer-events-none text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <textarea 
                      rows="3"
                      value={patient.address} 
                      onChange={e => setPatient({ ...patient, address: e.target.value })} 
                      placeholder="Street name, apartment, city, and postal code..." 
                      className={`${inputClass} pl-10 resize-none`}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Form Actions Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400 font-medium">
              <span className="text-rose-500 font-bold">*</span> Mandatory fields required for creating the patient medical record and generating an OP Number.
            </span>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Link 
                to={returnPath} 
                className="px-6 py-3 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs no-underline text-center"
              >
                Cancel
              </Link>
              <button 
                type="submit" 
                disabled={registerPatient.isPending}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-xs font-black text-white bg-[#2160FF] hover:bg-[#1a4acc] transition-all shadow-md shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
              >
                {registerPatient.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering Patient...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Register Patient
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PatientRegistration;
