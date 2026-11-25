import ConfigDrivenDashboard from '../../components/dashboard/ConfigDrivenDashboard';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { dashboardConfig } from '../../config/dashboardConfig';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, ShieldCheck, Ticket } from 'lucide-react';

const InsuranceDashboard = () => {
  const navigate = useNavigate();
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
    <div className="flex flex-col h-full space-y-3">
      {/* Top Support & Action Bar */}
      <div className="px-6 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            TPA Adjudication & Pre-Auth Station
          </span>
        </div>
        <button
          onClick={() => navigate('/insurance/support')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Claims Helpdesk & Queries</span>
        </button>
      </div>

      <ConfigDrivenDashboard 
        config={dashboardConfig.ROLE_INSURANCE}
        data={data}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
};

export default InsuranceDashboard;
