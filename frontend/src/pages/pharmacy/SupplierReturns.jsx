import { useState, useEffect } from 'react';
import logger from '../../utils/logger';
import api from '../../utils/pharmacy/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';



export default function SupplierReturns({ onBack }) {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/supplier-returns');
      setReturns(res.data.data || []);
    } catch (err) {
      logger.error(err);
      setError('Failed to fetch returns from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'INITIATED': return <Badge variant="warning">{status}</Badge>;
      case 'DISPATCHED': return <Badge variant="info">{status}</Badge>;
      case 'CREDIT_NOTE_RECEIVED': return <Badge variant="success">{status}</Badge>;
      case 'SETTLED': return <Badge variant="success">{status}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack} 
              className="p-2 hover:bg-slate-200 bg-slate-100 rounded-xl text-slate-600 transition-colors mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-slate-800">Returns to Supplier</h2>
            <p className="text-sm text-slate-500 mt-1">Manage stock returns and track credit notes.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchReturns} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button 
            onClick={() => {
              toast('Please select a specific batch to return from the Stock Registry.', { icon: '📦' });
              navigate('/pharmacy/medicine-stock');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Return
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Return #</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected Credit</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-sm text-slate-500">
                      <FileText className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                      No supplier returns found
                    </td>
                  </tr>
                ) : (
                  returns.map((ret, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{ret.returnNumber}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{ret.supplier?.name || 'Unknown'}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{ret.reason}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-blue-600">₹{ret.expectedCreditValue?.toLocaleString() || '0'}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">{getStatusBadge(ret.status)}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-right">
                        <button className="text-indigo-600 hover:text-indigo-800 font-medium">View</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    
  );
}
