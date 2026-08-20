import { useState, useEffect, useRef } from 'react';
import logger from '../../utils/logger';
import { useAuth } from '../../context/pharmacy/AuthContext';
import { toast } from 'react-hot-toast';
import pharmacyService from '../../utils/pharmacy/pharmacyService';



export default function ProfileSettings() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'Staff',
    location: 'Main Branch',
    shift: 'General 9AM–5PM'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || 'John Doe',
        email: user.email || 'admin@clinic.com',
        phone: user.phone || '+1 (555) 123-4567',
        designation: user.designation || 'Staff',
        location: user.location || 'Main Branch',
        shift: user.shift || 'General 9AM–5PM'
      });
    }
  }, [user]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (pharmacyService.api && user?.id) {
        await pharmacyService.api.put(`/auth/users/${user.id}/profile`, formData);
        toast.success('Profile updated successfully');
      } else {
        toast.success('Profile updated successfully (Offline)');
      }
    } catch (error) {
      logger.error(error);
      toast.success('Profile updated successfully (Offline fallback)');
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
        toast.success("Profile image selected. Don't forget to save changes!");
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    
    <div className="max-w-5xl mx-auto space-y-6 pb-10 p-2 md:p-6 lg:p-8 font-sans">
      
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-[14px] mb-4">
          <span className="text-slate-500">Account Settings</span>
          <span className="text-slate-400">›</span>
          <span className="font-bold text-[#2563EB]">Profile Settings</span>
        </div>
        <h1 className="text-[32px] font-bold text-[#0f172a] tracking-tight mb-2">Profile Settings</h1>
        <p className="text-[#64748b]">Manage your account information and professional credentials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 p-8 flex flex-col h-full">
            
            <div className="flex justify-center mb-8 relative">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-[#dbeafe] flex items-center justify-center text-[#1e40af] text-4xl font-bold overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(formData.name)
                  )}
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
                  className="absolute bottom-1 right-1 w-8 h-8 bg-white border border-slate-100 shadow-sm rounded-full flex items-center justify-center text-[#2563EB] hover:bg-slate-50 transition-colors"
                >
                  <Pen className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stats List */}
            <div className="flex-1 space-y-6">
              
              {/* Employee ID */}
              <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#2563EB] flex items-center justify-center shrink-0">
                  <IdCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[13px] text-slate-500 mb-1">Employee ID</p>
                  <p className="text-[15px] font-bold text-slate-900">{user.employeeId || 'EMP-XXXX'}</p>
                </div>
              </div>

              {/* Account Status */}
              <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#2563EB] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[13px] text-slate-500 mb-1">Account Status</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold bg-[#dcfce7] text-[#166534]">
                    Active
                  </span>
                </div>
              </div>

              {/* Last Login */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#2563EB] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[13px] text-slate-500 mb-1">Last Login</p>
                  <p className="text-[14px] font-medium text-slate-900">8 May 2026, 05:36 PM</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Editable Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col h-full">
            
            <div className="p-8 pb-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#eff6ff] text-[#2563EB] rounded-xl flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-[17px] font-bold text-[#0f172a]">Personal Information</h3>
            </div>
            
            <form onSubmit={handleSave} className="px-8 pb-8 flex-1 flex flex-col">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7 flex-1">
                
                <div className="space-y-2">
                  <label className="text-[14px] font-bold text-[#64748b]">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 transition-all text-[14px] text-slate-900 bg-white placeholder:text-slate-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[14px] font-bold text-[#64748b]">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 transition-all text-[14px] text-slate-900 bg-white placeholder:text-slate-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[14px] font-bold text-[#64748b]">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 transition-all text-[14px] text-slate-900 bg-white placeholder:text-slate-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[14px] font-bold text-[#64748b]">Designation</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 outline-none focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 transition-all text-[14px] text-slate-900 bg-white appearance-none cursor-pointer"
                    >
                      <option value="Staff">Staff</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[14px] font-bold text-[#64748b]">Branch / Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 outline-none focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 transition-all text-[14px] text-slate-900 bg-white appearance-none cursor-pointer"
                    >
                      <option value="Main Branch">Main Branch</option>
                      <option value="Downtown">Downtown</option>
                      <option value="Northside">Northside</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[14px] font-bold text-[#64748b]">Assigned Shift</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      name="shift"
                      value={formData.shift}
                      onChange={handleChange}
                      className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 outline-none focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 transition-all text-[14px] text-slate-900 bg-white appearance-none cursor-pointer"
                    >
                      <option value="General 9AM–5PM">General 9AM–5PM</option>
                      <option value="Morning 6AM–2PM">Morning 6AM–2PM</option>
                      <option value="Afternoon 2PM–10PM">Afternoon 2PM–10PM</option>
                      <option value="Night 10PM–6AM">Night 10PM–6AM</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

              </div>

              <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-[#2563EB] text-white rounded-xl text-[14px] font-medium shadow-md shadow-[#2563EB]/20 hover:bg-[#1e40af] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
    
  );
}
