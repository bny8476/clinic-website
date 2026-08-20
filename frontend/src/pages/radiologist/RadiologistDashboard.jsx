import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { dashboardConfig } from '../../config/dashboardConfig';



const RadiologistDashboard = () => {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['radiology-requests-dashboard'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/radiology/requests');
      return res.data;
    },
    refetchInterval: 30000
  });

  const { data: procedures = [] } = useQuery({
    queryKey: ['radiology-procedures'],
    queryFn: async () => (await axiosPrivate.get('/radiology/procedures')).data,
  });

  const pendingCount = requests.filter(r => r.status === 'REQUESTED' || r.status === 'SCHEDULED').length;
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;

  const data = {
    requests,
    isLoading,
    proceduresCount: procedures.length,
    pendingCount,
    completedCount
  };

  return (
    
    <ConfigDrivenDashboard 
      config={dashboardConfig.ROLE_RADIOLOGIST}
      data={data}
      activeTab={filterStatus}
      onTabChange={setFilterStatus}
      customWidgets={
        <div className="mt-8">
          <RadiologyQuickActions setFilter={setFilterStatus} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px] overflow-hidden">
            <div className="lg:col-span-2 h-full overflow-y-auto pr-2">
              <RadiologyRequestList filter={filterStatus} />
            </div>
            <div className="h-full overflow-y-auto">
               <TechnicianWorklist requests={requests} />
            </div>
          </div>
        </div>
      }
    />
    
  );
};

export default RadiologistDashboard;
