import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';

export default function PatientSupport() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newTicket, setNewTicket] = useState({ subject: '', description: '', category: 'GENERAL' });

    const { data: tickets = [] } = useQuery({
        queryKey: ['patientTickets'],
        queryFn: async () => {
            const res = await axiosPrivate.get('/v1/patient/support/tickets');
            return res.data;
        }
    });

    const { data: articles = [] } = useQuery({
        queryKey: ['kbSearch', searchQuery],
        queryFn: async () => {
            if (!searchQuery) return [];
            const res = await axiosPrivate.get(`/v1/patient/support/kb/search?q=${searchQuery}`);
            return res.data;
        },
        enabled: searchQuery.length > 2
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const res = await axiosPrivate.post('/v1/patient/support/tickets', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['patientTickets']);
            setIsCreating(false);
            setNewTicket({ subject: '', description: '', category: 'GENERAL' });
        }
    });

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <div className="mb-6"><h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">Help & Support</h1><p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">Find answers or contact our team</p></div>
            
            {/* Knowledge Base Search */}
            <div className="bg-indigo-600 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-indigo-500 opacity-50 blur-3xl"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-4">How can we help you today?</h2>
                    <div className="max-w-2xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search for articles, billing help, or medical records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-full bg-white/10 border border-indigo-400/30 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/20 transition backdrop-blur-sm"
                        />
                    </div>
                </div>
            </div>

            {/* KB Results */}
            {searchQuery.length > 2 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Search Results</h3>
                    {articles.length > 0 ? (
                        <div className="space-y-4">
                            {articles.map(article => (
                                <div key={article.id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50 transition cursor-pointer group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-3">
                                            <FileText className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-medium text-slate-800 group-hover:text-indigo-700">{article.title}</h4>
                                                <p className="text-sm text-slate-500 mt-1">{article.summary}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">No articles found matching "{searchQuery}"</p>
                    )}
                </div>
            )}

            {/* Tickets Section */}
            <div className="flex items-center justify-between mt-8 mb-4">
                <h3 className="text-xl font-bold text-slate-800">My Support Tickets</h3>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    New Ticket
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 mb-6">
                    <h4 className="font-semibold text-slate-800 mb-4">Create a New Support Ticket</h4>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        createMutation.mutate(newTicket);
                    }} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                            <input 
                                required
                                type="text"
                                value={newTicket.subject}
                                onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="E.g., Missing test results"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea 
                                required
                                rows="4"
                                value={newTicket.description}
                                onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="Please describe your issue in detail..."
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                                {createMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {tickets.map(ticket => (
                    <div key={ticket.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition">
                        <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                ticket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                            }`}>
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-800">{ticket.subject}</h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                    <span>ID: {ticket.ticketNumber}</span>
                                    <span>•</span>
                                    <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className={`font-medium ${
                                        ticket.status === 'NEW' ? 'text-blue-600' :
                                        ticket.status === 'RESOLVED' ? 'text-emerald-600' : 'text-slate-600'
                                    }`}>
                                        {ticket.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button className="px-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition">
                            View Details
                        </button>
                    </div>
                ))}
                {tickets.length === 0 && !isCreating && (
                    <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                        <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-slate-800">No Support Tickets</h4>
                        <p className="text-slate-500 text-sm mt-1">You don't have any active support requests.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
