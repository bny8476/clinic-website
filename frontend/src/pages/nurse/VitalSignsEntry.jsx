import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { AlertTriangle, HeartPulse, Heart, Stethoscope, Ruler, Scale, Droplet, Save, CheckCircle2 } from 'lucide-react';

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
    spo2Percentage: 98,
    temperatureF: 98.6,
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
      queryClient.invalidateQueries({ queryKey: ['patient', vitals.patientId] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to record vitals');
    }
  });

  const InputGroup = ({ label, unit, icon: Icon, value, onChange, type = "number" }) => (
    <div className="flex flex-col gap-2">
      <label className="text-[14px] font-bold text-slate-900">
        {label} <span className="text-[#2160FF] font-medium">({unit})</span>
      </label>
      <div className="flex items-center h-[52px] border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#2160FF] focus-within:ring-2 focus-within:ring-[#2160FF]/10 transition-all bg-white">
        <div className="h-full w-[52px] bg-blue-50 flex items-center justify-center border-r border-blue-100 flex-shrink-0">
          <Icon className="w-5 h-5 text-[#2160FF]" strokeWidth={2} />
        </div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          className="flex-1 h-full px-4 text-[15px] font-medium text-slate-800 outline-none w-full bg-transparent"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-[#F4F7FB] p-6 lg:p-10 w-full font-sans">
      <div className="max-w-[1000px] mx-auto space-y-6">
        
        {/* Main Card */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 lg:p-10">
          
          {/* Header */}
          <div className="flex items-start gap-5 pb-8 border-b border-gray-100 mb-8">
            <div className="p-4 bg-blue-50 rounded-2xl flex-shrink-0 border border-blue-100">
              <HeartPulse className="w-8 h-8 text-[#2160FF]" strokeWidth={2.5} />
            </div>
            <div className="pt-1">
              <h1 className="text-[28px] font-extrabold text-slate-900 mb-1 tracking-tight">Record Vital Signs</h1>
              <p className="text-[15px] text-gray-500 font-medium">Enter and save the patient's vital sign measurements.</p>
            </div>
          </div>

          {abnormalWarnings.length > 0 && (
            <div className="mb-8 bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span>Abnormal Vitals Detected</span>
              </div>
              <ul className="list-disc list-inside text-sm text-amber-700 ml-1 font-medium space-y-1">
                {abnormalWarnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {/* Vitals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10">
            <InputGroup 
              label="Systolic BP" 
              unit="mmHg" 
              icon={Stethoscope} 
              value={vitals.systolicBp} 
              onChange={e => setVitals({ ...vitals, systolicBp: +e.target.value })} 
            />
            <InputGroup 
              label="Diastolic BP" 
              unit="mmHg" 
              icon={Stethoscope} 
              value={vitals.diastolicBp} 
              onChange={e => setVitals({ ...vitals, diastolicBp: +e.target.value })} 
            />
            <InputGroup 
              label="Heart Rate" 
              unit="bpm" 
              icon={Heart} 
              value={vitals.heartRate} 
              onChange={e => setVitals({ ...vitals, heartRate: +e.target.value })} 
            />
            <InputGroup 
              label="Height" 
              unit="cm" 
              icon={Ruler} 
              value={vitals.heightCm} 
              onChange={e => setVitals({ ...vitals, heightCm: +e.target.value })} 
            />
            <InputGroup 
              label="Weight" 
              unit="kg" 
              icon={Scale} 
              value={vitals.weightKg} 
              onChange={e => setVitals({ ...vitals, weightKg: +e.target.value })} 
            />
            <InputGroup 
              label="SpO2" 
              unit="%" 
              icon={Droplet} 
              value={vitals.spo2Percentage} 
              onChange={e => setVitals({ ...vitals, spo2Percentage: +e.target.value })} 
            />
          </div>

          {/* Footer Area */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pt-8 border-t border-gray-100">
            <button 
              onClick={() => recordVitals.mutate()} 
              disabled={recordVitals.isPending}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#2160FF] hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all border-0 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: '#2160FF' }}
            >
              <Save className="w-5 h-5" /> 
              {recordVitals.isPending ? 'Saving...' : 'Save Vitals'}
            </button>
            <div className="flex items-center gap-2 text-slate-500 font-medium text-[14.5px]">
              <CheckCircle2 className="w-4 h-4 text-[#2160FF]" />
              Your data is saved securely.
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default VitalSignsEntry;
