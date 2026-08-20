import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';
import { HeartPulse, AlertTriangle, Save } from 'lucide-react';



const VitalSignsEntry = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId') || '101';
  const [vitals, setVitals] = useState({
    patientId: patientIdFromUrl,
    systolicBp: 120,
    diastolicBp: 80,
    heartRate: 72,
    heightCm: 170,
    weightKg: 70,
    temperatureF: 98.6,
    spo2Percentage: 98,
    respiratoryRate: 16,
    notes: '',
  });

  const abnormalWarnings = useMemo(() => {
    const warnings = [];
    if (vitals.systolicBp > 140 || vitals.systolicBp < 90) warnings.push('Abnormal Systolic BP');
    if (vitals.diastolicBp > 90 || vitals.diastolicBp < 60) warnings.push('Abnormal Diastolic BP');
    if (vitals.heartRate > 100 || vitals.heartRate < 60) warnings.push('Abnormal Heart Rate');
    if (vitals.spo2Percentage < 95) warnings.push('Low SpO2');
    return warnings;
  }, [vitals]);

  const recordVitals = useMutation({
    mutationFn: async () => {
      const payload = {
        heightCm: vitals.heightCm,
        weightKg: vitals.weightKg,
        pulseBpm: vitals.heartRate,
        bloodPressure: `${vitals.systolicBp}/${vitals.diastolicBp}`,
      };
      return axiosPrivate.post(`/patients/${vitals.patientId}/vitals`, payload);
    },
    onSuccess: () => {
      toast.success('Vital signs recorded successfully!');
      queryClient.invalidateQueries(['patient', vitals.patientId]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to record vitals');
    }
  });

  return (
    
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-5 flex items-center gap-2 text-[var(--color-navy-900)]">
        <HeartPulse size={24} className="text-teal-700" aria-hidden="true" /> Record Vital Signs
      </h1>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        
        {abnormalWarnings.length > 0 && (
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md flex flex-col gap-1">
            <div className="flex items-center gap-2 text-amber-800 font-semibold">
              <AlertTriangle size={18} />
              <span>Abnormal Vitals Detected</span>
            </div>
            <ul className="list-disc list-inside text-sm text-amber-700 ml-1">
              {abnormalWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Systolic BP (mmHg)</label>
            <input type="number" value={vitals.systolicBp} onChange={e => setVitals({ ...vitals, systolicBp: +e.target.value })} className="w-full p-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-shadow" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Diastolic BP (mmHg)</label>
            <input type="number" value={vitals.diastolicBp} onChange={e => setVitals({ ...vitals, diastolicBp: +e.target.value })} className="w-full p-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-shadow" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Heart Rate (bpm)</label>
            <input type="number" value={vitals.heartRate} onChange={e => setVitals({ ...vitals, heartRate: +e.target.value })} className="w-full p-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-shadow" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm)</label>
            <input type="number" value={vitals.heightCm} onChange={e => setVitals({ ...vitals, heightCm: +e.target.value })} className="w-full p-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-shadow" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
            <input type="number" value={vitals.weightKg} onChange={e => setVitals({ ...vitals, weightKg: +e.target.value })} className="w-full p-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-shadow" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">SpO2 (%)</label>
            <input type="number" value={vitals.spo2Percentage} onChange={e => setVitals({ ...vitals, spo2Percentage: +e.target.value })} className="w-full p-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-shadow" />
          </div>
        </div>

        <button 
          onClick={() => recordVitals.mutate()} 
          disabled={recordVitals.isPending}
          className="bg-teal-700 hover:bg-teal-800 text-white border-none py-2 px-6 rounded-lg font-bold cursor-pointer flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Save size={16} /> {recordVitals.isPending ? 'Saving...' : 'Save Vitals'}
        </button>
      </div>
    </div>
    
  );
};

export default VitalSignsEntry;
