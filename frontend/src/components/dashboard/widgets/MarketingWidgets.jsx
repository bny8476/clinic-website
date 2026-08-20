import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import { Megaphone, Ticket, Share2, Send } from 'lucide-react';

export const MarketingHeaderWidget = () => (
  <div className="mb-6">
    <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">
      Marketing & CRM Dashboard
    </h1>
    <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
      Manage marketing campaigns, coupons, and referral tracking.
    </p>
  </div>
);

export const MarketingKPIWidget = ({ sentCampaignsCount, couponsCount, referralsCount, loadingCampaigns, loadingCoupons, loadingReferrals }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <KPICard icon={Megaphone} label="Campaigns Sent" value={loadingCampaigns ? '...' : sentCampaignsCount} colorToken="info" />
    <KPICard icon={Ticket} label="Active Coupons" value={loadingCoupons ? '...' : couponsCount} colorToken="success" />
    <KPICard icon={Share2} label="Referrals Tracked" value={loadingReferrals ? '...' : referralsCount} colorToken="warning" />
  </div>
);

export const MarketingTablesWidget = ({ activeTab, campaigns, coupons, referrals, loadingCampaigns, loadingCoupons, loadingReferrals }) => {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [newChannel, setNewChannel] = useState('EMAIL');
  const [newContent, setNewContent] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountVal, setDiscountVal] = useState('');

  const createCampaign = useMutation({
    mutationFn: async (payload) => axiosPrivate.post('/marketing/campaigns', payload),
    onSuccess: () => { queryClient.invalidateQueries(['marketing-campaigns']); setNewTitle(''); setNewContent(''); },
  });

  const sendCampaign = useMutation({
    mutationFn: async (id) => axiosPrivate.post(`/marketing/campaigns/${id}/send`),
    onSuccess: () => queryClient.invalidateQueries(['marketing-campaigns']),
  });

  const createCoupon = useMutation({
    mutationFn: async (payload) => axiosPrivate.post('/marketing/coupons', payload),
    onSuccess: () => { queryClient.invalidateQueries(['marketing-coupons']); setCouponCode(''); setDiscountVal(''); },
  });

  const campaignColumns = [
    { key: 'title', title: 'Title', render: (val) => <span className="font-medium">{val}</span> },
    { key: 'channel', title: 'Channel' },
    { key: 'status', title: 'Status', render: (val) => <Badge variant={val === 'SENT' ? 'success' : 'neutral'}>{val}</Badge> },
    { key: 'sentCount', title: 'Sent Count' },
    { key: 'actions', title: 'Action', align: 'right', render: (_, c) => c.status !== 'SENT' ? <Button variant="success" size="sm" icon={Send} onClick={() => sendCampaign.mutate(c.id)}>Send Now</Button> : null }
  ];

  const couponColumns = [
    { key: 'code', title: 'Code', render: (val) => <span className="font-bold text-[var(--color-info)]">{val}</span> },
    { key: 'discount', title: 'Discount', render: (_, c) => `${c.discountValue} ${c.discountType === 'PERCENTAGE' ? '%' : '₹'}` },
    { key: 'usage', title: 'Times Used', render: (_, c) => `${c.timesUsed} / ${c.usageLimit}` },
    { key: 'status', title: 'Status', render: () => <Badge variant="success">ACTIVE</Badge> }
  ];

  const referralColumns = [
    { key: 'referrerId', title: 'Referrer', render: (val) => `User #${val}` },
    { key: 'refereeEmail', title: 'Referee Email' },
    { key: 'status', title: 'Status', render: (val) => <Badge variant="warning">{val}</Badge> },
    { key: 'createdAt', title: 'Date', render: (val) => new Date(val).toLocaleDateString() }
  ];

  return (
    <div className="flex flex-col gap-6">
      {activeTab === 'campaigns' && (
        <>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)]">
            <h3 className="text-lg font-bold font-display text-[var(--color-navy-900)] m-0 mb-4">Create New Campaign</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <FormField label="Campaign Title">
                <input type="text" placeholder="Campaign Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="input-field" />
              </FormField>
              <FormField label="Channel">
                <select value={newChannel} onChange={e => setNewChannel(e.target.value)} className="input-field">
                  <option value="EMAIL">EMAIL</option>
                  <option value="SMS">SMS</option>
                  <option value="IN_APP">IN_APP</option>
                </select>
              </FormField>
            </div>
            <FormField label="Message Content">
              <textarea rows={3} placeholder="Campaign message content..." value={newContent} onChange={e => setNewContent(e.target.value)} className="input-field mb-4" />
            </FormField>
            <Button variant="info" onClick={() => createCampaign.mutate({ title: newTitle, channel: newChannel, content: newContent })} isLoading={createCampaign.isPending}>Save Draft Campaign</Button>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
            <DataTable columns={campaignColumns} data={campaigns} isLoading={loadingCampaigns} searchPlaceholder="Search campaigns..." emptyTitle="No campaigns found" />
          </div>
        </>
      )}
      {activeTab === 'coupons' && (
        <>
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)]">
            <h3 className="text-lg font-bold font-display text-[var(--color-navy-900)] m-0 mb-4">Create New Coupon</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <FormField label="Coupon Code">
                <input type="text" placeholder="e.g. HEALTH20" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="input-field" />
              </FormField>
              <FormField label="Discount Type">
                <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="input-field">
                  <option value="PERCENTAGE">PERCENTAGE (%)</option>
                  <option value="FIXED_AMOUNT">FIXED AMOUNT (₹)</option>
                </select>
              </FormField>
              <FormField label="Discount Value">
                <input type="number" placeholder="Value" value={discountVal} onChange={e => setDiscountVal(e.target.value)} className="input-field" />
              </FormField>
            </div>
            <Button variant="info" onClick={() => createCoupon.mutate({ code: couponCode, discountType, discountValue: Number(discountVal), validFrom: '2026-01-01', validTo: '2026-12-31' })} isLoading={createCoupon.isPending}>Create Coupon</Button>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
            <DataTable columns={couponColumns} data={coupons} isLoading={loadingCoupons} searchPlaceholder="Search coupons..." emptyTitle="No coupons found" />
          </div>
        </>
      )}
      {activeTab === 'referrals' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
          <DataTable columns={referralColumns} data={referrals} isLoading={loadingReferrals} searchPlaceholder="Search referrals..." emptyTitle="No referrals found" />
        </div>
      )}
    </div>
  );
};
