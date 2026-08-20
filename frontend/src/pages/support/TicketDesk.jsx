import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';

export default function TicketDesk() {
    const { data: tickets = [], isLoading } = useQuery({
        queryKey: ['all-tickets'],
        queryFn: async () => {
            const res = await axiosPrivate.get('/support/tickets');
            return res.data;
        }
    });

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">Support Desk</h1>
                <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">Manage patient tickets and inquiries</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mt-6 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text" 
                                placeholder="Search tickets..." 
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Ticket ID</th>
                                <th className="p-4 font-semibold">Requester</th>
                                <th className="p-4 font-semibold">Subject</th>
                                <th className="p-4 font-semibold">Priority</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Created</th>
                                <th className="p-4 font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {tickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-slate-50 transition group cursor-pointer">
                                    <td className="p-4 font-medium text-slate-800">{ticket.ticketNumber}</td>
                                    <td className="p-4 text-slate-600">{ticket.requester?.firstName} {ticket.requester?.lastName}</td>
                                    <td className="p-4 text-slate-800 font-medium">{ticket.subject}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                            ticket.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                            ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                            ticket.status === 'NEW' ? 'bg-indigo-100 text-indigo-700' :
                                            ticket.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <button className="text-indigo-600 hover:text-indigo-800 font-medium">View</button>
                                    </td>
                                </tr>
                            ))}
                            {tickets.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">
                                        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                                        <p className="text-base font-medium text-slate-700">All caught up!</p>
                                        <p className="text-sm">There are no open tickets matching your criteria.</p>
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
