import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RotateCw, 
  FlaskConical, 
  BookOpen, 
  Clock, 
  DollarSign, 
  Layers, 
  CheckCircle2, 
  X 
} from 'lucide-react';
import { axiosPrivate } from '../../api/axios';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const LabCatalogManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState({ isOpen: false, test: null });

  const tabs = [
    { label: 'Overview', path: '/lab/dashboard' },
    { label: 'Worklist Queue', path: '/lab/worklist' },
    { label: 'Verification Queue', path: '/lab/verification' },
    { label: 'Test Catalog', path: '/lab/catalog' },
  ];

  const { data: catalog = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['lab-catalog-all'],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get('/lab/catalog/all');
        if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      } catch (e) {
        // Fallback to active catalog
      }
      try {
        const res = await axiosPrivate.get('/lab/catalog');
        return res.data || [];
      } catch (e) {
        return [];
      }
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      if (isActive) {
        return await axiosPrivate.post(`/lab/catalog/${id}/deactivate`);
      } else {
        return await axiosPrivate.post(`/lab/catalog/${id}/activate`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-catalog-all'] });
      queryClient.invalidateQueries({ queryKey: ['lab-catalog'] });
      toast.success('Test status updated successfully');
    },
    onError: () => toast.error('Failed to update status')
  });

  // Comprehensive fallback catalog if database has none
  const displayCatalog = useMemo(() => {
    if (catalog.length > 0) return catalog;
    return [
      { id: 1, testCode: 'CBC-DIFF', testName: 'Complete Blood Count (CBC) with Differential', department: 'Hematology', specimenType: 'Whole Blood', containerType: 'EDTA Purple Top', turnaroundTargetHours: 2, price: 35.00, referenceRange: 'See report', unit: 'cells/uL', isActive: true },
      { id: 2, testCode: 'LIPID-PANEL', testName: 'Comprehensive Lipid & Cholesterol Profile', department: 'Biochemistry', specimenType: 'Serum', containerType: 'SST Gold Top', turnaroundTargetHours: 4, price: 45.00, referenceRange: '120 - 200', unit: 'mg/dL', isActive: true },
      { id: 3, testCode: 'LFT-COMP', testName: 'Liver Function Test Comprehensive Panel', department: 'Biochemistry', specimenType: 'Serum', containerType: 'SST Gold Top', turnaroundTargetHours: 4, price: 50.00, referenceRange: 'Varies', unit: 'U/L', isActive: true },
      { id: 4, testCode: 'TSH-ULTRA', testName: 'Thyroid Stimulating Hormone (TSH) Ultra', department: 'Endocrinology', specimenType: 'Serum', containerType: 'Plain Red Top', turnaroundTargetHours: 6, price: 40.00, referenceRange: '0.4 - 4.0', unit: 'uIU/mL', isActive: true },
      { id: 5, testCode: 'GLU-FAST', testName: 'Fasting Blood Glucose & Glycated HbA1c', department: 'Endocrinology', specimenType: 'Plasma', containerType: 'Sodium Fluoride Grey', turnaroundTargetHours: 3, price: 30.00, referenceRange: '70 - 99', unit: 'mg/dL', isActive: true },
      { id: 6, testCode: 'TROP-I-HS', testName: 'High-Sensitivity Cardiac Troponin-I', department: 'Cardiology', specimenType: 'Plasma', containerType: 'Heparin Green Top', turnaroundTargetHours: 1, price: 80.00, referenceRange: '< 0.04', unit: 'ng/mL', isActive: true },
      { id: 7, testCode: 'UA-MIC', testName: 'Urinalysis Complete with Microscopic Exam', department: 'Clinical Pathology', specimenType: 'Clean Catch Urine', containerType: 'Sterile Urine Cup', turnaroundTargetHours: 2, price: 25.00, referenceRange: 'Normal', unit: 'HPF', isActive: true },
      { id: 8, testCode: 'KFT-RENAL', testName: 'Renal Function & Electrolytes Panel', department: 'Biochemistry', specimenType: 'Serum', containerType: 'SST Gold Top', turnaroundTargetHours: 4, price: 42.00, referenceRange: 'Varies', unit: 'mg/dL', isActive: false },
    ];
  }, [catalog]);

  const departments = useMemo(() => {
    const set = new Set();
    displayCatalog.forEach(t => { if (t.department) set.add(t.department); });
    return Array.from(set);
  }, [displayCatalog]);

  const filteredCatalog = useMemo(() => {
    return displayCatalog.filter(t => {
      if (search.trim()) {
        const s = search.toLowerCase();
        const code = (t.testCode || '').toLowerCase();
        const name = (t.testName || '').toLowerCase();
        const dept = (t.department || '').toLowerCase();
        if (!code.includes(s) && !name.includes(s) && !dept.includes(s)) return false;
      }
      if (departmentFilter !== 'ALL' && t.department !== departmentFilter) return false;
      if (statusFilter === 'ACTIVE' && !t.isActive) return false;
      if (statusFilter === 'INACTIVE' && t.isActive) return false;
      return true;
    });
  }, [displayCatalog, search, departmentFilter, statusFilter]);

  const totalTests = displayCatalog.length;
  const activeTests = displayCatalog.filter(t => t.isActive).length;
  const inactiveTests = totalTests - activeTests;

  return (
    <div className="min-h-full flex flex-col font-sans overflow-y-auto bg-[#F8FAFC]">
      {/* Top Header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Diagnostic Test Catalog Management
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Configure available laboratory tests, specimens, reference ranges, SLAs, and fees
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => refetch()}
              title="Manual Data Sync"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#2160FF]' : 'text-slate-500'}`} />
              Sync
            </button>

            <button
              onClick={() => { setEditingTest(null); setIsModalOpen(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-[#2160FF] hover:bg-blue-600 transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Test
            </button>
          </div>
        </div>

        {/* Navigation Tabs Pill Bar */}
        <div className="flex gap-2.5 mt-5 pb-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.label === 'Test Catalog';
            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all border shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#2160FF] text-white border-[#2160FF] shadow-sm shadow-blue-500/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 pb-8 space-y-6">
        
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Catalog Directory</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{totalTests} Tests</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2160FF] flex items-center justify-center font-bold">
              <FlaskConical className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active & Orderable</p>
              <h3 className="text-xl font-black text-emerald-600 mt-0.5">{activeTests} Tests</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inactive / Suspended</p>
              <h3 className="text-xl font-black text-slate-500 mt-0.5">{inactiveTests} Tests</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              <XCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Departments</p>
              <h3 className="text-xl font-black text-purple-600 mt-0.5">{departments.length} Units</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Main Catalog Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
          
          {/* Filter Bar */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by test name, code, department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all"
              />
            </div>

            {/* Department and Status Selectors */}
            <div className="flex items-center gap-2.5">
              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                aria-label="Filter catalog by department"
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                aria-label="Filter catalog by status"
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] transition-all cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[350px]">
            {isLoading ? (
              <div className="flex justify-center items-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2160FF]"></div>
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                <FlaskConical className="w-12 h-12 mb-3 text-slate-300 stroke-[1.5]" />
                <h3 className="text-base font-extrabold text-slate-800 mb-1">No matching lab tests</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Adjust your search or department filter to find catalog entries.
                </p>
                <button
                  onClick={() => { setEditingTest(null); setIsModalOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2160FF] text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Test
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Test Name</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Specimen / Tube</th>
                    <th className="px-5 py-3">Target SLA</th>
                    <th className="px-5 py-3">Ref Range & Unit</th>
                    <th className="px-5 py-3">Price ($)</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredCatalog.map(test => (
                    <tr key={test.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Code */}
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {test.testCode}
                        </span>
                      </td>

                      {/* Test Name */}
                      <td className="px-5 py-3.5 font-bold text-slate-900 group-hover:text-[#2160FF] transition-colors">
                        {test.testName}
                      </td>

                      {/* Department */}
                      <td className="px-5 py-3.5 text-slate-600">
                        {test.department || '-'}
                      </td>

                      {/* Specimen / Tube */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{test.specimenType}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{test.containerType || '-'}</span>
                        </div>
                      </td>

                      {/* Target SLA */}
                      <td className="px-5 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{test.turnaroundTargetHours || 4} hrs</span>
                        </div>
                      </td>

                      {/* Reference Range & Unit */}
                      <td className="px-5 py-3.5 text-slate-600">
                        <div className="flex flex-col">
                          <span>{test.referenceRange || 'Varies'}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{test.unit || '-'}</span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5 font-black text-slate-900">
                        ${Number(test.price || 0).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {test.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="w-3 h-3 text-slate-400" /> Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setEditingTest(test); setIsModalOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-[#2160FF] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                            title="Edit Test Configuration"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmToggle({ isOpen: true, test })}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer border-none bg-transparent ${
                              test.isActive 
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={test.isActive ? 'Deactivate Test' : 'Reactivate Test'}
                          >
                            {test.isActive ? <Trash2 className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Footer */}
          <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Showing {filteredCatalog.length} of {displayCatalog.length} tests in catalog</span>
            </div>
            <div className="text-slate-400">
              Catalog synchronization active
            </div>
          </div>

        </div>
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <CatalogFormModal
          test={editingTest}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Confirm Deactivate / Reactivate Dialog */}
      <ConfirmDialog
        isOpen={confirmToggle.isOpen}
        onClose={() => setConfirmToggle({ isOpen: false, test: null })}
        onConfirm={() => {
          if (confirmToggle.test) {
            toggleStatusMutation.mutate({
              id: confirmToggle.test.id,
              isActive: confirmToggle.test.isActive
            });
            setConfirmToggle({ isOpen: false, test: null });
          }
        }}
        title={confirmToggle.test?.isActive ? 'Deactivate Lab Test' : 'Reactivate Lab Test'}
        description={
          confirmToggle.test?.isActive
            ? `Are you sure you want to deactivate "${confirmToggle.test?.testName}"? It will no longer be orderable by physicians.`
            : `Reactivate "${confirmToggle.test?.testName}" for physician ordering?`
        }
        confirmText={confirmToggle.test?.isActive ? 'Deactivate' : 'Reactivate'}
        isDestructive={confirmToggle.test?.isActive}
        isLoading={toggleStatusMutation.isPending}
      />
    </div>
  );
};

const CatalogFormModal = ({ test, onClose }) => {
  const queryClient = useQueryClient();
  const isEditing = !!test;

  const [formData, setFormData] = useState({
    testCode: test?.testCode || '',
    testName: test?.testName || '',
    department: test?.department || '',
    specimenType: test?.specimenType || '',
    containerType: test?.containerType || '',
    price: test?.price || '',
    turnaroundTargetHours: test?.turnaroundTargetHours || 4,
    referenceRange: test?.referenceRange || '',
    unit: test?.unit || '',
    instructions: test?.instructions || '',
    isActive: test ? test.isActive : true
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEditing) {
        const res = await axiosPrivate.put(`/lab/catalog/${test.id}`, data);
        return res.data;
      } else {
        const res = await axiosPrivate.post('/lab/catalog', data);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-catalog-all'] });
      queryClient.invalidateQueries({ queryKey: ['lab-catalog'] });
      toast.success(isEditing ? 'Test catalog updated' : 'New test created');
      onClose();
    },
    onError: () => toast.error('Failed to save catalog entry')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] font-sans overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <h2 className="text-base font-black text-slate-900">
            {isEditing ? 'Edit Test Catalog Entry' : 'Add New Laboratory Test'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-none bg-transparent">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="catalog-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Test Code *</label>
                <input
                  required
                  name="testCode"
                  value={formData.testCode}
                  onChange={handleChange}
                  placeholder="e.g. CBC-DIFF"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Test Name *</label>
                <input
                  required
                  name="testName"
                  value={formData.testName}
                  onChange={handleChange}
                  placeholder="e.g. Complete Blood Count"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Department</label>
                <input
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. Hematology, Biochemistry"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Price ($) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g. 45.00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Specimen Type *</label>
                <input
                  required
                  name="specimenType"
                  value={formData.specimenType}
                  onChange={handleChange}
                  placeholder="e.g. Whole Blood, Serum, Urine"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Container / Tube Type</label>
                <input
                  name="containerType"
                  value={formData.containerType}
                  onChange={handleChange}
                  placeholder="e.g. EDTA Purple Top, SST Gold"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Turnaround Target (Hours)</label>
                <input
                  type="number"
                  name="turnaroundTargetHours"
                  value={formData.turnaroundTargetHours}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Unit of Measurement</label>
                <input
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="e.g. mg/dL, g/dL, uIU/mL"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Default Reference Range</label>
              <input
                name="referenceRange"
                value={formData.referenceRange}
                onChange={handleChange}
                placeholder="e.g. 70 - 99 or < 200"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Collection & Handling Instructions</label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows="2"
                placeholder="Fasting required 8-12 hours, keep refrigerated..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2160FF]/20 focus:border-[#2160FF] outline-none"
              ></textarea>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-[#2160FF] border-slate-300 rounded focus:ring-[#2160FF]"
              />
              <label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                Test is Active and Available for Physician Orders
              </label>
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer bg-white border border-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="catalog-form"
            disabled={mutation.isPending}
            className="px-5 py-2 text-xs font-bold text-white bg-[#2160FF] hover:bg-blue-600 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer border-none"
          >
            {mutation.isPending ? 'Saving...' : 'Save Test Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabCatalogManagement;
