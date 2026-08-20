import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { fadeIn } from '../../components/ui/motion';

const DoctorManagement = () => {
    const [page, setPage] = useState(0);
    const [size] = useState(10);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-doctors', page, size],
        queryFn: async () => {
            const res = await axiosPrivate.get(`/doctors/admin/all?page=${page}&size=${size}`);
            return res.data;
        }
    });

    const doctorList = Array.isArray(data) ? data : (data?.content || []);
    const totalPages = data?.totalPages || 1;

    const columns = [
        { key: 'id', title: 'Profile ID' },
        { 
            key: 'name', 
            title: 'Doctor Name', 
            render: (_, row) => (
                <span className="font-semibold text-[var(--color-navy-900)]">
                    {row.firstName || ''} {row.lastName || ''}
                </span>
            )
        },
        { key: 'specialty', title: 'Specialty', render: (val) => val || '—' },
        { key: 'registrationNumber', title: 'Reg. No', render: (val) => val || '—' },
        { key: 'email', title: 'Email Address' },
        { key: 'phone', title: 'Phone Number', render: (val) => val || '—' },
        {
            key: 'isActive',
            title: 'Status',
            render: (isActive) => (
                <Badge variant={isActive ? 'success' : 'danger'}>
                    {isActive ? 'Active' : 'Inactive'}
                </Badge>
            )
        }
    ];

    return (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
                        <Stethoscope className="w-7 h-7 text-[var(--color-navy-800)]" />
                        Doctor Roster
                    </h1>
                    <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
                        View and manage registered doctors, their specialties, and their current status.
                    </p>
                </div>
            </div>

            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
                <DataTable 
                    columns={columns} 
                    data={doctorList} 
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

export default DoctorManagement;
