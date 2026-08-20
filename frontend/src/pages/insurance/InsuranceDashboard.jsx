import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { dashboardConfig } from '../../config/dashboardConfig';



const InsuranceDashboard = () => {
  const [activeTab, setActiveTab] = useState('claims');

  const { data: claims = [] } = useQuery({
    queryKey: ['insurance-claims'],
    queryFn: async () => (await axiosPrivate.get('/insurance/claims')).data,
  });

  const { data: preAuths = [] } = useQuery({
    queryKey: ['insurance-preauths'],
    queryFn: async () => (await axiosPrivate.get('/insurance/pre-auths')).data,
  });

  const pendingClaimsCount = claims.filter(c => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length;
  const approvedClaimsCount = claims.filter(c => c.status === 'APPROVED' || c.status === 'SETTLED').length;

  const data = {
    claims,
    preAuths,
    pendingClaimsCount,
    approvedClaimsCount,
    preAuthsCount: preAuths.length
  };

  return (
    
    <ConfigDrivenDashboard 
      config={dashboardConfig.ROLE_INSURANCE}
      data={data}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
    
  );
};

export default InsuranceDashboard;
