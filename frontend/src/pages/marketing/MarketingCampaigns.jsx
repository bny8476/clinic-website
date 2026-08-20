import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Megaphone, Send, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { fadeIn } from '../../components/ui/motion';



const MarketingCampaigns = () => {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    channel: 'EMAIL',
    targetAudience: '',
    startDate: '',
    endDate: ''
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/marketing/campaigns');
      return res.data;
    }
  });

  const createCampaign = useMutation({
    mutationFn: async () => {
      const payload = {
        name: campaignForm.name,
        description: campaignForm.description,
        channel: campaignForm.channel,
        targetAudience: campaignForm.targetAudience,
        status: 'DRAFT',
        startDate: campaignForm.startDate ? new Date(campaignForm.startDate).toISOString() : null,
        endDate: campaignForm.endDate ? new Date(campaignForm.endDate).toISOString() : null
      };
      const res = await axiosPrivate.post('/marketing/campaigns', payload, {
        params: { ownerId: 1, branchId: 1 }
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Campaign created successfully');
      setShowCreateForm(false);
      setCampaignForm({ name: '', description: '', channel: 'EMAIL', targetAudience: '', startDate: '', endDate: '' });
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create campaign');
    }
  });

  const sendCampaign = useMutation({
    mutationFn: async (id) => {
      const res = await axiosPrivate.post(`/marketing/campaigns/${id}/send`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Campaign sent/activated');
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
    },
    onError: (err) => {
      toast.error('Failed to send campaign');
    }
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!campaignForm.name) {
      toast.error('Campaign name is required');
      return;
    }
    createCampaign.mutate();
  };

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/marketing" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-indigo-600" />
            Campaign Management
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Create, manage, and launch marketing campaigns for patients.
          </p>
        </div>
        <Button 
          variant="primary" 
          icon={Plus} 
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'New Campaign'}
        </Button>
      </div>

      {showCreateForm && (
        <Card className="border-indigo-100 mb-6">
          <Card.Header className="bg-indigo-50 border-b border-indigo-100">
            <h2 className="text-lg font-bold text-indigo-900">Create New Campaign</h2>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Campaign Name" required id="name">
                  <input 
                    id="name" type="text" value={campaignForm.name} 
                    onChange={e => setCampaignForm({...campaignForm, name: e.target.value})} 
                    className="input-field" placeholder="e.g. Flu Shot Reminder 2026" required
                  />
                </FormField>
                <FormField label="Target Audience" id="audience">
                  <input 
                    id="audience" type="text" value={campaignForm.targetAudience} 
                    onChange={e => setCampaignForm({...campaignForm, targetAudience: e.target.value})} 
                    className="input-field" placeholder="e.g. All Active Patients"
                  />
                </FormField>
              </div>
              <FormField label="Description / Message" id="desc">
                <textarea 
                  id="desc" value={campaignForm.description} 
                  onChange={e => setCampaignForm({...campaignForm, description: e.target.value})} 
                  className="input-field min-h-[80px]" placeholder="Campaign content or internal description..."
                />
              </FormField>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Channel" id="channel">
                  <select 
                    id="channel" value={campaignForm.channel} 
                    onChange={e => setCampaignForm({...campaignForm, channel: e.target.value})} 
                    className="input-field"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="APP_PUSH">App Push Notification</option>
                  </select>
                </FormField>
                <FormField label="Start Date" id="startDate">
                  <input 
                    id="startDate" type="date" value={campaignForm.startDate} 
                    onChange={e => setCampaignForm({...campaignForm, startDate: e.target.value})} 
                    className="input-field"
                  />
                </FormField>
                <FormField label="End Date" id="endDate">
                  <input 
                    id="endDate" type="date" value={campaignForm.endDate} 
                    onChange={e => setCampaignForm({...campaignForm, endDate: e.target.value})} 
                    className="input-field"
                  />
                </FormField>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" isLoading={createCampaign.isPending}>
                  Save Campaign
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      )}

      <Card>
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="p-12">
              <EmptyState icon={Megaphone} title="No Campaigns" description="Get started by creating a new marketing campaign." />
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {campaigns.map(campaign => (
                <li key={campaign.id} className="p-5 hover:bg-[var(--color-surface-alt)] flex justify-between items-center transition-colors">
                  <div>
                    <h3 className="font-bold text-[var(--color-navy-900)] text-lg">{campaign.name}</h3>
                    <p className="text-sm text-[var(--color-text-muted)] max-w-xl truncate mt-1">{campaign.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        campaign.status === 'ACTIVE' || campaign.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {campaign.status}
                      </span>
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-wider">
                        {campaign.channel}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Target: {campaign.targetAudience || 'All'}
                      </span>
                    </div>
                  </div>
                  <div>
                    {campaign.status === 'DRAFT' && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        icon={Send} 
                        onClick={() => sendCampaign.mutate(campaign.id)}
                        isLoading={sendCampaign.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700 border-indigo-700"
                      >
                        Launch
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card.Body>
      </Card>
    </motion.div>
    
  );
};

export default MarketingCampaigns;
