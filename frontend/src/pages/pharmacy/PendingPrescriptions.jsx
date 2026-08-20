import React, { useState } from 'react';
import useDebounce from '../../hooks/pharmacy/useDebounce';
import { usePageData } from '../../hooks/pharmacy/usePageData';
import { axiosPrivate } from '../../api/axios';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';



export default function PendingPrescriptions() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  React.useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);

  const queryClient = useQueryClient();

  const { items: prescriptions = [], isLoading: loading, refetch } = usePageData(
    'pending-prescriptions',
    '/pharmacy/prescriptions/pending'
  );

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // id of row being acted on

  const doAction = async (id, endpoint, successMsg) => {
    setActionLoading(id);
    try {
      await axiosPrivate.post(`/pharmacy/prescriptions/${id}/${endpoint}`);
      toast.success(successMsg);
      refetch();
      // Also invalidate patient prescription queries so patient view updates
      queryClient.invalidateQueries({ queryKey: ['patientPrescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed: ${endpoint}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPrescriptions = prescriptions.filter(row => {
    const sLower = debouncedSearch.toLowerCase();
    const matchesSearch = !debouncedSearch ||
      row.patientName?.toLowerCase().includes(sLower) ||
      row.doctorName?.toLowerCase().includes(sLower);
    const pDate = row.prescriptionDate ? new Date(row.prescriptionDate) : null;
    const matchesFrom = !dateRange.from || (pDate && pDate >= dateRange.from);
    const matchesTo   = !dateRange.to   || (pDate && pDate <= dateRange.to);
    return matchesSearch && matchesFrom && matchesTo;
  });

  const statusVariant = s => s === 'DISPENSED' ? 'success' : s === 'PENDING' ? 'danger' : 'warning';
  const verifyVariant = v => v === 'VERIFIED' ? 'success' : v === 'REJECTED' ? 'danger' : 'warning';

  const columns = [
    { header: 'S.No', render: (_, i) => (currentPage - 1) * (Number(pageSize) || 10) + i + 1 },
    { header: 'ID', accessor: 'id' },
    { header: 'Patient', accessor: 'patientName' },
    { header: 'Doctor', accessor: 'doctorName' },
    { header: 'Date', render: row => row.prescriptionDate
        ? new Date(row.prescriptionDate).toLocaleDateString() : '—' },
    { header: 'Medications', render: row => (
        <span className="text-xs text-slate-600">
          {row.items?.length > 0
            ? row.items.map(i => i.medicationName).join(', ')
            : <span className="italic text-slate-400">—</span>}
        </span>
    )},
    { header: 'Status', render: row => (
      <div className="flex flex-col gap-1">
        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
        <Badge variant={verifyVariant(row.verificationStatus)} className="text-xs">
          {row.verificationStatus}
        </Badge>
      </div>
    )},
    { header: 'Actions', render: row => {
      const busy = actionLoading === row.id;
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* View details */}
          <button
            title="View Details"
            onClick={() => { setSelectedPrescription(row); setIsViewModalOpen(true); }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Verify (only if UNVERIFIED) */}
          {row.verificationStatus === 'UNVERIFIED' && row.status !== 'CANCELLED' && (
            <button
              title="Verify"
              disabled={busy}
              onClick={() => doAction(row.id, 'verify', 'Prescription verified')}
              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {/* Dispense (only if VERIFIED & PENDING) */}
          {row.verificationStatus === 'VERIFIED' && row.status === 'PENDING' && (
            <button
              title="Dispense"
              disabled={busy}
              onClick={() => doAction(row.id, 'dispense', 'Prescription dispensed successfully')}
              className="p-1.5 text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Pill className="w-4 h-4" />
            </button>
          )}

          {/* Reject (only if not yet dispensed) */}
          {row.status !== 'DISPENSED' && row.status !== 'CANCELLED' && (
            <button
              title="Reject"
              disabled={busy}
              onClick={() => doAction(row.id, 'reject', 'Prescription rejected')}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }},
  ];

  const paginated = pageSize === 'All'
    ? filteredPrescriptions
    : filteredPrescriptions.slice((currentPage - 1) * Number(pageSize), currentPage * Number(pageSize));

  return (
    
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Pending Prescriptions</h2>
        <p className="text-sm text-gray-500 font-medium">
          Electronic prescriptions from doctors — verify and dispense to update patient records
        </p>
      </div>

      <ModuleFilterBar
        searchPlaceholder="Search patient or doctor…"
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : (
          <>
            <DataTable columns={columns} data={paginated} hover striped />
            <Pagination
              totalRecords={filteredPrescriptions.length}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      {/* View Details Modal */}
      <AppModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Prescription Details"
        maxWidth="sm:max-w-2xl"
      >
        {selectedPrescription && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Patient</p>
                <p className="font-bold">{selectedPrescription.patientName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Doctor</p>
                <p className="font-bold">Dr. {selectedPrescription.doctorName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Date</p>
                <p className="font-bold">
                  {selectedPrescription.prescriptionDate
                    ? new Date(selectedPrescription.prescriptionDate).toLocaleDateString()
                    : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Status</p>
                <div className="flex gap-1.5 justify-end mt-0.5">
                  <Badge variant={statusVariant(selectedPrescription.status)}>
                    {selectedPrescription.status}
                  </Badge>
                  <Badge variant={verifyVariant(selectedPrescription.verificationStatus)}>
                    {selectedPrescription.verificationStatus}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Medication items */}
            {selectedPrescription.items?.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                  Medications ({selectedPrescription.items.length})
                </p>
                <div className="space-y-2">
                  {selectedPrescription.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="font-semibold text-sm text-slate-800">{item.medicationName} <span className="font-normal text-slate-500">({item.type || 'N/A'})</span></span>
                      </div>
                      <div className="mt-1.5 ml-6 text-xs text-slate-600 grid grid-cols-3 gap-1">
                        <span><span className="font-medium">Dose:</span> {item.dosage || '—'}</span>
                        <span><span className="font-medium">Freq:</span> {item.frequency || '—'}</span>
                        <span><span className="font-medium">Duration:</span> {item.duration || '—'}</span>
                        {item.instructions && (
                          <span className="col-span-3">
                            <span className="font-medium">Instructions:</span> {item.instructions}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 italic text-sm">
                No medication items found for this prescription.
              </div>
            )}

            {/* Dispensed info */}
            {selectedPrescription.status === 'DISPENSED' && selectedPrescription.dispensedAt && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                <CheckCircle className="w-4 h-4 text-blue-600 inline mr-2" />
                Dispensed by <strong>{selectedPrescription.dispensedBy}</strong> on{' '}
                {new Date(selectedPrescription.dispensedAt).toLocaleString()}
              </div>
            )}

            {/* Quick actions from modal */}
            {selectedPrescription.verificationStatus === 'UNVERIFIED' && selectedPrescription.status !== 'CANCELLED' && (
              <div className="flex gap-2 justify-end">
                <button
                  onClick={async () => {
                    await doAction(selectedPrescription.id, 'verify', 'Prescription verified');
                    setIsViewModalOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Verify
                </button>
                <button
                  onClick={async () => {
                    await doAction(selectedPrescription.id, 'reject', 'Prescription rejected');
                    setIsViewModalOpen(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              </div>
            )}
            {selectedPrescription.verificationStatus === 'VERIFIED' && selectedPrescription.status === 'PENDING' && (
              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    await doAction(selectedPrescription.id, 'dispense', 'Prescription dispensed successfully');
                    setIsViewModalOpen(false);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Dispense
                </button>
              </div>
            )}
          </div>
        )}
      </AppModal>
    </div>
    
  );
}
