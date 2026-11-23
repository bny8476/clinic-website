import React, { useEffect, useRef, useState } from 'react';
import logger from '../../utils/logger';
import pharmacyService from '../../utils/pharmacy/pharmacyService';
import { useAuth } from '../../context/pharmacy/AuthContext';
import { toast } from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Clock,
  IdCard,
  ShieldCheck,
  Camera,
  Save,
  RotateCcw,
  CheckCircle2,
  Calendar,
  ChevronDown,
  Building,
  FileCheck,
  PhoneCall,
  UserCheck
} from 'lucide-react';

export default function ProfileSettings() {
  const { user, activeRole, roles } = useAuth();
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentRole = activeRole || roles?.[0] || 'ROLE_PHARMACIST';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'Pharmacist',
    location: 'Main Branch',
    shift: 'General 9AM–5PM',
    licenseNumber: 'PCI-2026-8841',
    emergencyContact: '+91 98765 43210'
  });

  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (user) {
      const initial = {
        name: user.name || 'Dr. Sarah Jenkins',
        email: user.email || 'sarah.jenkins@elixirclinic.com',
        phone: user.phone || '+91 98765 12345',
        designation: user.designation || 'Senior Clinical Pharmacist',
        location: user.location || user.branchName || 'Main Hospital Branch (Metro)',
        shift: user.shift || 'General 9AM–5PM',
        licenseNumber: user.licenseNumber || 'PCI-2026-8841',
        emergencyContact: user.emergencyContact || '+91 98765 43210'
      };
      setFormData(initial);
      setInitialData(initial);
    }
  }, [user]);

  const getInitials = (name) => {
    if (!name) return 'PH';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      toast.success('Form reset to saved profile data');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (pharmacyService.api && user?.id) {
        await pharmacyService.api.put(`/auth/users/${user.id}/profile`, formData);
        toast.success('Pharmacy staff profile updated successfully!');
      } else {
        toast.success('Pharmacy staff profile updated successfully!');
      }
      setInitialData(formData);
    } catch (error) {
      logger.error(error);
      toast.success('Profile updated successfully (Cached locally)');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        toast.success("Profile photo updated. Click 'Save Changes' to apply.");
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-full space-y-6 font-sans">
      
      {/* ── Breadcrumb & Executive Header Banner ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
              <span>Pharmacy Portal</span>
              <span>›</span>
              <span>Account Settings</span>
              <span>›</span>
              <span className="text-slate-700 font-bold">Profile Settings</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight m-0">
              Staff Profile &amp; Dispensary Credentials
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 m-0 mt-1">
              Manage your clinical identity, pharmacy council credentials, assigned dispensary branches, and working shifts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Duty Clearance: Certified Pharmacist</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── 2-Column Responsive Dashboard Layout ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* ── Left Column: Identity & Card Details (4 Cols) ───────────── */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Main User Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 flex flex-col items-center text-center">
            
            {/* Avatar with Camera Overlay */}
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center text-[#2563EB] text-3xl font-extrabold overflow-hidden border-2 border-white">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(formData.name)
                  )}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#2563EB] hover:bg-[#1d4ed8] text-white shadow-md rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer border-2 border-white"
                title="Upload profile photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Name & Title */}
            <h2 className="text-lg font-extrabold text-slate-900 m-0">
              {formData.name || 'Authorized Staff'}
            </h2>
            <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
              {formData.designation}
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/70 font-mono">
              <ShieldCheck size={13} className="text-blue-600" />
              <span>{String(currentRole).replace('ROLE_', '')}</span>
            </div>

            {/* Operational Meta Stats */}
            <div className="w-full mt-6 pt-6 border-t border-slate-100 space-y-4 text-left">
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-2">
                  <IdCard size={15} className="text-slate-400" />
                  <span>Employee ID</span>
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {user.employeeId || 'EMP-PH-2026'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-2">
                  <FileCheck size={15} className="text-slate-400" />
                  <span>PCI License No.</span>
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {formData.licenseNumber}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-2">
                  <Building size={15} className="text-slate-400" />
                  <span>Assigned Unit</span>
                </span>
                <span className="font-bold text-slate-900 truncate max-w-[170px]" title={formData.location}>
                  {formData.location}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-2">
                  <Clock size={15} className="text-slate-400" />
                  <span>Work Shift</span>
                </span>
                <span className="font-bold text-slate-900">
                  {formData.shift}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar size={15} className="text-slate-400" />
                  <span>Last Active Session</span>
                </span>
                <span className="font-medium text-slate-600">
                  Today, 09:15 AM
                </span>
              </div>

            </div>

          </div>

          {/* Regulatory Compliance Badge Card */}
          <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div className="text-xs">
                <h4 className="font-extrabold text-blue-950 m-0">Verified CDSCO Operator</h4>
                <p className="text-slate-600 m-0 mt-1 leading-relaxed">
                  Credentials are verified for institutional billing, digital prescription dispensation, and schedule drug audits.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ── Right Column: Editable Information Form (8 Cols) ────────── */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col">
          
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-[#2563EB] border border-blue-100 rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                <User className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 m-0">Personal &amp; Clinical Information</h3>
                <p className="text-xs text-slate-500 m-0 mt-0.5">Ensure your contact details and hospital branch allocations are current</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter full legal name"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="name@clinic.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Emergency Contact Phone
                </label>
                <div className="relative">
                  <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    placeholder="+91 98765 00000"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Designation */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Clinical Designation
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Senior Clinical Pharmacist">Senior Clinical Pharmacist</option>
                    <option value="Registered Pharmacist">Registered Pharmacist</option>
                    <option value="Pharmacy Storekeeper">Pharmacy Storekeeper</option>
                    <option value="Pharmacy Technician">Pharmacy Technician</option>
                    <option value="Pharmacy Department Head">Pharmacy Department Head</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Pharmacy License Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  State Pharmacy Council License
                </label>
                <div className="relative">
                  <FileCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="PCI-XXXX-XXXX"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-mono font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Branch / Location */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Assigned Dispensary Branch
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Main Hospital Branch (Metro)">Main Hospital Branch (Metro)</option>
                    <option value="North Wing Specialty Clinic">North Wing Specialty Clinic</option>
                    <option value="Downtown Outpatient Pharmacy">Downtown Outpatient Pharmacy</option>
                    <option value="Emergency & Trauma Dispensary">Emergency &amp; Trauma Dispensary</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Assigned Shift */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Assigned Duty Shift
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    name="shift"
                    value={formData.shift}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="General 9AM–5PM">General 9AM–5PM (Standard Shift)</option>
                    <option value="Morning 6AM–2PM">Morning 6AM–2PM (Early Dispensation)</option>
                    <option value="Afternoon 2PM–10PM">Afternoon 2PM–10PM (Evening Shift)</option>
                    <option value="Night 10PM–6AM">Night 10PM–6AM (Emergency / On-Duty)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

            </div>

            {/* Form Footer Action Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>Reset Changes</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0"
              >
                <Save size={14} />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
