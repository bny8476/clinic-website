import { useState, useEffect } from 'react';

import logger from '../../utils/logger';
import { MODULE_PERMISSIONS } from '../../config/pharmacy/roles.config';
import api from '../../utils/pharmacy/api';
import { toast } from 'react-hot-toast';



export default function RoleManagementPanel({ onBack }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6', permissions: [] });
  const [isSaving, setIsSaving] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/roles');
      setRoles(res.data?.data || res.data || []);
    } catch (err) {
      toast.error('Failed to load roles');
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', color: '#3882F6', permissions: [] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role) => {
    setEditingRole(role);
    let parsedPerms = [];
    try {
      parsedPerms = role.permissionsJson ? JSON.parse(role.permissionsJson) : [];
    } catch(e) {}
    setFormData({ name: role.name, color: role.color || '#3882F6', permissions: parsedPerms });
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permId) => {
    if (editingRole && editingRole.isSystemDefault) return;
    setFormData(prev => {
      const perms = prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: perms };
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    
    try {
      setIsSaving(true);
      const payload = {
        name: formData.name.trim().toUpperCase().replace(/\s+/g, '_'),
        color: formData.color,
        permissionsJson: JSON.stringify(formData.permissions)
      };

      if (editingRole) {
        await api.put(`/auth/roles/${editingRole.id}`, payload);
        toast.success('Role updated successfully');
      } else {
        await api.post('/auth/roles', payload);
        toast.success('Role created successfully');
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save role');
    } finally {
      setIsSaving(false);
    }
  };

  const getPermissionsList = (role) => {
    let active = [];
    try {
      active = role.permissionsJson ? JSON.parse(role.permissionsJson) : [];
    } catch(e) {}

    if (active.includes('ALL')) {
      return [{ id: 'ALL', label: 'Full System Access', active: true }];
    }
    
    const list = [];
    Object.values(MODULE_PERMISSIONS).forEach(category => {
      category.forEach(perm => {
        if (active.includes(perm.id)) {
          list.push({ ...perm, active: true });
        }
      });
    });
    
    if (list.length < 4) {
      const allPerms = Object.values(MODULE_PERMISSIONS).flat();
      for (const p of allPerms) {
        if (!list.find(x => x.id === p.id) && list.length < 4) {
          list.push({ ...p, active: false });
        }
      }
    }
    return list;
  };

  // Maps category names to specific icons
  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('clinical')) return <ClipboardPlus className="w-4 h-4" />;
    if (name.includes('billing')) return <FileText className="w-4 h-4" />;
    if (name.includes('inventory')) return <Package className="w-4 h-4" />;
    if (name.includes('reports')) return <BarChart2 className="w-4 h-4" />;
    return <ShieldCheck className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">System Roles & Permissions</h2>
        <div className="flex gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Back
            </button>
          )}
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white text-sm font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Custom Role
          </button>
        </div>
      </div>

      {/* Grid of Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {(Array.isArray(roles) ? roles : []).map((role) => {
          const perms = getPermissionsList(role);
          const activeCount = perms.filter(p => p.active).length;
          const isSystemAdmin = role.name === 'SYSTEM_ADMIN';

          return (
            <div key={role.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center`} style={{ backgroundColor: role.color ? `${role.color}20` : '#dbeafe', color: role.color || '#2563EB' }}>
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{role.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-medium">
                      <Users className="w-3.5 h-3.5" /> Users Assigned
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenEdit(role)}
                  className="text-slate-400 hover:text-[#2563EB] p-1 transition-colors"
                  title="Edit Role"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Active Permissions ({activeCount})
                </p>
                <div className="space-y-4">
                  {perms.map((perm, idx) => (
                    <div key={idx} className={`flex items-center justify-between ${isSystemAdmin ? 'bg-blue-50 p-3 rounded-lg border border-blue-100' : ''}`}>
                      <span className={`text-[13px] font-bold ${isSystemAdmin ? 'text-blue-700' : 'text-slate-700 uppercase'}`}>
                        {perm.label}
                      </span>
                      <div className={`relative inline-flex h-5 w-9 shrink-0 items-center justify-center rounded-full ${perm.active ? 'bg-[#2563EB]' : 'bg-slate-200'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${perm.active ? 'translate-x-2' : '-translate-x-2'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Full-Screen Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-[24px] shadow-2xl my-8 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-8 pb-6 border-b border-slate-50 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#eff6ff] text-[#2563EB] rounded-xl flex items-center justify-center shrink-0">
                  <ClipboardPlus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-[20px] font-bold text-slate-900 leading-tight">
                    {editingRole ? `Edit Role: ${editingRole.name}` : 'Create Custom Role'}
                  </h2>
                  <p className="text-[13px] text-slate-500 mt-1">
                    Define a role name, choose a color and set permissions for this role.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              
              {editingRole?.isSystemDefault && (
                <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-[13px] border border-amber-200 flex items-start gap-3">
                  <Shield className="w-5 h-5 shrink-0 mt-0.5" />
                  <p><strong>System Default Role:</strong> You cannot modify the permissions or name of this core system role. You can only customize its display color.</p>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-900">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#2563EB]" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      disabled={editingRole?.isSystemDefault}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#bfdbfe] text-[14px] text-slate-900 outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      placeholder="e.g. SENIOR_PHARMACIST"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-900">
                    Display Color <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-[#2563EB] shadow-sm pointer-events-none" style={{ backgroundColor: formData.color }}></div>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      className="w-full pl-12 pr-10 py-3 rounded-xl border border-slate-200 text-[14px] text-slate-600 outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all"
                      placeholder="#3882F6"
                    />
                    <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    {/* Hidden color picker input that activates when you click the hex text box */}
                    <input 
                      type="color" 
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              <div>
                <div className="mb-6">
                  <h3 className="text-[15px] font-bold text-slate-900 mb-1">Permissions</h3>
                  <p className="text-[13px] text-slate-500">Select the permissions you want to assign to this role.</p>
                </div>

                <div className="space-y-4">
                  {Object.entries(MODULE_PERMISSIONS).map(([moduleName, perms]) => (
                    <div key={moduleName} className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4 text-[#2563EB]">
                        {getCategoryIcon(moduleName)}
                        <h4 className="text-[12px] font-bold uppercase tracking-wider">{moduleName}</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {perms.map(perm => {
                          const isSelected = formData.permissions.includes(perm.id) || formData.permissions.includes('ALL');
                          return (
    
                            <button
                              key={perm.id}
                              type="button"
                              disabled={editingRole?.isSystemDefault}
                              onClick={() => handleTogglePermission(perm.id)}
                              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                                isSelected
                                  ? 'border-[#bfdbfe] bg-white shadow-sm'
                                  : 'border-slate-100 bg-white hover:border-[#bfdbfe]'
                              } ${editingRole?.isSystemDefault ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'border border-slate-200 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <span className={`text-[13px] font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                                {perm.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-[14px] font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.name}
                className="flex items-center gap-2 px-6 py-2.5 text-[14px] font-bold text-white bg-[#2563EB] rounded-xl hover:bg-[#1D4ED8] shadow-md shadow-[#2563EB]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Role</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
    
  );
}
