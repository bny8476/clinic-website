import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Plus, Eye, Edit2, MoreVertical, ChevronLeft, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';


const PatientList = ({ onPatientClick }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('name'); 
  const [currentPage, setCurrentPage] = useState(1);
  const [editPatient, setEditPatient] = useState(null);  // patient being edited
  const [editForm, setEditForm] = useState({});
  const [actionsOpenId, setActionsOpenId] = useState(null);
  const itemsPerPage = 10;

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['doctor-patients'],
    queryFn: async () => (await axiosPrivate.get('/doctor/patients/my')).data,
  });

  const filteredAndSorted = patients
    .filter(p => {
      const matchesQuery = !query || p.name?.toLowerCase().includes(query.toLowerCase()) ||
                           p.phone?.includes(query) || p.patientId?.toString().includes(query);
      const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'Active' ? p.status === 'Active' : p.status !== 'Active');
      return matchesQuery && matchesStatus;
    })
    .sort((a, b) => {
      if (sortField === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortField === 'lastVisit') return new Date(b.lastVisitDate || 0) - new Date(a.lastVisitDate || 0);
      return 0;
    });

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const displayedPatients = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const generateEmail = (name) => {
    if (!name) return '-';
    return `${name.replace(/\s+/g, '.').toLowerCase()}@example.com`;
  };

  const generateDisplayId = (id) => {
    if (!id) return '-';
    return `PAT-${String(id).padStart(5, '0')}`;
  };

  const getStatusStyle = (status) => {
    if (status === 'Active') return 'text-[#10b981] bg-[#d1fae5]';
    return 'text-slate-500 bg-slate-100';
  };

  const openEdit = (p) => {
    setEditPatient(p);
    setEditForm({
      gender: p.gender || '',
      bloodGroup: p.bloodGroup || '',
      address: p.address || '',
      emergencyContactName: p.emergencyContactName || '',
      emergencyContactPhone: p.emergencyContactPhone || '',
      medicalHistorySummary: p.medicalHistorySummary || '',
      allergies: p.allergies || '',
    });
  };

  const editMutation = useMutation({
    mutationFn: async () => (await axiosPrivate.put(`/patients/${editPatient.patientId}`, editForm)).data,
    onSuccess: () => {
      toast.success('Patient profile updated');
      queryClient.invalidateQueries(['doctor-patients']);
      setEditPatient(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Update failed'),
  });

  return (
    
    <div className="p-6 bg-white min-h-full font-sans">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Patients</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Manage and view your patients</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-[320px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search patients by name, phone, or ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative w-full sm:w-auto">
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Filter */}
            <div className="relative w-full sm:w-auto">
              <select 
                value={sortField}
                onChange={e => setSortField(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="name">Sort by Name</option>
                <option value="lastVisit">Sort by Last Visit</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Add Patient Button */}
            <button 
              onClick={() => navigate('/reception/register')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#5B21B6] hover:bg-indigo-800 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus size={16} strokeWidth={2.5} /> Add Patient
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 tracking-wider whitespace-nowrap">Patient Name</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 tracking-wider whitespace-nowrap">ID</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 tracking-wider whitespace-nowrap">Age / Gender</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 tracking-wider whitespace-nowrap">Phone</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 tracking-wider whitespace-nowrap">Email</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 tracking-wider whitespace-nowrap">Last Visit</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 tracking-wider whitespace-nowrap">Upcoming Appointment</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 tracking-wider whitespace-nowrap">Status</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 tracking-wider text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan="9" className="py-10 text-center text-sm font-medium text-slate-500">Loading patients...</td></tr>
                ) : displayedPatients.length === 0 ? (
                  <tr><td colSpan="9" className="py-10 text-center text-sm font-medium text-slate-500">No patients found.</td></tr>
                ) : (
                  displayedPatients.map((p, idx) => (
                    <tr 
                      key={p.patientId || idx} 
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => onPatientClick ? onPatientClick(p.patientId) : navigate(`/doctor/patients/${p.patientId}`)}
                    >
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img loading="lazy" 
                            src={`https://i.pravatar.cc/150?u=${p.patientId || idx}`} 
                            alt={p.name}
                            className="w-8 h-8 rounded-full bg-slate-200 object-cover"
                          />
                          <span className="text-sm font-bold text-slate-800">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-600">
                        {generateDisplayId(p.patientId)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-600">
                        {p.age ? `${p.age} Years` : '-'} / {p.gender || '-'}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-600">
                        {p.phone || '-'}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-600">
                        {generateEmail(p.name)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-600">
                        {formatDate(p.lastVisitDate)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-[#5B21B6]">
                        {p.upcomingAppointmentDate ? formatDateTime(p.upcomingAppointmentDate) : <span className="text-slate-400 font-semibold">-</span>}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${getStatusStyle(p.status || 'Active')}`}>
                          {p.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3 text-[#5B21B6]" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => onPatientClick ? onPatientClick(p.patientId) : navigate(`/doctor/patients/${p.patientId}`)}
                            className="hover:text-indigo-900 transition-colors bg-indigo-50 p-1.5 rounded" 
                            title="View Patient"
                          >
                            <Eye size={16} strokeWidth={2.5} />
                          </button>
                          <button 
                            onClick={() => openEdit(p)}
                            className="hover:text-indigo-900 transition-colors bg-indigo-50 p-1.5 rounded" 
                            title="Edit Patient"
                          >
                            <Edit2 size={16} strokeWidth={2.5} />
                          </button>
                          <div className="relative">
                            <button 
                              onClick={() => setActionsOpenId(actionsOpenId === p.patientId ? null : p.patientId)}
                              className="hover:text-indigo-900 transition-colors bg-indigo-50 p-1.5 rounded" 
                              title="More Actions"
                            >
                              <MoreVertical size={16} strokeWidth={2.5} />
                            </button>
                            {actionsOpenId === p.patientId && (
                              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                                <button onClick={() => { navigate(`/doctor/patients/${p.patientId}`); setActionsOpenId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">View Profile</button>
                                <button onClick={() => { navigate(`/doctor/appointments/new?patientId=${p.patientId}`); setActionsOpenId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Book Appointment</button>
                                <button onClick={() => { navigate(`/doctor/prescriptions/new?patientId=${p.patientId}`); setActionsOpenId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">New Prescription</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!isLoading && filteredAndSorted.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="text-xs font-semibold text-slate-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} of {filteredAndSorted.length} patients
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent bg-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 3).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-colors ${
                      currentPage === page 
                        ? 'bg-[#5B21B6] text-white border border-[#5B21B6]' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent bg-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Patient Modal */}
      {editPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Edit Patient</h2>
                <p className="text-sm text-slate-500 mt-0.5">{editPatient.name} · {generateDisplayId(editPatient.patientId)}</p>
              </div>
              <button onClick={() => setEditPatient(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); editMutation.mutate(); }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Gender</label>
                  <select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Not set</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Blood Group</label>
                  <select value={editForm.bloodGroup} onChange={e => setEditForm({...editForm, bloodGroup: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Not set</option>
                    {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Address</label>
                <input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Emergency Contact Name</label>
                  <input type="text" value={editForm.emergencyContactName} onChange={e => setEditForm({...editForm, emergencyContactName: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Emergency Contact Phone</label>
                  <input type="tel" value={editForm.emergencyContactPhone} onChange={e => setEditForm({...editForm, emergencyContactPhone: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Allergies</label>
                <input type="text" value={editForm.allergies} onChange={e => setEditForm({...editForm, allergies: e.target.value})} placeholder="e.g. Penicillin, Aspirin" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Medical History Summary</label>
                <textarea rows={3} value={editForm.medicalHistorySummary} onChange={e => setEditForm({...editForm, medicalHistorySummary: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditPatient(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={editMutation.isPending} className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60">
                  {editMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    
  );
};

export default PatientList;
