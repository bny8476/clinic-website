import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import { Users, CalendarCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const HrHeaderWidget = () => (
  <div className="mb-6">
    <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">
      HR & Staff Operations
    </h1>
    <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
      Employee Directory, Shift Attendance, and Leave Approvals.
    </p>
  </div>
);

export const HrKPIWidget = ({ employeesCount, presentCount, pendingLeavesCount, loadingEmployees, loadingAttendance, loadingLeaves }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <KPICard icon={Users} label="Total Staff / Employees" value={loadingEmployees ? '...' : employeesCount} colorToken="navy" />
    <KPICard icon={CalendarCheck} label="Present Today" value={loadingAttendance ? '...' : presentCount} colorToken="success" />
    <KPICard icon={Clock} label="Pending Leaves" value={loadingLeaves ? '...' : pendingLeavesCount} colorToken="warning" />
  </div>
);

export const HrTablesWidget = ({ activeTab, employees, attendance, leaves, loadingEmployees, loadingAttendance, loadingLeaves }) => {
  const queryClient = useQueryClient();

  const updateLeave = useMutation({
    mutationFn: async ({ id, status }) => axiosPrivate.patch(`/hr/leaves/${id}/status?status=${status}`),
    onSuccess: () => {
      toast.success('Leave status updated');
      queryClient.invalidateQueries(['hr-leaves']);
    },
    onError: () => toast.error('Failed to update leave status')
  });

  const employeeColumns = [
    { key: 'id', title: 'Employee ID', render: (val) => `#${val}` },
    { key: 'department', title: 'Department' },
    { key: 'designation', title: 'Designation' },
    { key: 'dateOfJoining', title: 'Joining Date' },
    { key: 'employmentType', title: 'Employment Type', render: (val) => <Badge variant="info">{val || 'FULL_TIME'}</Badge> }
  ];

  const attendanceColumns = [
    { key: 'id', title: 'Emp ID', render: (val, row) => `#${row.employee?.id || val}` },
    { key: 'date', title: 'Date' },
    { key: 'checkIn', title: 'Check In', render: (val) => val ? new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' },
    { key: 'checkOut', title: 'Check Out', render: (val) => val ? new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' },
    { key: 'status', title: 'Status', render: (val) => <Badge variant={val === 'PRESENT' ? 'success' : 'danger'}>{val}</Badge> }
  ];

  const leaveColumns = [
    { key: 'leaveType', title: 'Leave Type' },
    { key: 'startDate', title: 'Dates', render: (_, row) => `${row.startDate} to ${row.endDate}` },
    { key: 'reason', title: 'Reason' },
    { key: 'status', title: 'Status', render: (val) => <Badge variant={val === 'APPROVED' ? 'success' : val === 'REJECTED' ? 'danger' : 'warning'}>{val}</Badge> },
    {
      key: 'actions', title: 'Action', align: 'right',
      render: (_, row) => row.status === 'PENDING' ? (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" icon={CheckCircle} className="text-[var(--color-success)] hover:bg-[var(--color-success-bg)]" onClick={() => updateLeave.mutate({ id: row.id, status: 'APPROVED' })}>Approve</Button>
          <Button variant="ghost" size="sm" icon={XCircle} className="text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]" onClick={() => updateLeave.mutate({ id: row.id, status: 'REJECTED' })}>Reject</Button>
        </div>
      ) : null
    }
  ];

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
      {activeTab === 'employees' && <DataTable columns={employeeColumns} data={employees} isLoading={loadingEmployees} searchPlaceholder="Search staff..." emptyTitle="No staff members found" />}
      {activeTab === 'attendance' && <DataTable columns={attendanceColumns} data={attendance} isLoading={loadingAttendance} searchPlaceholder="Search attendance log..." emptyTitle="No attendance records" />}
      {activeTab === 'leaves' && <DataTable columns={leaveColumns} data={leaves} isLoading={loadingLeaves} searchPlaceholder="Search leave requests..." emptyTitle="No leave requests submitted" />}
    </div>
  );
};
