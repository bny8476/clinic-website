import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { dashboardConfig } from '../../config/dashboardConfig';



const HrDashboard = () => {
  const [activeTab, setActiveTab] = useState('employees');

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({ queryKey: ['hr-employees'], queryFn: async () => (await axiosPrivate.get('/hr/employees')).data });
  const { data: attendance = [], isLoading: loadingAttendance } = useQuery({ queryKey: ['hr-attendance'], queryFn: async () => (await axiosPrivate.get('/hr/attendance')).data });
  const { data: leaves = [], isLoading: loadingLeaves } = useQuery({ queryKey: ['hr-leaves'], queryFn: async () => (await axiosPrivate.get('/hr/leaves')).data });

  const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
  const pendingLeavesCount = leaves.filter(l => l.status === 'PENDING').length;

  const data = {
    activeTab,
    employees,
    attendance,
    leaves,
    loadingEmployees,
    loadingAttendance,
    loadingLeaves,
    employeesCount: employees.length,
    presentCount,
    pendingLeavesCount
  };

  return (
    
    <ConfigDrivenDashboard 
      config={dashboardConfig.ROLE_HR}
      data={data}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
    
  );
};

export default HrDashboard;
