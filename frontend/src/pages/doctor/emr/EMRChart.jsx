import { AlertCircle, Droplet, Activity, Syringe, HeartPulse, ActivitySquare } from 'lucide-react';
import format from 'date-fns/format';

const EMRChart = ({ patientId }) => {
  return (
    <div className="space-y-6">
      
      <HistorySection 
        title="Active Problems"
        endpoint="problems"
        patientId={patientId}
        icon={AlertCircle}
        columns={['Problem', 'ICD-10', 'Status', 'Onset Date']}
        formFields={[
          { name: 'problemName', label: 'Problem Name', required: true },
          { name: 'icd10Code', label: 'ICD-10 Code' },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [{value: 'ACTIVE', label: 'Active'}, {value: 'CHRONIC', label: 'Chronic'}, {value: 'RESOLVED', label: 'Resolved'}] },
          { name: 'onsetDate', label: 'Onset Date', type: 'date' }
        ]}
        renderRow={(r) => (
          <tr key={r.id}>
            <td className="px-4 py-2 font-medium">{r.problemName}</td>
            <td className="px-4 py-2 text-slate-500">{r.icd10Code || '-'}</td>
            <td className="px-4 py-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {r.status}
              </span>
            </td>
            <td className="px-4 py-2 text-slate-500">{r.onsetDate ? format(new Date(r.onsetDate), 'MMM dd, yyyy') : '-'}</td>
          </tr>
        )}
      />

      <HistorySection 
        title="Allergies"
        endpoint="allergys"
        patientId={patientId}
        icon={Droplet}
        columns={['Allergen', 'Type', 'Severity', 'Reaction']}
        formFields={[
          { name: 'allergen', label: 'Allergen', required: true },
          { name: 'allergyType', label: 'Type', type: 'select', required: true, options: [{value: 'DRUG', label: 'Drug'}, {value: 'FOOD', label: 'Food'}, {value: 'ENVIRONMENTAL', label: 'Environmental'}] },
          { name: 'reactionSeverity', label: 'Severity', type: 'select', required: true, options: [{value: 'MILD', label: 'Mild'}, {value: 'MODERATE', label: 'Moderate'}, {value: 'SEVERE', label: 'Severe'}, {value: 'LIFE_THREATENING', label: 'Life Threatening'}] },
          { name: 'reactionDescription', label: 'Reaction Description' },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [{value: 'ACTIVE', label: 'Active'}, {value: 'INACTIVE', label: 'Inactive'}] }
        ]}
        renderRow={(r) => (
          <tr key={r.id} className={r.status === 'INACTIVE' ? 'opacity-50' : ''}>
            <td className="px-4 py-2 font-medium">{r.allergen}</td>
            <td className="px-4 py-2 text-slate-500">{r.allergyType}</td>
            <td className="px-4 py-2 text-red-600 font-medium">{r.reactionSeverity}</td>
            <td className="px-4 py-2 text-slate-500">{r.reactionDescription || '-'}</td>
          </tr>
        )}
      />

      <HistorySection 
        title="Family History"
        endpoint="familyhistoryentrys"
        patientId={patientId}
        icon={HeartPulse}
        columns={['Relationship', 'Condition', 'Notes']}
        formFields={[
          { name: 'relationship', label: 'Relationship', required: true },
          { name: 'condition', label: 'Condition', required: true },
          { name: 'notes', label: 'Notes' }
        ]}
        renderRow={(r) => (
          <tr key={r.id}>
            <td className="px-4 py-2 font-medium">{r.relationship}</td>
            <td className="px-4 py-2 text-slate-500">{r.condition}</td>
            <td className="px-4 py-2 text-slate-500">{r.notes || '-'}</td>
          </tr>
        )}
      />

      <HistorySection 
        title="Surgical History"
        endpoint="surgicalhistoryentrys"
        patientId={patientId}
        icon={Activity}
        columns={['Procedure', 'Date', 'Surgeon', 'Notes']}
        formFields={[
          { name: 'procedureName', label: 'Procedure Name', required: true },
          { name: 'surgeryDate', label: 'Date', type: 'date' },
          { name: 'surgeon', label: 'Surgeon' },
          { name: 'notes', label: 'Notes' }
        ]}
        renderRow={(r) => (
          <tr key={r.id}>
            <td className="px-4 py-2 font-medium">{r.procedureName}</td>
            <td className="px-4 py-2 text-slate-500">{r.surgeryDate ? format(new Date(r.surgeryDate), 'MMM dd, yyyy') : '-'}</td>
            <td className="px-4 py-2 text-slate-500">{r.surgeon || '-'}</td>
            <td className="px-4 py-2 text-slate-500">{r.notes || '-'}</td>
          </tr>
        )}
      />

      <HistorySection 
        title="External Medications"
        endpoint="externalmedicationhistoryentrys"
        patientId={patientId}
        icon={Syringe}
        columns={['Medication', 'Dosage', 'Frequency', 'Started']}
        formFields={[
          { name: 'medicationName', label: 'Medication Name', required: true },
          { name: 'dosage', label: 'Dosage' },
          { name: 'frequency', label: 'Frequency' },
          { name: 'startedDate', label: 'Started Date', type: 'date' }
        ]}
        renderRow={(r) => (
          <tr key={r.id}>
            <td className="px-4 py-2 font-medium">{r.medicationName}</td>
            <td className="px-4 py-2 text-slate-500">{r.dosage || '-'}</td>
            <td className="px-4 py-2 text-slate-500">{r.frequency || '-'}</td>
            <td className="px-4 py-2 text-slate-500">{r.startedDate ? format(new Date(r.startedDate), 'MMM dd, yyyy') : '-'}</td>
          </tr>
        )}
      />

      <HistorySection 
        title="Clinical Observations (Vitals)"
        endpoint="clinicalobservations"
        patientId={patientId}
        icon={ActivitySquare}
        columns={['Observation', 'Value', 'Unit', 'Date']}
        formFields={[
          { name: 'observationName', label: 'Observation Name', required: true, type: 'select', options: [{value: 'Weight', label: 'Weight'}, {value: 'Height', label: 'Height'}, {value: 'Blood Pressure', label: 'Blood Pressure'}, {value: 'Heart Rate', label: 'Heart Rate'}, {value: 'Temperature', label: 'Temperature'}] },
          { name: 'value', label: 'Value', required: true },
          { name: 'unit', label: 'Unit' },
          { name: 'observedAt', label: 'Observed At', type: 'datetime-local', required: true }
        ]}
        renderRow={(r) => (
          <tr key={r.id}>
            <td className="px-4 py-2 font-medium">{r.observationName}</td>
            <td className="px-4 py-2 text-slate-800 font-bold">{r.value}</td>
            <td className="px-4 py-2 text-slate-500">{r.unit || '-'}</td>
            <td className="px-4 py-2 text-slate-500">{r.observedAt ? format(new Date(r.observedAt), 'MMM dd, yyyy HH:mm') : '-'}</td>
          </tr>
        )}
      />

    </div>
  );
};

export default EMRChart;
