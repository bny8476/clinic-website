import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { DollarSign, TrendingDown, TrendingUp, Plus, Receipt, LayoutGrid, FileText, IndianRupee, Calendar, ShieldCheck, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FinanceDashboard() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState({ category: '', description: '', amount: '', incurredOn: new Date().toISOString().split('T')[0] });

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

    const addExpenseMutation = useMutation({
        mutationFn: async (expenseData) => {
            return await axiosPrivate.post('/finance/expenses', expenseData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['finance-expenses']);
            queryClient.invalidateQueries(['finance-dashboard']);
            setIsExpenseModalOpen(false);
            setNewExpense({ category: '', description: '', amount: '', incurredOn: new Date().toISOString().split('T')[0] });
        }
    });

    return (
        <div className="p-6 h-full overflow-y-auto bg-[#F8FAFF]">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
              <p className="text-gray-500 mt-1">Manage Revenue, Expenses, and Accounting</p>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Revenue */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                    <div className="p-6 relative z-10">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-7 h-7 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-500">Total Revenue</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString()}</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> 0%
                            </span>
                            <span className="text-sm text-gray-400">vs last 30 days</span>
                        </div>
                    </div>
                    {/* Wavy background right */}
                    <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none w-32 h-24">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                            <path d="M0 100 C 20 80, 40 100, 60 70 S 80 40, 100 60 L 100 100 Z" fill="#22c55e" />
                            <path d="M0 100 C 30 90, 50 110, 70 80 S 90 50, 100 70 L 100 100 Z" fill="#16a34a" opacity="0.5" />
                        </svg>
                    </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400"></div>
                    <div className="p-6 relative z-10">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <TrendingDown className="w-7 h-7 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-500">Total Expenses</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{totalExpenses.toLocaleString()}</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" /> 0%
                            </span>
                            <span className="text-sm text-gray-400">vs last 30 days</span>
                        </div>
                    </div>
                    {/* Wavy background right */}
                    <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none w-32 h-24">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                            <path d="M0 100 C 20 80, 40 100, 60 70 S 80 40, 100 60 L 100 100 Z" fill="#ef4444" />
                            <path d="M0 100 C 30 90, 50 110, 70 80 S 90 50, 100 70 L 100 100 Z" fill="#dc2626" opacity="0.5" />
                        </svg>
                    </div>
                </div>

                {/* Net Income */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2864FF]"></div>
                    <div className="p-6 relative z-10">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-full bg-[#EBF0FF] flex items-center justify-center shrink-0">
                                <DollarSign className="w-7 h-7 text-[#2864FF]" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-500">Net Income</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{netIncome.toLocaleString()}</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <span className="bg-[#EBF0FF] text-[#2864FF] text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                − 0%
                            </span>
                            <span className="text-sm text-gray-400">vs last 30 days</span>
                        </div>
                    </div>
                    {/* Wavy background right */}
                    <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none w-32 h-24">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                            <path d="M0 100 C 20 80, 40 100, 60 70 S 80 40, 100 60 L 100 100 Z" fill="#2864FF" />
                            <path d="M0 100 C 30 90, 50 110, 70 80 S 90 50, 100 70 L 100 100 Z" fill="#1e40af" opacity="0.5" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Expenses Workflow */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Expense Management & Approvals</h3>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="flex items-center gap-2 bg-[#2864FF] hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Add Expense
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                                <th className="p-4 pl-6">
                                    <div className="flex items-center gap-2"><LayoutGrid className="w-3.5 h-3.5" /> CATEGORY</div>
                                </th>
                                <th className="p-4">
                                    <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> DESCRIPTION</div>
                                </th>
                                <th className="p-4">
                                    <div className="flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5" /> AMOUNT</div>
                                </th>
                                <th className="p-4">
                                    <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> DATE</div>
                                </th>
                                <th className="p-4">
                                    <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> STATUS</div>
                                </th>
                                <th className="p-4 pr-6">
                                    <div className="flex items-center gap-2"><Settings className="w-3.5 h-3.5" /> ACTION</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {expenses.slice(0, 10).map(expense => (
                                <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 pl-6 font-semibold text-gray-900 text-sm">{expense.category}</td>
                                    <td className="p-4 text-gray-600 font-medium text-sm">{expense.description}</td>
                                    <td className="p-4 text-gray-900 font-bold text-sm">₹{expense.amount}</td>
                                    <td className="p-4 text-gray-500 font-medium text-sm">{new Date(expense.incurredOn).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                            expense.status === 'PENDING_APPROVAL' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                            expense.status === 'APPROVED' ? 'bg-[#EBF0FF] text-[#2864FF] border border-blue-100' :
                                            expense.status === 'PAID' ? 'bg-green-50 text-green-600 border border-green-100' :
                                            'bg-red-50 text-red-600 border border-red-100'
                                        }`}>
                                            {expense.status}
                                        </span>
                                    </td>
                                    <td className="p-4 pr-6">
                                        {expense.status === 'PENDING_APPROVAL' && (
                                            <button 
                                                onClick={() => approveMutation.mutate(expense.id)}
                                                className="text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {expense.status === 'APPROVED' && (
                                            <button 
                                                onClick={() => payMutation.mutate(expense.id)}
                                                className="text-xs font-medium bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                            >
                                                Mark Paid & Post to GL
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-16">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-[#F4F7FF] rounded-full flex items-center justify-center mb-6 relative">
                                                <div className="absolute inset-0 bg-[#EBF0FF] rounded-full animate-ping opacity-20"></div>
                                                <Receipt className="w-10 h-10 text-[#2864FF]" />
                                                {/* Decorative dots */}
                                                <div className="absolute top-0 right-[-10px] w-2 h-2 bg-blue-200 rounded-full"></div>
                                                <div className="absolute bottom-4 left-[-15px] w-2 h-2 bg-blue-200 rounded-full"></div>
                                                <div className="absolute top-[-10px] left-4 w-1.5 h-1.5 bg-blue-100 rounded-full"></div>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                                No expenses recorded yet.
                                            </h3>
                                            <p className="text-gray-500 text-sm mb-6">
                                                Add your first expense to get started.
                                            </p>
                                            <button onClick={() => setIsExpenseModalOpen(true)} className="flex items-center gap-2 border-2 border-[#2864FF] text-[#2864FF] hover:bg-[#F4F7FF] px-6 py-2 rounded-xl text-sm font-semibold transition-colors">
                                                <Plus className="w-4 h-4" /> Add Expense
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isExpenseModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Expense</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-[#2864FF]"
                                    placeholder="e.g. Utilities, Equipment, Supplies"
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-[#2864FF]"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                                <input 
                                    type="number" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-[#2864FF]"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date Incurred</label>
                                <input 
                                    type="date" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-[#2864FF]"
                                    value={newExpense.incurredOn}
                                    onChange={e => setNewExpense({...newExpense, incurredOn: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-8">
                            <button 
                                onClick={() => setIsExpenseModalOpen(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => addExpenseMutation.mutate({
                                    ...newExpense,
                                    amount: parseFloat(newExpense.amount)
                                })}
                                disabled={addExpenseMutation.isLoading || !newExpense.category || !newExpense.amount}
                                className="px-4 py-2 bg-[#2864FF] text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {addExpenseMutation.isLoading ? 'Saving...' : 'Save Expense'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
