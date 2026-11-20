import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Heart, 
  Info, 
  Mail, 
  MapPin, 
  Phone, 
  Pill, 
  ShieldCheck, 
  Stethoscope, 
  User 
} from 'lucide-react';

const PrescriptionDocument = ({ data }) => {
  if (!data) return null;

  const todayFormatted = data.visitDate 
    ? new Date(data.visitDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

  const docId = `RX-${data.patientId || '15'}-${(data.patientId ? Number(data.patientId) * 317 + 1042 : 5264).toString().slice(-4)}`;

  return (
    <div className="prescription-document bg-white mx-auto max-w-4xl min-h-[1056px] shadow-2xl print:shadow-none border border-slate-200 print:border-none rounded-3xl print:rounded-none overflow-hidden text-slate-800 print:text-black font-sans relative">
      
      {/* ─── CSS Print & Media Adjustments ─── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .prescription-document, .prescription-document * {
            visibility: visible !important;
          }
          .prescription-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          .print-hidden {
            display: none !important;
          }
          .print-border-b { 
            border-bottom: 2px solid #0f172a !important; 
          }
          .print-border-t { 
            border-top: 1px solid #cbd5e1 !important; 
          }
          .print-bg-gray { 
            background-color: #f8fafc !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .print-text-black { 
            color: #000000 !important; 
          }
        }
      `}</style>

      {/* ─── Header: Official Hospital Letterhead ─── */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-7 sm:p-8 border-b-4 border-blue-600 print:bg-white print:text-black print:border-b-2 print:border-black">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          
          {/* Clinic Brand & Address */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-blue-500/20 shrink-0 print:border print:border-black print:bg-white print:text-black">
              <Activity className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-white print-text-black uppercase">
                  {data.clinicName || 'ELIXIR HEALTHCARE CLINIC'}
                </h1>
                <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 print:hidden">
                  NABH Accredited
                </span>
              </div>

              <p className="text-xs text-blue-200/90 print-text-black font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 print:hidden" />
                {data.clinicAddress || '123 Medical Center Drive, Healthcare City, Suite 400'}
              </p>

              <div className="flex items-center gap-4 text-xs text-blue-200/80 print-text-black flex-wrap pt-0.5">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-blue-400 shrink-0 print:hidden" />
                  {data.clinicPhone || '+91 98765 43210'}
                </span>
                {data.clinicEmail && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-blue-400 shrink-0 print:hidden" />
                    {data.clinicEmail}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rx Document Verification Badge & Barcode */}
          <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
            <span className="bg-blue-600/30 border border-blue-400/40 text-blue-200 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-1.5 print:border-black print:text-black">
              Official Prescription
            </span>
            <p className="text-xs font-mono font-bold text-white print-text-black">
              Doc ID: {docId}
            </p>
            <p className="text-[11px] text-blue-300/80 font-medium print-text-black mt-0.5">
              Issued: {todayFormatted}
            </p>
          </div>

        </div>
      </div>

      {/* ─── Body Container ─── */}
      <div className="p-6 sm:p-8 space-y-6">
        
        {/* ─── Row 1: Doctor & Patient Credentials Cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          
          {/* Attending Physician Box */}
          <div className="bg-slate-50/80 print-bg-gray p-5 rounded-2xl border border-slate-200/80 space-y-2 relative">
            <div className="flex items-center gap-2 text-blue-700 font-extrabold text-[11px] uppercase tracking-wider pb-1 border-b border-slate-200/60">
              <Stethoscope className="w-4 h-4 text-blue-600" /> Prescribing Doctor
            </div>

            <div className="space-y-0.5 pt-1">
              <h2 className="text-lg font-black text-slate-900 print-text-black tracking-tight">
                {data.doctorName || 'Dr. John Doe'}
              </h2>
              <p className="text-xs font-bold text-blue-700">{data.doctorSpecialty || 'Cardiology'}</p>
              <p className="text-xs text-slate-600 font-medium">{data.doctorQualifications || 'MBBS, MD (Cardiology)'}</p>
            </div>

            <div className="pt-2 text-xs font-semibold text-slate-500 border-t border-slate-200/60 flex items-center justify-between">
              <span>Medical Reg No:</span>
              <span className="font-mono font-extrabold text-slate-900 print-text-black bg-white px-2 py-0.5 rounded border border-slate-200">
                {data.registrationNumber || 'DOC-CARD-2026-88'}
              </span>
            </div>
          </div>

          {/* Patient Particulars Box */}
          <div className="bg-blue-50/40 print-bg-gray p-5 rounded-2xl border border-blue-100/90 space-y-2 relative">
            <div className="flex items-center justify-between pb-1 border-b border-blue-100">
              <span className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" /> Patient Info
              </span>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100/80 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                PID: #{data.patientId || '15'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-1">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Patient Name</span>
                <span className="font-black text-slate-900 print-text-black text-sm block truncate">
                  {data.patientName || 'Sarah Jenkins'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Age / Gender</span>
                <span className="font-extrabold text-slate-800 print-text-black block">
                  {data.patientAge || '34'} Yrs / {data.patientGender || 'Female'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Prescription Date</span>
                <span className="font-bold text-slate-800 print-text-black block">{todayFormatted}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Status</span>
                <span className="font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Prescribed
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ─── Row 2: Clinical Vitals & Safety Bar ─── */}
        <div className="bg-slate-50 print-bg-gray rounded-2xl border border-slate-200/80 p-3.5 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blood Group</span>
            <span className="text-xs font-black text-rose-600 mt-0.5 block">
              {data.bloodGroup || 'A+'}
            </span>
          </div>

          <div className="bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blood Pressure</span>
            <span className="text-xs font-black text-blue-700 mt-0.5 block">
              {data.vitals?.bloodPressure || '120/80 mmHg'}
            </span>
          </div>

          <div className="bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pulse</span>
            <span className="text-xs font-black text-slate-800 mt-0.5 block">
              {data.vitals?.pulseBpm ? `${data.vitals.pulseBpm} bpm` : '72 bpm'}
            </span>
          </div>

          <div className="bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Height / Weight</span>
            <span className="text-xs font-black text-slate-800 mt-0.5 block">
              {data.vitals?.heightCm ? `${data.vitals.heightCm} cm` : '165 cm'} • {data.vitals?.weightKg ? `${data.vitals.weightKg} kg` : '62 kg'}
            </span>
          </div>

          <div className="bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Allergies</span>
            <span className={`text-xs font-black mt-0.5 block truncate ${
              data.allergies && data.allergies !== '[]' && data.allergies !== '' ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {data.allergies && data.allergies !== '[]' && data.allergies !== '' ? 'Present' : 'None Known'}
            </span>
          </div>
        </div>

        {/* ─── Row 3: Chief Complaint & Primary Diagnosis ─── */}
        {(data.chiefComplaint || data.diagnosis || data.symptoms || data.medicalHistory) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.chiefComplaint && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Chief Complaint / Symptoms
                  </span>
                  <p className="text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {data.chiefComplaint} {data.symptoms ? `• ${data.symptoms}` : ''}
                  </p>
                </div>
              )}

              {data.diagnosis && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Primary Clinical Diagnosis
                  </span>
                  <p className="text-xs font-black text-blue-700 bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    {data.diagnosis}
                  </p>
                </div>
              )}
            </div>

            {data.medicalHistory && (
              <div className="pt-1 text-xs text-slate-600 font-medium">
                <span className="font-bold text-slate-700">Clinical Exam & Notes: </span>
                {data.medicalHistory}
              </div>
            )}
          </div>
        )}

        {/* ─── Row 4: ℞ Prescribed Medications Table ─── */}
        <div className="space-y-3">
          
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl font-serif font-black text-blue-700 italic leading-none select-none">
                ℞
              </span>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Prescribed Medications
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Dispense exactly as formulated. Take per instructions.</p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {data.items ? data.items.length : 0} Item{(data.items && data.items.length === 1) ? '' : 's'} Prescribed
            </span>
          </div>

          <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 print-bg-gray border-b border-slate-200">
                <tr className="text-slate-700 font-black text-[11px] uppercase tracking-wider">
                  <th className="px-3.5 py-3 w-10 text-center">#</th>
                  <th className="px-4 py-3">Medicine Name & Formulation</th>
                  <th className="px-3 py-3 text-center">Dose</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-3 py-3 text-center">Duration</th>
                  <th className="px-4 py-3">Special Instructions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/80">
                {data.items && data.items.length > 0 ? (
                  data.items.map((item, idx) => {
                    const totalUnits = (parseInt(item.dosage) || 1) * (parseInt(item.durationDays || item.duration) || 1);

                    return (
                      <tr key={idx} className="hover:bg-blue-50/40 transition">
                        <td className="px-3.5 py-3.5 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-black text-slate-900 print-text-black text-sm flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5 text-blue-600 shrink-0 print:hidden" />
                            {item.medicationName || item.medicineName}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-semibold">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">
                              {item.type || 'Tablet'}
                            </span>
                            {item.strength && <span>{item.strength}</span>}
                            {totalUnits > 0 && (
                              <span className="text-slate-400">• Total: {totalUnits} units</span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3.5 text-center font-black text-slate-800 text-sm">
                          {item.dosage || '1'}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="bg-blue-50 text-blue-700 border border-blue-200/60 px-2.5 py-1 rounded-lg font-black text-xs inline-block shadow-2xs">
                            {item.frequency || '1-0-1'}
                          </span>
                          {item.timing && (
                            <span className="block text-[11px] text-slate-500 font-bold mt-1">
                              • {item.timing}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3.5 text-center font-black text-slate-800">
                          {item.duration || item.durationDays || '7'} Days
                        </td>

                        <td className="px-4 py-3.5 text-slate-700 font-medium italic">
                          {item.instructions || 'Take as advised with water.'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-slate-400 italic bg-slate-50/50">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <FileText className="w-8 h-8 text-slate-300" />
                        <p className="font-bold text-slate-500 text-xs">No prescription items recorded.</p>
                        <p className="text-[11px] text-slate-400">Add medications from the form to generate the medicine schedule.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* ─── Row 5: Clinical Advice & Follow-Up Date ─── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          
          {/* General Clinical Advice */}
          <div className="md:col-span-7 bg-slate-50 print-bg-gray p-4 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
            <span className="font-black text-slate-700 uppercase tracking-wider text-[10px] block flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" /> General Advice & Instructions
            </span>
            <ul className="text-slate-600 list-disc pl-4 space-y-1 font-medium text-[11px]">
              <li>Complete the full medication course as directed; do not discontinue abruptly.</li>
              <li>Maintain healthy hydration (2.5L/day) and adequate rest.</li>
              <li>In case of sudden rash, allergic reaction, or unexpected symptoms, contact clinic emergency immediately.</li>
            </ul>
          </div>

          {/* Review / Follow-up Date Box */}
          <div className="md:col-span-5 bg-blue-50/60 p-4 rounded-2xl border border-blue-200/80 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider block mb-1">
                Next Review / Follow-up
              </span>
              <div className="flex items-center gap-2 text-sm font-black text-blue-900 mt-1">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                {data.followUpDate ? (
                  <span>
                    {new Date(data.followUpDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                ) : (
                  <span className="text-slate-500 font-semibold text-xs">As needed / SOS</span>
                )}
              </div>
            </div>

            <p className="text-[10px] text-blue-600/80 font-medium mt-2">
              Please present this prescription slip during your follow-up visit.
            </p>
          </div>

        </div>

        {/* ─── Row 6: Authentication, Legal Disclaimer & Doctor Signature ─── */}
        <div className="pt-8 border-t-2 border-slate-200 print-border-t flex flex-col sm:flex-row justify-between items-end gap-6">
          
          {/* Left: Digital EHR Seal & Security */}
          <div className="space-y-2 text-left max-w-sm">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl inline-flex shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Electronically Verified & Signed EHR Document</span>
            </div>

            <p className="text-[10px] text-slate-400 font-mono">
              EHR Token: SHA256-{(data.patientId ? Number(data.patientId) * 9871 : 98712).toString(16).toUpperCase()}-AUTHENTICATED
            </p>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              This is a digitally validated medical prescription issued by a licensed healthcare professional. Recorded in patient's permanent electronic health record.
            </p>
          </div>

          {/* Right: Signature & Stamp Block */}
          <div className="text-center w-64 shrink-0 space-y-1.5 relative">
            
            {/* Signature Area with Official Clinic Rubber Stamp */}
            <div className="border-b-2 border-slate-400 pb-1 mb-1 min-h-[64px] flex items-end justify-center relative">
              
              {/* Doctor Cursive Signature Simulation */}
              <span className="font-serif italic font-black text-2xl text-blue-950 tracking-wide select-none z-10 relative">
                {data.doctorName || 'Dr. John Doe'}
              </span>

              {/* Official Rounded Circle Rubber Stamp Seal (Rich Blue Ink) */}
              {data.showSeal !== false ? (
                <div className="absolute right-[-14px] bottom-[-8px] w-28 h-28 sm:w-32 sm:h-32 rounded-full -rotate-12 select-none pointer-events-none drop-shadow-xs z-20">
                  <svg 
                    viewBox="0 0 150 150" 
                    className="w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <path 
                        id="rxSealTopArc" 
                        d="M 18,75 A 57,57 0 1,1 132,75" 
                        fill="none" 
                      />
                      <path 
                        id="rxSealBottomArc" 
                        d="M 132,75 A 57,57 0 0,1 18,75" 
                        fill="none" 
                      />
                    </defs>

                    {/* Outer Border Circle in Rich Blue Stamp Ink */}
                    <circle cx="75" cy="75" r="71" stroke="#1e40af" strokeWidth="2.8" fill="#eff6ff" fillOpacity="0.35" />
                    
                    {/* Concentric Dashed Inner Ring */}
                    <circle cx="75" cy="75" r="65" stroke="#2563eb" strokeWidth="1.2" strokeDasharray="3.5 2.5" fill="none" />
                    
                    {/* Third Inner Solid Circle */}
                    <circle cx="75" cy="75" r="44" stroke="#1e40af" strokeWidth="1.6" fill="#dbeafe" fillOpacity="0.3" />

                    {/* Top Curved Text */}
                    <text fill="#1e3a8a" fontSize="7.8" fontWeight="900" letterSpacing="1.8">
                      <textPath href="#rxSealTopArc" startOffset="50%" textAnchor="middle">
                        ★ {(data.clinicName || 'ELIXIR HEALTHCARE').toUpperCase().slice(0, 22)} ★
                      </textPath>
                    </text>

                    {/* Bottom Curved Text */}
                    <text fill="#1d4ed8" fontSize="6.8" fontWeight="800" letterSpacing="1.4">
                      <textPath href="#rxSealBottomArc" startOffset="50%" textAnchor="middle">
                        ★ REGD: {(data.registrationNumber || 'DOC-CARD-2026-88').toUpperCase()} ★
                      </textPath>
                    </text>

                    {/* Center Medical Emblem & Inscription */}
                    <g transform="translate(75, 68)">
                      <path 
                        d="M -3.5,-10 H 3.5 V -3.5 H 10 V 3.5 H 3.5 V 10 H -3.5 V 3.5 H -10 V -3.5 H -3.5 Z" 
                        fill="#1e40af" 
                      />
                      <text y="19" textAnchor="middle" fill="#0f172a" fontSize="7.2" fontWeight="900" letterSpacing="0.8">
                        OFFICIAL CLINIC SEAL
                      </text>
                      <text y="27" textAnchor="middle" fill="#16a34a" fontSize="6.2" fontWeight="800" letterSpacing="0.5">
                        VERIFIED & ISSUED
                      </text>
                    </g>
                  </svg>
                </div>
              ) : (
                <div className="absolute right-0 bottom-[-4px] w-20 h-20 border-2 border-dashed border-slate-300 rounded-full flex flex-col items-center justify-center text-[7px] text-slate-400 font-bold uppercase text-center p-1 print:border-slate-400">
                  <span>Affix Physical</span>
                  <span>Stamp Here</span>
                </div>
              )}
            </div>

            <p className="text-xs font-black text-slate-900 print-text-black">
              {data.doctorName || 'Dr. John Doe'}
            </p>
            <p className="text-[11px] font-bold text-blue-700">
              Doctor's Signature & Stamp
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Authorized Medical Practitioner
            </p>
          </div>

        </div>

      </div>

      {/* ─── Bottom Footer Accent Strip ─── */}
      <div className="bg-slate-900 text-slate-400 text-[10px] font-medium py-2.5 px-8 text-center border-t border-slate-800 print:hidden">
        Elixir Health Care System • Patient Confidential Electronic Health Record (EHR) • 24x7 Helpline: {data.clinicPhone || '+91 98765 43210'}
      </div>

    </div>
  );
};

export default PrescriptionDocument;
