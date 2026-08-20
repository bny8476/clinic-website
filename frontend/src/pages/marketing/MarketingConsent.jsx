import { useState } from 'react';
import toast from 'react-hot-toast';
import { axiosPrivate } from '../../api/axios';
import { useQuery } from '@tanstack/react-query';



export default function MarketingConsent() {
  const [patientId, setPatientId] = useState('');
  const [searched, setSearched] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [channel, setChannel] = useState('EMAIL');
  const [withdrawing, setWithdrawing] = useState(false);

  const { data: consents = [], isLoading, refetch } = useQuery({
    queryKey: ['marketing-consents', searched],
    queryFn: async () =>
      (await axiosPrivate.get(`/marketing/consent/patient/${searched}`)).data,
    enabled: !!searched,
  });

  const CHANNELS = ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP', 'PUSH'];

  const latestByChannel = CHANNELS.reduce((acc, ch) => {
    const latest = consents.filter(c => c.channel === ch).sort((a, b) =>
      new Date(b.capturedAt) - new Date(a.capturedAt)
    )[0];
    if (latest) acc[ch] = latest;
    return acc;
  }, {});

  const handleCapture = async () => {
    if (!searched) return;
    setCapturing(true);
    try {
      await axiosPrivate.post('/marketing/consent', null, {
        params: {
          patientId: searched,
          channel,
          consentSource: 'PORTAL',
          wordingVersion: 'v1',
          purpose: 'MARKETING',
          branchId: 1,
        },
      });
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to capture consent');
    } finally {
      setCapturing(false);
    }
  };

  const handleWithdraw = async (ch) => {
    setWithdrawing(ch);
    try {
      await axiosPrivate.post('/marketing/consent/withdraw', null, {
        params: { patientId: searched, channel: ch, branchId: 1 },
      });
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to withdraw consent');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Marketing Consent Management</h1>
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
        <strong>Important:</strong> Marketing communications are only sent to channels where the patient has an active, 
        non-expired opt-in. Withdrawal is recorded as an immutable audit trail.
      </div>

      {/* Patient lookup */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 text-sm mb-3">Look Up Patient Consent History</h2>
        <div className="flex gap-2">
          <input type="number" placeholder="Patient ID" value={patientId}
            onChange={e => setPatientId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <button onClick={() => setSearched(patientId)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            Look Up
          </button>
        </div>
      </div>

      {searched && (
        <>
          {/* Channel consent status */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-700 text-sm mb-4">Consent Status — Patient #{searched}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {CHANNELS.map(ch => {
                const consent = latestByChannel[ch];
                const isOptedIn = consent?.consentState === 'OPTED_IN';
                return (
    
                  <div key={ch} className={`rounded-lg border p-3 text-center ${isOptedIn ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <p className="text-xs font-semibold text-gray-600 mb-1">{ch}</p>
                    <p className={`text-sm font-bold ${isOptedIn ? 'text-green-700' : 'text-gray-400'}`}>
                      {isOptedIn ? '✓ Opted In' : consent ? '✗ Opted Out' : 'No Record'}
                    </p>
                    {isOptedIn && (
                      <button onClick={() => handleWithdraw(ch)} disabled={withdrawing === ch}
                        className="mt-2 text-xs text-red-500 hover:text-red-700 underline disabled:opacity-50">
                        Withdraw
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Capture new consent */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Capture New Consent</p>
              <div className="flex gap-2">
                <select value={channel} onChange={e => setChannel(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={handleCapture} disabled={capturing}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {capturing ? 'Saving…' : 'Capture Opt-In'}
                </button>
              </div>
            </div>
          </div>

          {/* Full audit history */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">Full Consent Audit Trail</h3>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
            ) : consents.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No consent records found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Channel</th>
                      <th className="px-4 py-3 text-left">State</th>
                      <th className="px-4 py-3 text-left">Source</th>
                      <th className="px-4 py-3 text-left">Version</th>
                      <th className="px-4 py-3 text-left">Captured At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {consents.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{c.channel}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.consentState === 'OPTED_IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>{c.consentState}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{c.consentSource || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{c.wordingVersion || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {c.capturedAt ? new Date(c.capturedAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
    
  );
}
