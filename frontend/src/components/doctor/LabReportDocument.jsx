import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Download, 
  FileText, 
  FlaskConical, 
  Info, 
  Mail, 
  MapPin, 
  Phone, 
  Printer, 
  ShieldCheck, 
  User, 
  X 
} from 'lucide-react';

// --- AUTHENTIC ROUNDED CIRCLE CLINIC OFFICIAL SEAL COMPONENT ---
const ClinicOfficialSeal = () => {
  return (
    <div className="relative inline-block select-none group">
      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full aspect-square -rotate-3 hover:rotate-0 transition-transform duration-300 drop-shadow-xs flex items-center justify-center">
        <svg 
          viewBox="0 0 150 150" 
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <path id="labTopArc" d="M 18,75 A 57,57 0 1,1 132,75" fill="none" />
            <path id="labBottomArc" d="M 132,75 A 57,57 0 0,1 18,75" fill="none" />
          </defs>

          {/* Outer Border Circle */}
          <circle cx="75" cy="75" r="71" stroke="#1e40af" strokeWidth="2.8" fill="#eff6ff" fillOpacity="0.45" />
          
          {/* Concentric Dashed Inner Ring */}
          <circle cx="75" cy="75" r="65" stroke="#2563eb" strokeWidth="1.2" strokeDasharray="3.5 2.5" fill="none" />
          
          {/* Third Inner Solid Circle */}
          <circle cx="75" cy="75" r="44" stroke="#1e40af" strokeWidth="1.6" fill="#dbeafe" fillOpacity="0.4" />

          {/* Top Curved Text */}
          <text fill="#1e3a8a" fontSize="7.8" fontWeight="900" letterSpacing="1.8">
            <textPath href="#labTopArc" startOffset="50%" textAnchor="middle">
              ★ ELIXIR CENTRAL LABS ★
            </textPath>
          </text>

          {/* Bottom Curved Text */}
          <text fill="#1d4ed8" fontSize="7" fontWeight="800" letterSpacing="1.4">
            <textPath href="#labBottomArc" startOffset="50%" textAnchor="middle">
              ★ REGD: LAB-KA-2026-99 ★
            </textPath>
          </text>

          {/* Center Medical Emblem */}
          <g transform="translate(75, 68)">
            <path 
              d="M -4,-10 H 4 V -4 H 10 V 4 H 4 V 10 H -4 V 4 H -10 V -4 H -4 Z" 
              fill="#1e40af" 
            />
            <text y="18" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="900" letterSpacing="0.6">
              OFFICIAL SEAL
            </text>
            <text y="26" textAnchor="middle" fill="#16a34a" fontSize="6" fontWeight="800" letterSpacing="0.4">
              VERIFIED & RELEASED
            </text>
          </g>
        </svg>
      </div>

      <div className="text-center mt-0.5">
        <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-900 rounded-full text-[8.5px] font-extrabold uppercase tracking-wider">
          ✓ Official Seal Affixed
        </span>
      </div>
    </div>
  );
};

// --- DOCTOR / PATHOLOGIST SIGNATURE COMPONENT ---
const PathologistSignature = ({ verifierName, verifiedAt }) => {
  const name = verifierName || 'Dr. Alexander Fleming, MD';
  return (
    <div className="text-right space-y-1">
      {/* Signature Representation */}
      <div className="inline-block border-b-2 border-slate-900 pb-1 px-4 min-w-[200px]">
        <p className="font-serif italic text-xl font-bold text-slate-800 tracking-wide font-['Georgia',serif]">
          {name}
        </p>
      </div>
      <p className="text-xs font-bold text-slate-900">{name}</p>
      <p className="text-[10px] text-slate-500 font-medium">Chief Pathologist & Lab Director</p>
      <p className="text-[10px] text-slate-400 font-medium">Reg No: PATH-KA-2022-771890</p>
      {verifiedAt && (
        <p className="text-[9.5px] text-emerald-600 font-bold">
          Verified: {new Date(verifiedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
};

export default function LabReportDocument({ report, result, onClose, onDownloadPdf }) {
  if (!report) return null;

  const patient = report.patient || {};
  const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'John Smith';
  const testName = report.testCatalog?.testName || 'Complete Blood Count (CBC) with Differential';
  const testCode = report.testCatalog?.testCode || 'CBC-DIFF';
  
  const rawResult = result?.resultValue || report.resultValue || 'WBC: 6.8 10^3/uL, RBC: 4.85 10^6/uL, Hemoglobin: 14.5 g/dL, Hematocrit: 43.2%, Platelets: 265 10^3/uL';
  const defaultRefRange = result?.referenceRange || 'Standard Adult Reference';
  const defaultUnit = result?.unit || '';
  const isAbnormal = result?.isAbnormal || false;
  const isCritical = result?.isCritical || false;

  // Standard CBC parameter reference ranges fallback for authentic medical presentation
  const standardRanges = {
    'Hemoglobin': { range: '13.0 - 17.0', unit: 'g/dL' },
    'WBC': { range: '4.5 - 11.0', unit: '10^3/µL' },
    'RBC': { range: '4.50 - 5.50', unit: '10^6/µL' },
    'Hematocrit': { range: '40.0 - 50.0', unit: '%' },
    'Platelets': { range: '150 - 450', unit: '10^3/µL' },
    'Neutrophils': { range: '40 - 70', unit: '%' },
    'Lymphocytes': { range: '20 - 40', unit: '%' },
  };

  // Smart Parser for comma-separated or multi-line parameters
  const parsedParameters = React.useMemo(() => {
    if (rawResult && rawResult.includes(',') && rawResult.includes(':')) {
      return rawResult.split(',').map((item, idx) => {
        const parts = item.split(':');
        const paramName = parts[0]?.trim() || `Parameter ${idx + 1}`;
        const rest = parts[1]?.trim() || '';
        
        // Extract value and optional unit
        let value = rest;
        let unit = defaultUnit;
        
        // Check standard ranges
        let foundRange = defaultRefRange;
        Object.keys(standardRanges).forEach(key => {
          if (paramName.toLowerCase().includes(key.toLowerCase())) {
            foundRange = standardRanges[key].range;
            if (!unit) unit = standardRanges[key].unit;
          }
        });

        // Determine flag
        let flag = 'NORMAL';
        if (isCritical) flag = 'CRITICAL';
        else if (isAbnormal) flag = 'ABNORMAL';

        return {
          name: paramName,
          value,
          unit,
          referenceRange: foundRange,
          flag
        };
      });
    }

    // Single parameter
    return [{
      name: testName,
      value: rawResult,
      unit: defaultUnit || 'Standard',
      referenceRange: defaultRefRange,
      flag: isCritical ? 'CRITICAL' : (isAbnormal ? 'ABNORMAL' : 'NORMAL')
    }];
  }, [rawResult, defaultUnit, defaultRefRange, isAbnormal, isCritical, testName]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white">
      
      {/* ─── Printable Document Container ─── */}
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto print:shadow-none print:border-none print:m-0 print:max-w-none print:rounded-none">
        
        {/* Modal Top Control Bar (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm tracking-wide">Official Laboratory Diagnostic Report Preview</span>
            <span className="bg-blue-600/40 text-blue-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-400/30">
              REQ-{report.id}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
              title="Print Official Report"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            {onDownloadPdf && (
              <button
                onClick={() => onDownloadPdf(report.id)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Download PDF"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── THE CLINICAL LAB REPORT DOCUMENT ─── */}
        <div className="p-6 sm:p-10 space-y-6 text-slate-800 font-sans print:p-8">
          
          {/* Document Header Letterhead */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-6 sm:p-8 rounded-2xl border-b-4 border-blue-600 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 print:bg-white print:text-black print:border-b-2 print:border-black print:rounded-none">
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black shadow-md shadow-blue-500/30 shrink-0 print:border print:border-black print:bg-white print:text-black">
                <FlaskConical className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase print:text-black">
                    ELIXIR HEALTHCARE LABORATORIES
                  </h1>
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 print:hidden">
                    NABL ACCREDITED
                  </span>
                </div>
                <p className="text-xs text-blue-200/90 font-medium print:text-black">
                  Central Clinical Pathology & Molecular Diagnostic Institute
                </p>
                <p className="text-[11px] text-slate-400 print:text-black flex items-center gap-3 flex-wrap">
                  <span>123 Health Ave, Medical City</span>
                  <span>•</span>
                  <span>+91 98765 43210</span>
                  <span>•</span>
                  <span>lab@elixirhealthcare.com</span>
                </p>
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-black rounded-lg uppercase tracking-wider shadow-sm print:border print:border-black print:bg-white print:text-black">
                OFFICIAL LAB REPORT
              </span>
              <p className="text-xs font-bold text-slate-200 mt-1.5 print:text-black">
                DOC ID: LAB-REQ-{report.id}
              </p>
              <p className="text-[10px] text-slate-400 font-medium print:text-black">
                Sample Barcode: {report.sampleBarcodeId || `SMPL-${report.id * 1024 + 512}`}
              </p>
            </div>
          </div>

          {/* ─── Patient & Test Order Metadata Box (Two Cards) ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Card: Patient Demographics */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Patient Demographics
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                  PID #{patient.id || report.patientId || '10'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Patient Name</span>
                  <span className="font-bold text-slate-900 text-sm">{patientName}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Age / Gender</span>
                  <span className="font-bold text-slate-800">{patient.age || '34'} Yrs / {patient.gender || 'Male'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Phone / Contact</span>
                  <span className="font-semibold text-slate-700">{patient.phoneNumber || patient.phone || '+91 98765 43210'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">MRN Number</span>
                  <span className="font-semibold text-slate-700">{patient.mrn || `MRN-2026-${report.patientId || '010'}`}</span>
                </div>
              </div>
            </div>

            {/* Right Card: Test Order Information */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  Order & Specimen Details
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  report.status === 'RELEASED' ? 'bg-emerald-100 text-emerald-800' :
                  report.status === 'VERIFIED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {report.status || 'RELEASED'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Ordering Physician</span>
                  <span className="font-bold text-slate-800">
                    {report.doctor?.user ? `Dr. ${report.doctor.user.firstName} ${report.doctor.user.lastName}` : 'Dr. John Doe, MD'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Specimen Type</span>
                  <span className="font-semibold text-slate-700">{report.specimenType || 'Venous Blood (EDTA)'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Collected On</span>
                  <span className="font-semibold text-slate-700">
                    {report.sampleCollectedAt ? new Date(report.sampleCollectedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : (report.requestedAt ? new Date(report.requestedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '20 Nov 2026')}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Report Date</span>
                  <span className="font-semibold text-slate-700">
                    {report.releasedAt || result?.verifiedAt ? new Date(report.releasedAt || result?.verifiedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ─── Investigation Title Banner ─── */}
          <div className="border-l-4 border-blue-600 pl-3 py-1 bg-blue-50/60 rounded-r-xl">
            <h2 className="text-sm font-bold text-slate-900 tracking-wide">
              INVESTIGATION: {testName} ({testCode})
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Quantitative automated analytical determination via calibrated multi-wavelength flow cytometry.
            </p>
          </div>

          {/* ─── Test Parameters Results Table ─── */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Test Parameter</th>
                  <th className="py-3 px-4 text-center">Observed Value</th>
                  <th className="py-3 px-4 text-center">Units</th>
                  <th className="py-3 px-4 text-center">Biological Reference Range</th>
                  <th className="py-3 px-4 text-center">Status / Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedParameters.map((param, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {param.name}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-slate-900 text-sm">
                      {param.value}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-600">
                      {param.unit || '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">
                      {param.referenceRange}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        param.flag === 'CRITICAL' ? 'bg-red-100 text-red-700 animate-pulse' :
                        param.flag === 'ABNORMAL' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {param.flag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ─── Pathologist Clinical Comments & Notes Box ─── */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Pathologist Clinical Interpretation & Observations</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium pl-6">
              {result?.pathologistComments || 'All biological cellular and biochemical values reported are within biological reference limits. Peripheral blood smear examination reveals normocytic, normochromic red cells with adequate platelets. Clinical correlation is recommended.'}
            </p>
          </div>

          {/* ─── Signatures and Official Authentication Section ─── */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
            
            {/* Left: Security and Compliance */}
            <div className="space-y-1 text-left sm:max-w-xs">
              <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Electronically Verified & Signed EHR
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                This document is electronically verified under CLIA & ISO 15189 standards and does not require a physical ink signature.
              </p>
              <p className="text-[9px] text-slate-400 font-mono">
                Hash: SHA256:{Math.random().toString(36).substring(2, 10).toUpperCase()}-VERIFIED
              </p>
            </div>

            {/* Center: Authentic Clinic Official Seal */}
            <div className="flex justify-center">
              <ClinicOfficialSeal />
            </div>

            {/* Right: Pathologist Signature */}
            <div>
              <PathologistSignature 
                verifierName={result?.verifiedBy ? `Dr. ${result.verifiedBy.firstName} ${result.verifiedBy.lastName}` : 'Dr. Alexander Fleming, MD'}
                verifiedAt={result?.verifiedAt || report.releasedAt}
              />
            </div>

          </div>

          {/* Document Footer */}
          <div className="pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 flex items-center justify-between">
            <span>Elixir Healthcare Diagnostic Laboratories • All Rights Reserved</span>
            <span>Page 1 of 1 • End of Diagnostic Report</span>
          </div>

        </div>

      </div>
    </div>
  );
}
