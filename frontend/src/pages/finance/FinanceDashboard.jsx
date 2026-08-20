import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { TrendingUp, TrendingDown, DollarSign, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer } from '../../components/ui/motion';
import KPICard from '../../components/ui/KPICard';
import Button from '../../components/ui/Button';

export default function FinanceDashboard() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');

    const { data: dashboard = {} } = useQuery({
        queryKey: ['finance-dashboard'],
        queryFn: async () => {
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const endDate = now.toISOString().split('T')[0];
            return (await axiosPrivate.get('/finance/dashboard', { params: { startDate, endDate } })).data;
        }
    });
    const { data: expenses = [] } = useQuery({ queryKey: ['finance-expenses'], queryFn: async () => (await axiosPrivate.get('/finance/expenses')).data });

    const totalRevenue = dashboard.totalRevenue || 0;
    const totalExpenses = dashboard.totalExpenses || 0;
    const netIncome = dashboard.netProfit || 0;

    const approveMutation = useMutation({
        mutationFn: async (id) => {
            const userStr = localStorage.getItem('user');
            const userId = userStr ? JSON.parse(userStr).id : 1;
            return await axiosPrivate.post(`/finance/expenses/${id}/approve?approverId=${userId}`);
        },
        onSuccess: () => queryClient.invalidateQueries(['finance-expenses'])
    });

    const payMutation = useMutation({
        mutationFn: async (id) => {
            const userStr = localStorage.getItem('user');
            const userId = userStr ? JSON.parse(userStr).id : 1;
            return await axiosPrivate.post(`/finance/expenses/${id}/pay?payerId=${userId}`);
        },
        onSuccess: () => queryClient.invalidateQueries(['finance-expenses'])
    });

    return (
        <div className="p-6 h-full overflow-y-auto bg-[var(--color-bg-app)]">
            <div className="mb-4">
              <h1 className="text-[24px] font-bold text-[var(--color-text)]">Finance Dashboard</h1>
              <p className="text-[14px] text-[var(--color-text-muted)] mt-1">Manage Revenue, Expenses, and Accounting</p>
            </div>

            {/* Top Stats */}
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <motion.div variants={fadeIn}>
                    <KPICard 
                        label="Total Revenue" 
                        value={`₹${totalRevenue.toLocaleString()}`} 
                        icon={TrendingUp} 
                        colorToken="success" 
                    />
                </motion.div>
                <motion.div variants={fadeIn}>
                    <KPICard 
                        label="Total Expenses" 
                        value={`₹${totalExpenses.toLocaleString()}`} 
                        icon={TrendingDown} 
                        colorToken="danger" 
                    />
                </motion.div>
                <motion.div variants={fadeIn}>
                    <KPICard 
                        label="Net Income" 
                        value={`₹${netIncome.toLocaleString()}`} 
                        icon={DollarSign} 
                        colorToken="info" 
                    />
                </motion.div>
            </motion.div>

            {/* Expenses Workflow */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
                <div className="p-5 border-b border-[var(--color-border)] bg-slate-50">
                    <h3 className="text-[16px] font-bold text-[var(--color-text)]">Expense Management & Approvals</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                        <thead>
                            <tr className="bg-white text-[var(--color-text-muted)] text-[11px] font-bold uppercase tracking-wider border-b border-[var(--color-border)]">
                                <th className="p-4">Category</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <motion.tbody variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-[var(--color-border)]">
                            {expenses.slice(0, 10).map(expense => (
                                <motion.tr variants={fadeIn} key={expense.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-bold text-[var(--color-text)]">{expense.category}</td>
                                    <td className="p-4 text-[var(--color-text-muted)] font-medium">{expense.description}</td>
                                    <td className="p-4 text-[var(--color-text)] font-black">₹{expense.amount}</td>
                                    <td className="p-4 text-[var(--color-text-muted)] font-medium">{new Date(expense.incurredOn).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                            expense.status === 'PENDING_APPROVAL' ? 'bg-orange-100 text-orange-700' :
                                            expense.status === 'APPROVED' ? 'bg-[var(--color-info-bg)] text-[var(--color-navy-800)]' :
                                            expense.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {expense.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {expense.status === 'PENDING_APPROVAL' && (
                                            <Button 
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => approveMutation.mutate(expense.id)}
                                            >
                                                Approve
                                            </Button>
                                        )}
                                        {expense.status === 'APPROVED' && (
                                            <Button 
                                                size="sm"
                                                variant="success"
                                                onClick={() => payMutation.mutate(expense.id)}
                                            >
                                                Mark Paid & Post to GL
                                            </Button>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                            {expenses.length === 0 && (
                                <motion.tr variants={fadeIn}>
                                    <td colSpan="6" className="p-8 text-center text-[var(--color-text-muted)] font-medium">
                                        No expenses recorded yet.
                                    </td>
                                </motion.tr>
                            )}
                        </motion.tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
