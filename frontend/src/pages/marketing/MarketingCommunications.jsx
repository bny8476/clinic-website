import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Send, MessageSquare, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { fadeIn } from '../../components/ui/motion';
import useAuthStore from '../../store/authStore';



const MarketingCommunications = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [patientId, setPatientId] = useState('');
  const [activePatientId, setActivePatientId] = useState(''); // Patient to fetch history for

  const [form, setForm] = useState({
    channel: 'EMAIL',
    subject: '',
    message: ''
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['communication-history', activePatientId],
    queryFn: async () => {
      if (!activePatientId) return { content: [] };
      const res = await axiosPrivate.get(`/marketing/communications/history?patientId=${activePatientId}`);
      return res.data;
    },
    enabled: !!activePatientId
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        patientId: Number(activePatientId),
        channel: form.channel,
        contentSummary: form.channel === 'EMAIL' ? form.subject : form.message,
        operatorId: user?.userId || 1
      };
      const res = await axiosPrivate.post('/marketing/communications/send', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Communication sent successfully!');
      setForm({ ...form, subject: '', message: '' });
      queryClient.invalidateQueries(['communication-history', activePatientId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send communication');
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!patientId) {
      toast.error('Please enter a Patient ID');
      return;
    }
    setActivePatientId(patientId);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!activePatientId) {
      toast.error('Please select a patient first');
      return;
    }
    if (!form.message) {
      toast.error('Message body is required');
      return;
    }
    sendMutation.mutate();
  };

  const communications = historyData?.content || [];

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
            <MessageSquare className="w-7 h-7 text-indigo-600" />
            Patient Communications
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Send direct messages, appointment reminders, and follow-ups.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <input
            type="number"
            placeholder="Enter Patient ID..."
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="input-field py-2 flex-1"
          />
          <Button type="submit" variant="secondary" icon={Search}>
            Load History
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className={!activePatientId ? 'opacity-50 pointer-events-none' : ''}>
            <Card.Header>
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Send New Message</h2>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleSend} className="space-y-4">
                <FormField label="Communication Channel" id="channel">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" name="channel" value="EMAIL" 
                        checked={form.channel === 'EMAIL'} 
                        onChange={e => setForm({...form, channel: e.target.value})} 
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <Mail size={16} className="text-slate-500" /> Email
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" name="channel" value="SMS" 
                        checked={form.channel === 'SMS'} 
                        onChange={e => setForm({...form, channel: e.target.value})} 
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <Smartphone size={16} className="text-slate-500" /> SMS Text
                    </label>
                  </div>
                </FormField>

                {form.channel === 'EMAIL' && (
                  <FormField label="Subject" required id="subject">
                    <input 
                      id="subject" type="text" value={form.subject} 
                      onChange={e => setForm({...form, subject: e.target.value})} 
                      className="input-field" placeholder="Message Subject"
                    />
                  </FormField>
                )}

                <FormField label="Message Body" required id="message">
                  <textarea 
                    id="message" value={form.message} 
                    onChange={e => setForm({...form, message: e.target.value})} 
                    className="input-field min-h-[120px]" placeholder="Type your message here..." required
                  />
                </FormField>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" variant="primary" icon={Send} isLoading={sendMutation.isPending}>
                    Send Message
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <Card.Header>
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Communication History {activePatientId && `(Patient ${activePatientId})`}</h2>
            </Card.Header>
            <Card.Body className="p-0">
              {!activePatientId ? (
                 <div className="p-8"><EmptyState icon={Search} title="No Patient Selected" description="Enter a patient ID to view history." /></div>
              ) : isLoadingHistory ? (
                <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading history...</div>
              ) : communications.length === 0 ? (
                <div className="p-8"><EmptyState icon={MessageSquare} title="No History Found" description="This patient has no recorded communications." /></div>
              ) : (
                <ul className="divide-y divide-[var(--color-border)] max-h-[500px] overflow-y-auto">
                  {communications.map(comm => (
                    <li key={comm.id} className="p-4 hover:bg-[var(--color-surface-alt)]">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-[var(--color-navy-900)] text-sm">{comm.channel}</h3>
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {comm.eventType}
                            </span>
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {comm.direction}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">
                            {comm.contentSummary}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-2">
                            {new Date(comm.eventTimestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </motion.div>
    
  );
};

export default MarketingCommunications;
