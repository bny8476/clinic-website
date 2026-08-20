
const PrescriptionDocument = ({ data }) => {
  if (!data) return null;

  return (
    <div className="prescription-document bg-white mx-auto max-w-4xl min-h-[1056px] shadow-sm print:shadow-none border border-slate-200 print:border-none rounded-lg print:rounded-none overflow-hidden text-slate-800 print:text-black">
      {/* Print-specific styles using Tailwind */}
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
            border: none;
            box-shadow: none;
            padding: 0;
            margin: 0;
          }
          /* Force colors for print */
          .print-border-b { border-bottom: 2px solid #000 !important; }
          .print-border-t { border-top: 1px solid #000 !important; }
          .print-bg-gray { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-text-black { color: #000 !important; }
        }
      `}</style>

      {/* Header: Clinic Logo & Details */}
      <div className="p-8 pb-4 print-border-b border-b-2 border-indigo-600 flex justify-between items-start">
        <div className="flex gap-4">
          {/* Logo Placeholder - gracefully falls back to text if no image is present */}
          <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-300 print-bg-gray print-text-black">
            {/* When logo is available: <img loading="lazy" src={clinicLogoUrl} alt="Clinic Logo" className="object-contain" /> */}
            <Activity className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 print-text-black tracking-tight">{data.clinicName || 'City General Hospital'}</h1>
            <p className="text-sm text-slate-600 mt-1">{data.clinicAddress || '123 Medical Center Drive, Healthcare City, HC 12345'}</p>
            <p className="text-sm text-slate-600">Phone: {data.clinicPhone || '+1 (555) 123-4567'} {data.clinicEmail ? `| Email: ${data.clinicEmail}` : ''}</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Doctor and Patient Info Block */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-lg font-bold text-slate-900 print-text-black mb-1">{data.doctorName || 'Dr. Unknown'}</h2>
            <p className="text-sm text-slate-700">{data.doctorSpecialty || 'General Practitioner'}</p>
            <p className="text-sm text-slate-600">{data.doctorQualifications}</p>
            {data.registrationNumber && (
              <p className="text-sm font-medium text-slate-600 mt-1">Reg No: {data.registrationNumber}</p>
            )}
          </div>
          <div className="bg-slate-50 print-bg-gray p-4 rounded-lg border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Patient Details</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-slate-500">Name:</div>
              <div className="font-medium text-slate-900 print-text-black">{data.patientName || 'Unknown Patient'}</div>
              <div className="text-slate-500">Age/Sex:</div>
              <div className="font-medium text-slate-900 print-text-black">{data.patientAge || 'N/A'} / {data.patientGender || 'N/A'}</div>
              <div className="text-slate-500">Patient ID:</div>
              <div className="font-medium text-slate-900 print-text-black">{data.patientId}</div>
              <div className="text-slate-500">Date:</div>
              <div className="font-medium text-slate-900 print-text-black">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Clinical Notes */}
        <div className="mb-8 space-y-4">
          {data.chiefComplaint && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 print-text-black mb-1 flex items-center gap-2">
                Chief Complaint
              </h3>
              <p className="text-sm text-slate-700">{data.chiefComplaint}</p>
            </div>
          )}
          {data.diagnosis && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 print-text-black mb-1 flex items-center gap-2">
                Diagnosis
              </h3>
              <p className="text-sm text-slate-700">{data.diagnosis}</p>
            </div>
          )}
        </div>

        {/* Rx Section */}
        <div className="mb-8">
          <div className="text-4xl font-serif font-bold text-slate-800 print-text-black mb-4 flex items-center gap-3">
            <span className="italic">Rx</span>
          </div>
          
          <div className="overflow-hidden border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 print-bg-gray border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-900 print-text-black">Medicine</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 print-text-black">Dosage</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 print-text-black">Frequency</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 print-text-black">Duration</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 print-text-black">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.items && data.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 print-text-black">{item.medicationName}</div>
                      <div className="text-xs text-slate-500">{item.type} {item.strength ? `• ${item.strength}` : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.dosage}</td>
                    <td className="px-4 py-3 text-slate-700">{item.frequency} <br/><span className="text-xs text-slate-500">{item.timing}</span></td>
                    <td className="px-4 py-3 text-slate-700">{item.duration}</td>
                    <td className="px-4 py-3 text-slate-700">{item.instructions}</td>
                  </tr>
                ))}
                {(!data.items || data.items.length === 0) && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500 italic">No medicines prescribed</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-16 pt-8 print-border-t border-t border-slate-200 flex justify-between items-end">
          <div>
            {data.followUpDate && (
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Follow-up Date: {new Date(data.followUpDate).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="text-center w-48">
            <div className="border-b border-slate-400 mb-2 h-12"></div>
            <p className="text-sm font-medium text-slate-900 print-text-black">Doctor's Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionDocument;
