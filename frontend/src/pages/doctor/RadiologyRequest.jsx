import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';



const RadiologyRequest = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [priority, setPriority] = useState('ROUTINE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Search patients if no patientId in URL
  const { data: searchResults = [] } = useQuery({
    queryKey: ['patients-search', searchQuery],
    queryFn: async () => (await axiosPrivate.get(`/patients/search?query=${searchQuery}`)).data,
    enabled: !patientId && searchQuery.length >= 2,
  });

  const effectivePatientId = patientId || selectedPatient?.id;

  // Fetch procedure catalog
  const { data: procedures = [], isLoading } = useQuery({
    queryKey: ['radiology-procedures'],
    queryFn: async () => (await axiosPrivate.get('/radiology/procedures')).data,
  });

  const submitOrder = useMutation({
    mutationFn: async () => {
      return axiosPrivate.post(`/radiology/requests`, {
        patient: { id: effectivePatientId },
        procedure: { id: selectedProcedure.id },
        clinicalNotes,
        priority
      });
    },
    onSuccess: () => {
      toast.success('Imaging order placed successfully!');
      if (patientId) {
        navigate(`/doctor/patients/${patientId}/notes`);
      } else {
        navigate(-1);
      }
    }
  });

  return (
    
    <div className="p-4 sm:p-6" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} style={{ background: 'var(--color-surface-alt)', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}>
          <ChevronLeft size={16} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text)', margin: 0 }}>Order Imaging</h1>
      </div>

      {!patientId && (
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '14px' }}>
            Select Patient
          </h2>
          {selectedPatient ? (
            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
              <div>
                <div className="font-semibold text-indigo-900">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                <div className="text-xs text-indigo-700">Patient ID: {selectedPatient.patientId}</div>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Change</button>
            </div>
          ) : (
            <div>
              <input
                type="text"
                placeholder="Search patient by name or ID (min 2 chars)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '10px' }}
              />
              {searchResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {searchResults.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => { setSelectedPatient(p); setSearchQuery(''); }}
                      className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                    >
                      <span className="font-medium text-gray-900">{p.firstName} {p.lastName}</span>
                      <span className="text-xs text-gray-500">{p.patientId}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:grid gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>
        {/* Procedure catalog grid */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '20px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HeartPulse size={16} color="#4f46e5" /> Imaging Procedures
          </h2>

          {isLoading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading catalog...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {procedures.map(proc => {
                const isSelected = selectedProcedure?.id === proc.id;
                return (
                  <div
                    key={proc.id}
                    onClick={() => setSelectedProcedure(isSelected ? null : proc)}
                    style={{
                      padding: '12px', borderRadius: '8px', border: `1.5px solid ${isSelected ? '#4f46e5' : 'var(--color-border)'}`,
                      background: isSelected ? '#eef2ff' : 'var(--color-surface)', cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--color-text)' }}>{proc.name}</span>
                      {isSelected && <Check size={16} color="#4f46e5" />}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span>{proc.modality}</span>
                      <span style={{ fontWeight: 600, color: '#4f46e5' }}>₹{proc.price}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Details Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)' }}>Order Details</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>Priority</label>
              <select 
                value={priority} 
                onChange={e => setPriority(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.85rem', outline: 'none' }}
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="STAT">STAT (Immediate)</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>Clinical Notes & Indication</label>
              <textarea 
                value={clinicalNotes} 
                onChange={e => setClinicalNotes(e.target.value)}
                placeholder="Reason for scan, patient symptoms..."
                rows={4}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.85rem', outline: 'none', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Summary Box */}
          <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>Selected Scan</h3>
            
            <div style={{ borderBottom: '1px dashed var(--color-border)', paddingBottom: '12px', marginBottom: '12px' }}>
              {selectedProcedure ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text)' }}>{selectedProcedure.name}</span>
                  <span style={{ fontWeight: 600 }}>₹{selectedProcedure.price}</span>
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic">No procedure selected</div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '20px' }}>
              <span>Total Est. Cost</span>
              <span>₹{selectedProcedure?.price || 0}</span>
            </div>

            <button 
              onClick={() => submitOrder.mutate()}
              disabled={!effectivePatientId || !selectedProcedure || submitOrder.isPending}
              style={{ 
                width: '100%', background: '#4f46e5', color: 'white', border: 'none', 
                padding: '10px', borderRadius: '7px', fontWeight: 600, cursor: 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                opacity: (!effectivePatientId || !selectedProcedure || submitOrder.isPending) ? 0.6 : 1 
              }}
            >
              <Send size={14} /> 
              {submitOrder.isPending ? 'Submitting...' : 'Submit Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
    
  );
};

export default RadiologyRequest;
