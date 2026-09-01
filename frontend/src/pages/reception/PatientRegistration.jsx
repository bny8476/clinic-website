import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, UserPlus, Phone, Mail, User, Droplet, Stethoscope, FileText, ChevronDown } from 'lucide-react';
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

  const inputClass = "w-full bg-white text-[15px] text-gray-700 font-medium rounded-xl border border-gray-200 focus:border-[#2864FF] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none py-3.5";
  const labelClass = "block text-sm font-bold text-slate-800 mb-2";

  return (
    <div className="min-h-full bg-[#F8FAFF] p-6 lg:p-10 w-full font-sans">
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={fadeIn}
        className="max-w-[1000px] mx-auto space-y-8"
      >
        <div className="flex flex-col gap-6">

          
          <div className="flex items-start gap-5">
            <div className="p-4 bg-[#EBF0FF] rounded-2xl flex-shrink-0">
              <UserPlus className="w-8 h-8 text-[#2864FF]" strokeWidth={2.5} />
            </div>
            <div className="pt-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Patient Registration</h1>
              <p className="text-[15px] text-gray-500 font-medium">Enter new patient details for intake and clinical record creation.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
              
              {/* First Name */}
              <motion.div variants={fadeIn} className="lg:col-span-1">
                <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  value={patient.firstName} 
                  onChange={e => setPatient({ ...patient, firstName: e.target.value })} 
                  placeholder="e.g. Ramesh" 
                  className={`${inputClass} px-4`}
                  required
                />
              </motion.div>

              {/* Last Name */}
              <motion.div variants={fadeIn} className="lg:col-span-1">
                <label className={labelClass}>Last Name</label>
                <input 
                  type="text"
                  value={patient.lastName} 
                  onChange={e => setPatient({ ...patient, lastName: e.target.value })} 
                  placeholder="e.g. Kumar" 
                  className={`${inputClass} px-4`}
                />
              </motion.div>

              {/* Phone Number */}
              <motion.div variants={fadeIn} className="lg:col-span-1">
                <label className={labelClass}>Phone Number <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </div>
                  <input 
                    type="tel"
                    value={patient.phone} 
                    onChange={e => setPatient({ ...patient, phone: e.target.value })} 
                    placeholder="+91 98765 43210" 
                    className={`${inputClass} pl-12 pr-4`}
                    required
                  />
                </div>
              </motion.div>

              {/* Age */}
              <motion.div variants={fadeIn} className="lg:col-span-1">
                <label className={labelClass}>Age</label>
                <input 
                  type="number" 
                  value={patient.age} 
                  onChange={e => setPatient({ ...patient, age: e.target.value })} 
                  placeholder="e.g. 35"
                  className={`${inputClass} px-4`}
                />
              </motion.div>

              {/* Email Address */}
              <motion.div variants={fadeIn} className="md:col-span-2">
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input 
                    type="email"
                    value={patient.email} 
                    onChange={e => setPatient({ ...patient, email: e.target.value })} 
                    placeholder="e.g. email@example.com"
                    className={`${inputClass} pl-12 pr-4`}
                  />
                </div>
              </motion.div>

              {/* Address */}
              <motion.div variants={fadeIn} className="md:col-span-2">
                <label className={labelClass}>Address</label>
                <input 
                  type="text"
                  value={patient.address} 
                  onChange={e => setPatient({ ...patient, address: e.target.value })} 
                  placeholder="e.g. 123 Main St"
                  className={`${inputClass} px-4`}
                />
              </motion.div>

              {/* Gender */}
              <motion.div variants={fadeIn} className="md:col-span-2">
                <label className={labelClass}>Gender</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <div className="p-1 bg-blue-50 rounded-md">
                        <User className="w-4 h-4 text-[#2864FF]" />
                    </div>
                  </div>
                  <select 
                    value={patient.gender} 
                    onChange={e => setPatient({ ...patient, gender: e.target.value })} 
                    className={`${inputClass} pl-14 pr-10 appearance-none`}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </motion.div>

              {/* Blood Group */}
              <motion.div variants={fadeIn} className="md:col-span-2">
                <label className={labelClass}>Blood Group</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <div className="p-1 bg-blue-50 rounded-md">
                        <Droplet className="w-4 h-4 text-[#2864FF]" />
                     </div>
                  </div>
                  <select 
                    value={patient.bloodGroup} 
                    onChange={e => setPatient({ ...patient, bloodGroup: e.target.value })} 
                    className={`${inputClass} pl-14 pr-10 appearance-none`}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg}>{bg}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </motion.div>

              {/* Emergency Contact */}
              <motion.div variants={fadeIn} className="md:col-span-2">
                <label className={labelClass}>Emergency Contact</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </div>
                  <input 
                    type="tel"
                    value={patient.emergencyContact} 
                    onChange={e => setPatient({ ...patient, emergencyContact: e.target.value })} 
                    placeholder="Emergency Phone Number"
                    className={`${inputClass} pl-12 pr-4`}
                  />
                </div>
              </motion.div>

              {/* Reason for Visit */}
              <motion.div variants={fadeIn} className="md:col-span-2">
                <label className={labelClass}>Reason for Visit <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Stethoscope className="w-5 h-5 text-gray-400" />
                  </div>
                  <input 
                    type="text"
                    value={patient.reasonForVisit} 
                    onChange={e => setPatient({ ...patient, reasonForVisit: e.target.value })} 
                    placeholder="e.g. Fever and Cough"
                    className={`${inputClass} pl-12 pr-4`}
                    required
                  />
                </div>
              </motion.div>

            </motion.div>

            <div className="pt-8 mt-8 border-t border-gray-100 flex items-center justify-end gap-4">
              <Link to={returnPath} className="px-8 py-3.5 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                Cancel
              </Link>
              <button 
                type="submit" 
                disabled={registerPatient.isPending}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-[#2864FF] hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-5 h-5" />
                {registerPatient.isPending ? 'Registering...' : 'Register Patient'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default PatientRegistration;
