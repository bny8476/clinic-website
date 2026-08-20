import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { dashboardConfig } from '../../config/dashboardConfig';



const SupportDashboard = () => {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const { data: tickets = [], isLoading: loadingTickets } = useQuery({ queryKey: ['support-tickets'], queryFn: async () => (await axiosPrivate.get('/support/tickets')).data });

  const openTicketsCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  const filteredTickets = filterStatus === 'ALL' ? tickets : tickets.filter(t => t.status === filterStatus);

  const data = {
    filteredTickets,
    loadingTickets,
    openTicketsCount,
    inProgressCount,
    resolvedCount
  };

  return (
    
    <ConfigDrivenDashboard 
      config={dashboardConfig.ROLE_SUPPORT}
      data={data}
      activeTab={filterStatus}
      onTabChange={setFilterStatus}
    />
    
  );
};

export default SupportDashboard;
