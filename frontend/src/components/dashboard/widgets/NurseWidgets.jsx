import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import { Activity, Inbox, UserSearch } from 'lucide-react';
import toast from 'react-hot-toast';

// Helper component for the custom empty states in the Nurse Dashboard
const CustomEmptyState = ({ icon: IconComponent, title, description }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <div className="w-[84px] h-[84px] rounded-[24px] bg-[#f2f5fd] flex items-center justify-center mb-6">
      <IconComponent className="w-10 h-10 text-[#2552d0]" strokeWidth={2} />
    </div>
    <h3 className="font-bold text-[18px] text-slate-900 mb-3">{title}</h3>
    <p className="text-[14px] text-slate-500 max-w-[280px] leading-relaxed m-0">
      {description}
    </p>
  </div>
);

export const NurseAssignedPatientsWidget = ({ assignmentsList, isAssignmentsLoading, selectedPatientId, setSelectedPatientId }) => {
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ patientId: '', firstName: '', lastName: '', phone: '', reasonForVisit: '' });
  const queryClient = useQueryClient();

  const registerWalkIn = useMutation({
    mutationFn: async (data) => {
      const payload = { firstName: data.firstName, lastName: data.lastName, phone: data.phone, reasonForVisit: data.reasonForVisit };
      if (data.patientId) { payload.patient = { id: parseInt(data.patientId) }; }
      const res = await axiosPrivate.post(`/reception/branches/1/walk-ins`, payload);
      const walkIn = res.data;
      const tokenRes = await axiosPrivate.post(`/reception/branches/1/queue/generate?walkInId=${walkIn.id}`);
      return { walkIn, token: tokenRes.data };
    },
    onSuccess: (data) => {
      toast.success(`OP Registered! OP No: ${data.walkIn.opNumber} | Token No: ${data.token.tokenNumber}`);
      setWalkInForm({ patientId: '', firstName: '', lastName: '', phone: '', reasonForVisit: '' });
      setShowTokenForm(false);
      queryClient.invalidateQueries({ queryKey: ['nurseAssignments'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to register walk-in')
  });

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] h-full flex flex-col overflow-hidden">
      <div className="px-6 py-5 flex justify-between items-center shrink-0">
        <h2 className="font-bold text-[16px] text-slate-900 flex items-center gap-3 m-0">
          <div className="flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          Assigned Patients
        </h2>
        <button 
          onClick={() => setShowTokenForm(!showTokenForm)}
          className="border border-indigo-200 text-indigo-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors"
        >
          + OP Token
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {showTokenForm && (
          <div className="p-3 mb-2 bg-[var(--color-surface-alt)] rounded-md border border-[var(--color-border)] space-y-3">
            <p className="text-xs font-semibold text-[var(--color-text)] m-0">Register Walk-in / OP Token</p>
            <input type="text" placeholder="Existing Patient ID (optional)" className="input-field py-1 px-2 text-sm w-full" value={walkInForm.patientId} onChange={e => setWalkInForm({...walkInForm, patientId: e.target.value})} />
            {!walkInForm.patientId && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="First Name" className="input-field py-1 px-2 text-sm" value={walkInForm.firstName} onChange={e => setWalkInForm({...walkInForm, firstName: e.target.value})} />
                  <input type="text" placeholder="Last Name" className="input-field py-1 px-2 text-sm" value={walkInForm.lastName} onChange={e => setWalkInForm({...walkInForm, lastName: e.target.value})} />
                </div>
                <input type="text" placeholder="Phone Number" className="input-field py-1 px-2 text-sm w-full" value={walkInForm.phone} onChange={e => setWalkInForm({...walkInForm, phone: e.target.value})} />
              </div>
            )}
            <input type="text" placeholder="Reason for Visit" className="input-field py-1 px-2 text-sm w-full" value={walkInForm.reasonForVisit} onChange={e => setWalkInForm({...walkInForm, reasonForVisit: e.target.value})} />
            <div className="flex gap-2">
              <Button variant="primary" size="sm" className="w-full" onClick={() => registerWalkIn.mutate(walkInForm)} isLoading={registerWalkIn.isPending}>Register OP</Button>
              <Button variant="outline" size="sm" onClick={() => { setShowTokenForm(false); setWalkInForm({ patientId: '', firstName: '', lastName: '', phone: '', reasonForVisit: '' }); }}>Cancel</Button>
            </div>
          </div>
        )}

        {isAssignmentsLoading ? (
          <Skeleton count={4} variant="line" className="h-10 mb-2" />
        ) : assignmentsList?.length === 0 ? (
          <CustomEmptyState 
            icon={Inbox} 
            title="No Patients Assigned" 
            description="There are currently no OP patients assigned to your nursing queue." 
          />
        ) : (
          <div className="space-y-2">
            {assignmentsList?.map((assignment) => {
              const isSelected = selectedPatientId === assignment.patientId;
              return (
                <div key={assignment.id} onClick={() => setSelectedPatientId(assignment.patientId)} className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <div>
                    <p className="font-bold text-slate-900 m-0 text-sm">{assignment.patientName}</p>
                    <p className="text-xs text-slate-500 m-0 mt-1">Dr. {assignment.attendingDoctorName}</p>
                  </div>
                  <Badge variant={isSelected ? 'primary' : 'neutral'} size="sm">{isSelected ? 'Active' : 'Select'}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const VitalSignsFormWidget = ({ selectedPatientId, selectedPatient }) => {
  const queryClient = useQueryClient();
  const [vitalSign, setVitalSign] = useState({ temperature: '', bloodPressure: '', heartRate: '', respiratoryRate: '', oxygenSaturation: '', notes: '' });

  const recordVitals = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post(`/patients/${selectedPatientId}/vitals`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Vital signs recorded successfully!');
      setVitalSign({ temperature: '', bloodPressure: '', heartRate: '', respiratoryRate: '', oxygenSaturation: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['nurseAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['nursingRecentActivity'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to record vital signs')
  });

  if (!selectedPatientId || !selectedPatient) {
    return (
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] h-full flex flex-col justify-center">
        <CustomEmptyState 
          icon={UserSearch} 
          title="No Patient Selected" 
          description="Select an assigned patient from the list on the left to view records and log triage vitals." 
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto space-y-6">
      <PatientProfileCard patient={{ firstName: selectedPatient.patientName.split(' ')[0], lastName: selectedPatient.patientName.split(' ')[1] || '', age: selectedPatient.age, id: selectedPatient.patientId }} />
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex-1 p-6">
        <h2 className="font-bold text-[16px] text-slate-900 flex items-center gap-3 m-0 mb-6">
          <Activity className="w-5 h-5 text-indigo-600" /> Record Vital Signs
        </h2>
        <form onSubmit={e => { e.preventDefault(); recordVitals.mutate(vitalSign); }} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Temperature (°C)" required id="temp"><input id="temp" type="number" step="0.1" className="input-field" value={vitalSign.temperature} onChange={e => setVitalSign({...vitalSign, temperature: e.target.value})} placeholder="e.g. 37.2" required /></FormField>
            <FormField label="Blood Pressure (mmHg)" required id="bp"><input id="bp" type="text" className="input-field" value={vitalSign.bloodPressure} onChange={e => setVitalSign({...vitalSign, bloodPressure: e.target.value})} placeholder="e.g. 120/80" required /></FormField>
            <FormField label="Heart Rate (bpm)" required id="hr"><input id="hr" type="number" className="input-field" value={vitalSign.heartRate} onChange={e => setVitalSign({...vitalSign, heartRate: e.target.value})} placeholder="e.g. 72" required /></FormField>
            <FormField label="Respiratory Rate (bpm)" required id="rr"><input id="rr" type="number" className="input-field" value={vitalSign.respiratoryRate} onChange={e => setVitalSign({...vitalSign, respiratoryRate: e.target.value})} placeholder="e.g. 16" required /></FormField>
            <FormField label="Oxygen Saturation SpO2 (%)" required id="spo2"><input id="spo2" type="number" step="0.1" className="input-field" value={vitalSign.oxygenSaturation} onChange={e => setVitalSign({...vitalSign, oxygenSaturation: e.target.value})} placeholder="e.g. 98" required /></FormField>
          </div>
          <FormField label="Clinical Nursing Notes" id="notes"><textarea id="notes" className="input-field" rows={3} value={vitalSign.notes} onChange={e => setVitalSign({...vitalSign, notes: e.target.value})} placeholder="Observe patient symptoms, medication tolerance, or triage notes..." /></FormField>
          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={recordVitals.isPending} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
              {recordVitals.isPending ? 'Saving...' : 'Save Vitals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const NurseRecentActivityWidget = ({ recentActivity, isActivityLoading }) => (
  <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] h-full flex flex-col overflow-hidden">
    <div className="px-6 py-5 flex items-center shrink-0">
      <h2 className="font-bold text-[16px] text-slate-900 flex items-center gap-3 m-0">
        <Activity className="w-5 h-5 text-slate-900" /> Recent Activity
      </h2>
    </div>
    
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      {isActivityLoading ? (
        <Skeleton count={5} variant="line" className="h-12 mb-3" />
      ) : recentActivity?.length === 0 ? (
        <CustomEmptyState 
          icon={Activity} 
          title="No Recent Activity" 
          description="Quiet shift so far. No events to show." 
        />
      ) : (
        <div className="space-y-5 mt-4">
          {recentActivity?.map((act, i) => (
            <div key={i} className="flex gap-4 relative">
              {i !== recentActivity.length - 1 && <div className="absolute left-[13px] top-8 w-[2px] h-10 bg-slate-100"></div>}
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white" style={{ backgroundColor: act.bg || '#f3f4f6', color: act.color || '#3b82f6' }}>
                <Activity size={12} strokeWidth={3} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[13px] font-bold text-slate-900 truncate m-0">{act.title}</p>
                <p className="text-[11px] text-slate-500 m-0 mt-0.5">{act.sub}</p>
              </div>
              <div className="text-[11px] text-slate-400 font-medium pt-0.5">
                {act.time ? new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
