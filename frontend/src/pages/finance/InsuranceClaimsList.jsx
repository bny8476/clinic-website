import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';

export default function InsuranceClaimsList() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: claims = [], isLoading } = useQuery({ 
        queryKey: ['finance-claims'], 
        queryFn: async () => (await axiosPrivate.get('/finance/claims')).data 
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            return await axiosPrivate.patch(`/finance/claims/${id}/status?status=${status}`);
        },
        onSuccess: () => queryClient.invalidateQueries(['finance-claims'])
    });

    const filteredClaims = claims.filter(c => 
        c.claimNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.providerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Insurance Claims</h1>
                <p className="text-sm text-slate-500 mt-1">Track and process patient insurance claims</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mt-6 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between bg-slate-50">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Search claims..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Claim #</th>
                                <th className="p-4 font-semibold">Provider</th>
                                <th className="p-4 font-semibold">Invoice ID</th>
                                <th className="p-4 font-semibold">Claimed</th>
                                <th className="p-4 font-semibold">Approved</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredClaims.map(claim => (
                                <tr key={claim.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 font-medium text-slate-800">{claim.claimNumber || 'PENDING'}</td>
                                    <td className="p-4 flex items-center gap-2 text-slate-600">
                                        <Shield size={16} className="text-indigo-400" />
                                        {claim.providerName}
                                    </td>
                                    <td className="p-4 text-slate-600">INV-{claim.invoiceId}</td>
                                    <td className="p-4 text-slate-800 font-medium">₹{claim.claimedAmount}</td>
                                    <td className="p-4 text-slate-800 font-medium">{claim.approvedAmount ? `₹${claim.approvedAmount}` : '-'}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                            claim.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                            claim.status === 'UNDER_REVIEW' ? 'bg-orange-100 text-orange-700' :
                                            claim.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                            claim.status === 'SETTLED' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {claim.status}
                                        </span>
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        {claim.status === 'SUBMITTED' && (
                                            <button 
                                                onClick={() => updateStatusMutation.mutate({ id: claim.id, status: 'UNDER_REVIEW' })}
                                                className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-xs font-medium"
                                            >
                                                Mark Under Review
                                            </button>
                                        )}
                                        {claim.status === 'UNDER_REVIEW' && (
                                            <>
                                                <button 
                                                    onClick={() => updateStatusMutation.mutate({ id: claim.id, status: 'APPROVED' })}
                                                    className="px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-medium"
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => updateStatusMutation.mutate({ id: claim.id, status: 'REJECTED' })}
                                                    className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {claim.status === 'APPROVED' && (
                                            <button 
                                                onClick={() => updateStatusMutation.mutate({ id: claim.id, status: 'SETTLED' })}
                                                className="px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-medium"
                                            >
                                                Mark Settled & Update Invoice
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredClaims.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">
                                        No insurance claims found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
