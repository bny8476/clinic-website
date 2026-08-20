import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';



// Icons
const IconCampaign = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);
const IconLeads = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconNPS = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);
const IconLoyalty = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconConsent = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const IconReferral = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);
const IconMembership = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);
const IconCoupon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

// Status badge component
const StatusBadge = ({ status }) => {
  const colors = {
    DRAFT: 'bg-gray-100 text-gray-700',
    REVIEW: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    SCHEDULED: 'bg-purple-100 text-purple-700',
    ACTIVE: 'bg-green-100 text-green-700',
    PAUSED: 'bg-orange-100 text-orange-700',
    COMPLETED: 'bg-teal-100 text-teal-700',
    ARCHIVED: 'bg-gray-100 text-gray-500',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

// Metric card component
const MetricCard = ({ icon: Icon, label, value, subLabel, linkTo, color = 'indigo', loading }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow`}>
    <div className={`p-3 rounded-lg bg-${color}-50 text-${color}-600 shrink-0`}>
      <Icon />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      {loading ? (
        <div className="h-7 w-16 bg-gray-100 animate-pulse rounded mt-1" />
      ) : (
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
      )}
      {subLabel && <p className="text-xs text-gray-400 mt-0.5">{subLabel}</p>}
    </div>
    {linkTo && (
      <Link to={linkTo} className={`text-${color}-600 hover:text-${color}-800 text-xs font-medium mt-1`}>
        View →
      </Link>
    )}
  </div>
);

// Campaign row
const CampaignRow = ({ campaign, onAction }) => (
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-4 py-3">
      <div className="font-medium text-gray-900 text-sm">{campaign.title}</div>
      <div className="text-xs text-gray-400">{campaign.campaignType}</div>
    </td>
    <td className="px-4 py-3">
      <div className="flex flex-wrap gap-1">
        {(campaign.channels || []).map(c => (
          <span key={c} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
            {c}
          </span>
        ))}
      </div>
    </td>
    <td className="px-4 py-3">
      <StatusBadge status={campaign.status} />
    </td>
    <td className="px-4 py-3 text-sm text-gray-600">{campaign.sentCount?.toLocaleString() ?? 0}</td>
    <td className="px-4 py-3">
      <div className="flex gap-2">
        {campaign.status === 'DRAFT' && (
          <button onClick={() => onAction(campaign.id, 'submit')}
            className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-medium">
            Submit
          </button>
        )}
        {campaign.status === 'REVIEW' && (
          <button onClick={() => onAction(campaign.id, 'approve')}
            className="text-xs px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded font-medium">
            Approve
          </button>
        )}
        {campaign.status === 'ACTIVE' && (
          <button onClick={() => onAction(campaign.id, 'pause')}
            className="text-xs px-2 py-1 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded font-medium">
            Pause
          </button>
        )}
        {campaign.status === 'PAUSED' && (
          <button onClick={() => onAction(campaign.id, 'resume')}
            className="text-xs px-2 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded font-medium">
            Resume
          </button>
        )}
        <button onClick={() => onAction(campaign.id, 'clone')}
          className="text-xs px-2 py-1 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded font-medium">
          Clone
        </button>
      </div>
    </td>
  </tr>
);

// Lead pipeline column
const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'APPOINTMENT_BOOKED', 'CONVERTED', 'LOST'];
const LEAD_COLORS = {
  NEW: 'border-blue-300 bg-blue-50',
  CONTACTED: 'border-purple-300 bg-purple-50',
  QUALIFIED: 'border-yellow-300 bg-yellow-50',
  APPOINTMENT_BOOKED: 'border-green-300 bg-green-50',
  CONVERTED: 'border-teal-300 bg-teal-50',
  LOST: 'border-red-300 bg-red-50',
};

const MarketingDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBranchId] = useState(null); // could come from auth context

  // Real API calls
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['marketing-dashboard', selectedBranchId],
    queryFn: async () =>
      (await axiosPrivate.get('/marketing/dashboard', { params: { branchId: selectedBranchId } })).data,
    staleTime: 30_000,
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => (await axiosPrivate.get('/marketing/campaigns')).data,
  });

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', selectedBranchId, null, 0],
    queryFn: async () =>
      (await axiosPrivate.get('/marketing/leads', { params: { branchId: selectedBranchId, size: 50 } })).data,
  });

  const { data: npsMetrics, isLoading: npsLoading } = useQuery({
    queryKey: ['nps-metrics', selectedBranchId],
    queryFn: async () =>
      selectedBranchId
        ? (await axiosPrivate.get('/marketing/nps/metrics', { params: { branchId: selectedBranchId } })).data
        : null,
    enabled: !!selectedBranchId,
  });

  const handleCampaignAction = async (id, action) => {
    try {
      const params = {};
      if (action === 'approve') params.approvedBy = 1;
      if (action === 'clone') params.clonedBy = 1;
      await axiosPrivate.post(`/marketing/campaigns/${id}/${action}`, null, { params });
      // Invalidation handled by TanStack Query refetch
    } catch (e) {
      toast.error(e?.response?.data?.message || `Failed to ${action} campaign`);
    }
  };

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'campaigns', label: 'Campaigns' },
    { key: 'leads', label: 'Lead Pipeline' },
    { key: 'loyalty', label: 'Loyalty' },
    { key: 'nps', label: 'NPS / Feedback' },
  ];

  const leadsByStatus = LEAD_STATUSES.reduce((acc, s) => {
    acc[s] = (leads?.content || []).filter(l => l.status === s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Marketing & CRM</h1>
            <p className="text-sm text-gray-500">Consent-driven patient engagement and campaign management</p>
          </div>
          <div className="flex gap-2">
            <Link to="#" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              + New Campaign
            </Link>
            <Link to="#" className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              + Add Lead
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-0">
          {TABS.map(t => (
            <button key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── OVERVIEW TAB ───────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Pending Approvals Alert */}
            {(metrics?.pendingApprovals > 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                <span className="text-yellow-600 font-medium text-sm">
                  ⚠️ {metrics.pendingApprovals} campaign{metrics.pendingApprovals > 1 ? 's' : ''} pending approval
                </span>
                <button onClick={() => setActiveTab('campaigns')}
                  className="ml-auto text-xs text-yellow-700 underline">
                  Review now
                </button>
              </div>
            )}

            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard icon={IconCampaign} label="Active Campaigns" color="indigo"
                value={metrics?.activeCampaigns} loading={metricsLoading} />
              <MetricCard icon={IconLeads} label="Open Leads" color="purple"
                value={metrics?.totalLeads} loading={metricsLoading} />
              <MetricCard icon={IconMembership} label="Active Memberships" color="teal"
                value={metrics?.activeMemberships} loading={metricsLoading} />
              <MetricCard icon={IconReferral} label="Pending Rewards" color="orange"
                value={metrics?.pendingReferralRewards} loading={metricsLoading} />
              <MetricCard icon={IconNPS} label="NPS Score" color="green"
                value={npsMetrics?.averageNpsScore != null ? npsMetrics.averageNpsScore.toFixed(1) : '—'}
                subLabel="0–10 scale" loading={npsLoading} />
              <MetricCard icon={IconConsent} label="Escalated Feedback" color="red"
                value={metrics?.escalatedNps} loading={metricsLoading} />
              <MetricCard icon={IconCoupon} label="Active Coupons" color="yellow"
                value={metrics?.activeCoupons} loading={metricsLoading} />
              <MetricCard icon={IconLoyalty} label="Converted Leads" color="blue"
                value={metrics?.convertedLeads} loading={metricsLoading} />
            </div>

            {/* Recent Campaigns */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 text-sm">Recent Campaigns</h2>
                <button onClick={() => setActiveTab('campaigns')} className="text-xs text-indigo-600 hover:underline">
                  View all
                </button>
              </div>
              {campaignsLoading ? (
                <div className="p-8 text-center text-gray-400 text-sm">Loading campaigns…</div>
              ) : campaigns.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No campaigns yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Campaign</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Channels</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Sent</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {campaigns.slice(0, 5).map(c => (
                        <CampaignRow key={c.id} campaign={c} onAction={handleCampaignAction} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CAMPAIGNS TAB ─────────────────────────────────────── */}
        {activeTab === 'campaigns' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">All Campaigns</h2>
              <span className="text-sm text-gray-400">{campaigns.length} total</span>
            </div>
            {campaignsLoading ? (
              <div className="p-12 text-center text-gray-400">Loading…</div>
            ) : campaigns.length === 0 ? (
              <div className="p-12 text-center">
                <IconCampaign />
                <p className="mt-2 text-gray-400 text-sm">No campaigns yet. Create your first campaign.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Campaign</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Channels</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Sent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {campaigns.map(c => (
                      <CampaignRow key={c.id} campaign={c} onAction={handleCampaignAction} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── LEADS PIPELINE TAB ────────────────────────────────── */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Lead Pipeline</h2>
              <div className="flex gap-2 text-sm text-gray-500">
                <span>{leads?.totalElements ?? 0} leads total</span>
              </div>
            </div>
            {leadsLoading ? (
              <div className="p-12 text-center text-gray-400">Loading pipeline…</div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 overflow-x-auto">
                {LEAD_STATUSES.map(status => (
                  <div key={status} className={`rounded-xl border-2 ${LEAD_COLORS[status]} p-3 min-w-36`}>
                    <div className="font-medium text-xs text-gray-600 mb-2">
                      {status.replace('_', ' ')}
                      <span className="ml-1 bg-white rounded-full px-1.5 text-gray-700 font-bold">
                        {leadsByStatus[status]?.length ?? 0}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {leadsByStatus[status]?.slice(0, 5).map(lead => (
                        <div key={lead.id} className="bg-white rounded-lg p-2 shadow-sm text-xs">
                          <div className="font-medium text-gray-800 truncate">
                            {lead.firstName} {lead.lastName}
                          </div>
                          <div className="text-gray-400 truncate">{lead.email}</div>
                          <div className="text-gray-400 mt-0.5">{lead.source}</div>
                        </div>
                      ))}
                      {leadsByStatus[status]?.length > 5 && (
                        <div className="text-xs text-gray-400 text-center">
                          +{leadsByStatus[status].length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LOYALTY TAB ──────────────────────────────────────── */}
        {activeTab === 'loyalty' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">Loyalty & Membership</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Tier Distribution</h3>
                <div className="space-y-3">
                  {['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'].map(tier => {
                    const colors = {
                      PLATINUM: 'bg-purple-500',
                      GOLD: 'bg-yellow-500',
                      SILVER: 'bg-gray-400',
                      BRONZE: 'bg-orange-400',
                    };
                    return (
    
                      <div key={tier} className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${colors[tier]}`} />
                        <span className="text-sm text-gray-600 w-20">{tier}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full" />
                        <span className="text-xs text-gray-400">—</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-4">Real-time data loaded per patient lookup</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Membership Plans</h3>
                <p className="text-sm text-gray-400">Membership plan details are loaded on the individual patient profile and billing pages.</p>
                <div className="mt-4 p-3 bg-teal-50 rounded-lg">
                  <p className="text-xs text-teal-700 font-medium">Active memberships: {metrics?.activeMemberships ?? '—'}</p>
                  <p className="text-xs text-teal-600">Expired: {metrics?.expiredMemberships ?? '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── NPS TAB ──────────────────────────────────────────── */}
        {activeTab === 'nps' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">Patient Feedback & NPS</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm text-gray-500">Average NPS Score</p>
                <p className="text-4xl font-bold text-gray-900 mt-1">
                  {npsMetrics?.averageNpsScore != null ? npsMetrics.averageNpsScore.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-gray-400 mt-1">0–10 scale (0–6: Detractors, 7–8: Passive, 9–10: Promoters)</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm text-gray-500">Completed Surveys</p>
                <p className="text-4xl font-bold text-gray-900 mt-1">{metrics?.npsResponseCount ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-1">This period</p>
              </div>
              <div className="bg-red-50 rounded-xl border border-red-100 shadow-sm p-5">
                <p className="text-sm text-red-600 font-medium">Escalated Complaints</p>
                <p className="text-4xl font-bold text-red-700 mt-1">{metrics?.escalatedNps ?? '—'}</p>
                <p className="text-xs text-red-400 mt-1">Require resolution</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-2">
                NPS surveys are automatically triggered on appointment completion.
                Select a branch to view detailed survey results.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Branch ID"
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                  Load Surveys
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    
  );
};

export default MarketingDashboard;
