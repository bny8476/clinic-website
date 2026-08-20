import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { fadeIn } from '../../components/ui/motion';

const PatientManagement = () => {
    const [page, setPage] = useState(0);
    const [size] = useState(10);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-patients', page, size],
        queryFn: async () => {
            const res = await axiosPrivate.get(`/patients?page=${page}&size=${size}`);
            return res.data;
        }
    });

    const patientList = Array.isArray(data) ? data : (data?.content || []);
    const totalPages = data?.totalPages || 1;

    const columns = [
        { key: 'id', title: 'Profile ID', render: (val) => val || '—' },
        { 
            key: 'name', 
            title: 'Patient Name', 
            render: (_, row) => (
                <span className="font-semibold text-[var(--color-navy-900)]">
                    {row.firstName || ''} {row.lastName || ''}
                </span>
            )
        },
        { key: 'email', title: 'Email Address' },
        { key: 'phone', title: 'Phone Number', render: (val) => val || '—' },
        { key: 'gender', title: 'Gender', render: (val) => val || '—' },
        { key: 'dateOfBirth', title: 'DOB', render: (val) => val || '—' },
        {
            key: 'status',
            title: 'Status',
            render: () => <Badge variant="success">Active</Badge>
        }
    ];

    return (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
                        <UserCheck className="w-7 h-7 text-[var(--color-navy-800)]" />
                        Patient Profiles
                    </h1>
                    <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
                        View and manage registered patient profiles and their general information.
                    </p>
                </div>
            </div>

            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
                <DataTable 
                    columns={columns} 
                    data={patientList} 
                    isLoading={isLoading} 
                />
                
                {totalPages > 1 && (
                    <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between bg-gray-50/50">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-500">
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default PatientManagement;
