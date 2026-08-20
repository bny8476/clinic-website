import { useState, useEffect } from 'react';

import logger from '../../utils/logger';
import api from '../../utils/pharmacy/api';
import { toast } from 'react-hot-toast';



const STATUS_STYLES = {
  PENDING:  'bg-amber-50 text-amber-700 border border-amber-200',
  MATCHED:  'bg-blue-50 text-blue-700 border border-blue-200',
  DISPUTED: 'bg-red-50 text-red-700 border border-red-200',
  PAID:     'bg-blue-50 text-blue-700 border border-blue-200',
};

export default function InvoiceMatching({ onBack }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matching, setMatching] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/supplier-invoices');
      setInvoices(res.data.data || []);
    } catch (err) {
      logger.error(err);
      setError('Failed to load supplier invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleMatch = async (id) => {
    setMatching(id);
    try {
      await api.post(`/supplier-invoices/${id}/match`);
      toast.success('Invoice matched to GRN successfully');
      fetchInvoices();
    } catch (err) {
      toast.error('Invoice matching failed');
    } finally {
      setMatching(null);
    }
  };

  return (
    
    <div className="space-y-6 max-w-6xl mx-auto">
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
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Matching</h2>
            <p className="text-sm text-slate-500 font-medium">Verify supplier invoices against GRNs</p>
          </div>
        </div>
        <button onClick={fetchInvoices} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
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
                  {['Invoice #', 'Supplier', 'Invoice Date', 'Invoice Amount', 'GRN Ref', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-10 text-center text-sm text-slate-500">
                      <FileText className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                      No supplier invoices found
                    </td>
                  </tr>
                ) : (
                  invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-800">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{inv.supplier?.name || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-800">
                        ₹{inv.invoiceAmount?.toLocaleString('en-IN') || '0'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        {inv.goodsReceiptNote?.grnNumber || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[inv.matchStatus] || 'bg-slate-100 text-slate-600'}`}>
                          {inv.matchStatus || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(inv.matchStatus === 'PENDING' || !inv.matchStatus) && (
                          <button
                            onClick={() => handleMatch(inv.id)}
                            disabled={matching === inv.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                          >
                            {matching === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            Match to GRN
                          </button>
                        )}
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
