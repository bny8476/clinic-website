import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Teleconsultations = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    preferredDates: '',
    preferredTimes: 'Morning',
    reason: '',
    languagePreference: 'English'
  });

  const { data: teleconsults = [], isLoading } = useQuery({
    queryKey: ['patient-teleconsults'],
    queryFn: async () => {
      try {
          return (await axiosPrivate.get('/v1/patient/teleconsultations')).data;
      } catch(e) {
          throw e;
      }
    }
  });

  const bookMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosPrivate.post('/v1/patient/teleconsultations', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Teleconsultation requested successfully');
      setIsModalOpen(false);
      setFormData({ preferredDates: '', preferredTimes: 'Morning', reason: '', languagePreference: 'English' });
      queryClient.invalidateQueries(['patient-teleconsults']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to book teleconsultation');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    bookMutation.mutate(formData);
  };

  const columns = [
    { key: 'id', title: 'Request ID', render: (val) => <span className="font-mono text-sm">#{val}</span> },
    { key: 'reason', title: 'Reason' },
    { key: 'preferredDates', title: 'Preferred Date' },
    { key: 'status', title: 'Status', render: (val) => (
      <Badge variant={val === 'Completed' ? 'success' : val === 'Requested' ? 'warning' : 'secondary'}>{val}</Badge>
    )},
    { key: 'actions', title: 'Actions', render: (_, row) => (
      row.status === 'Booked' && row.joinLink && (
        <a href={row.joinLink} target="_blank" rel="noreferrer">
          <Button size="sm" className="flex items-center gap-2">
              <PlayCircle size={16} /> Join Waiting Room
          </Button>
        </a>
      )
    )}
  ];

  return (
    <DashboardShell tabs={[]} activeTab="" quickActions={[]}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold m-0 flex items-center gap-2">
            <Video className="text-[var(--color-primary)]" /> Teleconsultations
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage your virtual visits and history.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Book Teleconsult</Button>
      </div>
      
      <DashboardGrid center={
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
            <DataTable columns={columns} data={teleconsults} isLoading={isLoading} emptyTitle="No Teleconsults Found" />
          </div>
      } />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Book Teleconsultation">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Preferred Date" required id="preferredDates">
            <input 
              id="preferredDates"
              type="date"
              className="input-field"
              value={formData.preferredDates}
              onChange={(e) => setFormData({ ...formData, preferredDates: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Preferred Time" required id="preferredTimes">
            <select 
              id="preferredTimes"
              className="input-field"
              value={formData.preferredTimes}
              onChange={(e) => setFormData({ ...formData, preferredTimes: e.target.value })}
            >
              <option value="Morning">Morning (9AM - 12PM)</option>
              <option value="Afternoon">Afternoon (12PM - 4PM)</option>
              <option value="Evening">Evening (4PM - 7PM)</option>
            </select>
          </FormField>
          <FormField label="Language Preference" required id="languagePreference">
            <select 
              id="languagePreference"
              className="input-field"
              value={formData.languagePreference}
              onChange={(e) => setFormData({ ...formData, languagePreference: e.target.value })}
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="Mandarin">Mandarin</option>
            </select>
          </FormField>
          <FormField label="Reason for Visit" required id="reason">
            <textarea 
              id="reason"
              className="input-field min-h-[100px]"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              placeholder="Describe your symptoms or reason for consult..."
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={bookMutation.isPending}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
};
export default Teleconsultations;
