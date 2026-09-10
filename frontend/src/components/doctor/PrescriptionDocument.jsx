import React from 'react';
import { Activity, Calendar, CheckCircle2, Heart, Phone, ShieldCheck, Stethoscope, User } from 'lucide-react';

const PrescriptionDocument = ({ data }) => {
  if (!data) return null;

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="prescription-document bg-white mx-auto max-w-4xl min-h-[1056px] shadow-lg print:shadow-none border border-slate-200 print:border-none rounded-2xl print:rounded-none overflow-hidden text-slate-800 print:text-black font-sans relative">
      
      {/* CSS Print Adjustments */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .prescription-document, .prescription-document * {
            visibility: visible;
          }
          .prescription-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-border-b { border-bottom: 2px solid #000 !important; }
          .print-border-t { border-top: 1px solid #000 !important; }
          .print-bg-gray { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-text-black { color: #000 !important; }
        }
      `}</style>

      {/* Top Clinic Header Bar */}
      <div className="p-8 pb-6 border-b-4 border-blue-600 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex justify-between items-start print:bg-white print:text-black print:border-b-2 print:border-black">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-md shadow-blue-500/20 flex-shrink-0 print:border print:border-black">
            <Activity className="w-9 h-9" />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white print-text-black">
              {data.clinicName || 'ELIXIR HEALTH CARE CLINIC'}
            </h1>
            <p className="text-xs text-blue-200 print-text-black mt-0.5 font-medium">
              {data.clinicAddress || '123 Medical Center Drive, Healthcare City, Suite 400'}
            </p>
            <p className="text-xs text-blue-200 print-text-black mt-0.5">
              Phone: {data.clinicPhone || '+91 98765 43210'} {data.clinicEmail ? ` | Email: ${data.clinicEmail}` : ''}
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider block mb-1">
            OFFICIAL PRESCRIPTION
          </span>
          <p className="text-[11px] text-slate-300 font-mono">Doc ID: RX-{data.patientId || '14'}-{Date.now().toString().slice(-4)}</p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        
        {/* Doctor and Patient Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          
          {/* Doctor Info Box */}
          <div className="bg-slate-50 print-bg-gray p-5 rounded-2xl border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Stethoscope className="w-4 h-4" /> Prescribing Doctor
            </div>
            <h2 className="text-lg font-black text-slate-900 print-text-black">
              {data.doctorName || 'Dr. Practitioner'}
            </h2>
            <p className="text-xs font-bold text-blue-700">{data.doctorSpecialty || 'General Physician'}</p>
            <p className="text-xs text-slate-600 font-medium">{data.doctorQualifications || 'MBBS, MD'}</p>
            {data.registrationNumber && (
              <p className="text-xs font-bold text-slate-500 mt-2">
                Medical Reg No: <span className="text-slate-800 font-mono">{data.registrationNumber}</span>
              </p>
            )}
          </div>

          {/* Patient Details Box */}
          <div className="bg-blue-50/50 print-bg-gray p-5 rounded-2xl border border-blue-100/80 space-y-2">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
              <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Patient Info
              </span>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                PID: #{data.patientId || 14}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-xs font-medium">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Name</span>
                <span className="font-extrabold text-slate-900 print-text-black text-sm">{data.patientName || 'Patient'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Age / Gender</span>
                <span className="font-bold text-slate-800 print-text-black">{data.patientAge || 'N/A'} Yrs / {data.patientGender || 'Male'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Prescription Date</span>
                <span className="font-bold text-slate-800 print-text-black">{todayFormatted}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Prescribed
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Clinical Symptoms & Diagnosis */}
        {(data.chiefComplaint || data.diagnosis) && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.chiefComplaint && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Chief Complaint
                </h3>
                <p className="text-xs font-bold text-slate-800">{data.chiefComplaint}</p>
              </div>
            )}
            {data.diagnosis && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Primary Diagnosis
                </h3>
                <p className="text-xs font-bold text-blue-700">{data.diagnosis}</p>
              </div>
            )}
          </div>
        )}

        {/* Rx Section Header & Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-2">
            <span className="text-4xl font-serif font-black text-blue-600 italic leading-none">Rx</span>
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Prescribed Medications</span>
          </div>

          <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 print-bg-gray border-b border-slate-200">
                <tr className="text-slate-700 font-extrabold">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Medicine Name & Form</th>
                  <th className="px-4 py-3">Dose</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.items && data.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-extrabold text-slate-900 print-text-black text-sm">
                        {item.medicationName || item.medicineName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {item.type || 'Tablet'} {item.strength ? `• ${item.strength}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-slate-800">{item.dosage || '1'}</td>
                    <td className="px-4 py-3.5">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-extrabold text-xs inline-block">
                        {item.frequency || '1-0-1'}
                      </span>
                      {item.timing && (
                        <span className="block text-[11px] text-slate-500 font-medium mt-1">
                          {item.timing}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-slate-800">{item.duration || item.durationDays || '7'} Days</td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">{item.instructions || 'Take as advised'}</td>
                  </tr>
                ))}

                {(!data.items || data.items.length === 0) && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-400 italic">
                      No prescription items recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Document Footer: Follow-up & Signature */}
        <div className="pt-10 print-border-t border-t border-slate-200 flex justify-between items-end">
          <div className="space-y-2">
            {data.followUpDate && (
              <div className="flex items-center gap-2 text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 inline-flex">
                <Calendar className="w-4 h-4 text-blue-600" />
                Follow-up Date: {new Date(data.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            )}

            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Electronically Verified & Signed EHR Document</span>
            </div>
          </div>

          <div className="text-center w-56 space-y-1">
            <div className="border-b-2 border-slate-400 mb-2 h-14 flex items-end justify-center pb-1">
              <span className="font-serif italic font-bold text-blue-900 text-base">{data.doctorName || 'Dr. Practitioner'}</span>
            </div>
            <p className="text-xs font-black text-slate-900 print-text-black">Doctor's Signature & Stamp</p>
            <p className="text-[10px] text-slate-400 font-medium">Authorized Practitioner</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrescriptionDocument;
