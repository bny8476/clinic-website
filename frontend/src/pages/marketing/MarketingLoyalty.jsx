import { useState } from 'react';
import toast from 'react-hot-toast';
import { axiosPrivate } from '../../api/axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';



const TIER_STYLES = {
  PLATINUM: 'bg-purple-100 text-purple-800 border-purple-300',
  GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  SILVER: 'bg-gray-100 text-gray-700 border-gray-300',
  BRONZE: 'bg-orange-100 text-orange-800 border-orange-300',
};

export default function MarketingLoyalty() {
  const qc = useQueryClient();
  const [patientId, setPatientId] = useState('');
  const [searched, setSearched] = useState(null);
  const [adjustPoints, setAdjustPoints] = useState({ points: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const { data: loyalty, isLoading: loyaltyLoading, refetch } = useQuery({
    queryKey: ['loyalty', searched],
    queryFn: async () => (await axiosPrivate.get(`/marketing/loyalty/${searched}`)).data,
    enabled: !!searched,
  });

  const { data: history } = useQuery({
    queryKey: ['loyalty-history', searched, 0],
    queryFn: async () =>
      (await axiosPrivate.get(`/marketing/loyalty/${searched}/transactions`, { params: { page: 0, size: 10 } })).data,
    enabled: !!searched,
  });

  const handleAdjust = async () => {
    if (!searched || !adjustPoints.points) return;
    setLoading(true);
    try {
      await axiosPrivate.post('/marketing/loyalty/adjust', null, {
        params: { patientId: searched, points: adjustPoints.points, notes: adjustPoints.notes, approvedBy: 1 },
      });
      qc.invalidateQueries({ queryKey: ['loyalty', searched] });
      qc.invalidateQueries({ queryKey: ['loyalty-history', searched, 0] });
      setAdjustPoints({ points: '', notes: '' });
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Adjustment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Loyalty & Points</h1>

      {/* Patient lookup */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 text-sm mb-3">Look Up Patient Loyalty Account</h2>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Patient ID"
            value={patientId}
            onChange={e => setPatientId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={() => setSearched(patientId)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            Look Up
          </button>
        </div>
      </div>

      {searched && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balance card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {loyaltyLoading ? (
              <div className="text-center text-gray-400">Loading…</div>
            ) : loyalty ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${TIER_STYLES[loyalty.tier] || TIER_STYLES.BRONZE}`}>
                    {loyalty.tier}
                  </span>
                  <span className="text-xs text-gray-400">Patient #{searched}</span>
                </div>
                <div className="text-4xl font-bold text-gray-900">{loyalty.pointsBalance?.toLocaleString()}</div>
                <div className="text-sm text-gray-400 mt-1">Available Points</div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400">Lifetime Earned</p>
                    <p className="font-semibold text-gray-700">{loyalty.lifetimeEarned?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Lifetime Redeemed</p>
                    <p className="font-semibold text-gray-700">{loyalty.lifetimeRedeemed?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Manual adjustment */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">Manual Adjustment (requires approval)</p>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Points (+ or -)" value={adjustPoints.points}
                      onChange={e => setAdjustPoints(p => ({ ...p, points: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                    <input type="text" placeholder="Reason" value={adjustPoints.notes}
                      onChange={e => setAdjustPoints(p => ({ ...p, notes: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                    <button onClick={handleAdjust} disabled={loading}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                      Adjust
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm">No loyalty account found</p>
            )}
          </div>

          {/* Transaction history */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700 text-sm">Transaction History</h3>
            </div>
            {(history?.content || []).length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No transactions yet</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {(history?.content || []).map(tx => (
                  <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{tx.type}</p>
                      <p className="text-xs text-gray-400">{tx.referenceType} #{tx.referenceId}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </p>
                      <p className="text-xs text-gray-400">Balance: {tx.balanceAfter}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    
  );
}
