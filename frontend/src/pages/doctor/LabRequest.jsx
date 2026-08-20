import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';



const LabRequest = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [selectedTests, setSelectedTests] = useState([]);
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

  // Fetch test catalog
  const { data: testCatalog = [], isLoading } = useQuery({
    queryKey: ['lab-test-catalog'],
    queryFn: async () => (await axiosPrivate.get('/lab/catalog')).data,
  });

  const toggleTest = (test) => {
    if (selectedTests.some(t => t.id === test.id)) {
      setSelectedTests(prev => prev.filter(t => t.id !== test.id));
    } else {
      setSelectedTests(prev => [...prev, test]);
    }
  };

  const submitOrder = useMutation({
    mutationFn: async () => {
      return axiosPrivate.post(`/lab/requests`, {
        patientId: effectivePatientId,
        testIds: selectedTests.map(t => t.id),
        clinicalNotes,
        priority
      });
    },
    onSuccess: () => {
      toast.success('Lab order placed successfully!');
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
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text)', margin: 0 }}>Order Laboratory Tests</h1>
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
        {/* Test catalog grid */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '20px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FlaskConical size={16} color="#0e7490" /> Test Catalog
          </h2>

          {isLoading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading catalog...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {(testCatalog.length > 0 ? testCatalog : [
                { id: 1, testName: 'Complete Blood Count (CBC)', category: 'Hematology', price: 350 },
                { id: 2, testName: 'Fasting Blood Sugar (FBS)', category: 'Biochemistry', price: 150 },
                { id: 3, testName: 'Lipid Profile', category: 'Biochemistry', price: 600 },
                { id: 4, testName: 'Liver Function Test (LFT)', category: 'Biochemistry', price: 750 },
                { id: 5, testName: 'Thyroid Profile (T3, T4, TSH)', category: 'Endocrinology', price: 550 },
                { id: 6, testName: 'Urine Routine & Microscopy', category: 'Pathology', price: 200 },
              ]).map(test => {
                const isSelected = selectedTests.some(t => t.id === test.id);
                return (
                  <div
                    key={test.id}
                    onClick={() => toggleTest(test)}
                    style={{
                      padding: '12px', borderRadius: '8px', border: `1.5px solid ${isSelected ? '#0e7490' : 'var(--color-border)'}`,
                      background: isSelected ? '#ecfeff' : 'var(--color-surface)', cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--color-text)' }}>{test.testName}</span>
                      {isSelected && <Check size={16} color="#0e7490" />}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span>{test.category}</span>
                      <span style={{ fontWeight: 600, color: '#0e7490' }}>₹{test.price}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected tests & order submission */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>Order Summary</h3>

          <div style={{ flex: 1, minHeight: '120px', marginBottom: '16px' }}>
            {selectedTests.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No tests selected from catalog</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedTests.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px 0', borderBottom: '1px solid var(--color-surface-alt)' }}>
                    <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{t.testName}</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>₹{t.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
              <option value="STAT">STAT (Emergency)</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>Clinical Indications</label>
            <textarea
              value={clinicalNotes}
              onChange={e => setClinicalNotes(e.target.value)}
              placeholder="Reason for test / relevant symptoms..."
              rows={3}
              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.8rem', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          <Button
            variant="primary"
            onClick={() => submitOrder.mutate()}
            disabled={selectedTests.length === 0 || !effectivePatientId}
            isLoading={submitOrder.isPending}
            className="w-full mt-2"
          >
            <Send size={15} className="mr-2" /> Submit Lab Order
          </Button>
        </div>
      </div>
    </div>
    
  );
};

export default LabRequest;
