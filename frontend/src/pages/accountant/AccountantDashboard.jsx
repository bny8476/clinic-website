import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { dashboardConfig } from '../../config/dashboardConfig';



const AccountantDashboard = () => {
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['allInvoices'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/billing/invoices');
      return res.data;
    }
  });

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.totalAmount || i.amount || 0), 0);
  const pendingCount = invoices.filter(i => i.status === 'PENDING').length;
  const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length;

  const filteredInvoices = statusFilter === 'ALL' ? invoices : invoices.filter(i => i.status === statusFilter);

  const data = {
    filteredInvoices,
    isLoading,
    totalRevenue,
    pendingCount,
    overdueCount
  };

  return (
    
    <ConfigDrivenDashboard 
      config={dashboardConfig.ROLE_ACCOUNTANT}
      data={data}
      activeTab={statusFilter}
      onTabChange={setStatusFilter}
    />
    
  );
};

export default AccountantDashboard;
