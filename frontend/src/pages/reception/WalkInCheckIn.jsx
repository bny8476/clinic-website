import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { fadeIn } from '../../components/ui/motion';



const WalkInCheckIn = () => {
  const queryClient = useQueryClient();
  const branchId = 1; // Assuming branch 1 for now or fetch from context

  const [walkInForm, setWalkInForm] = useState({
    patientId: '',
    firstName: '',
    lastName: '',
    phone: '',
    reasonForVisit: ''
  });

  const { data: walkIns = [], isLoading } = useQuery({
    queryKey: ['reception-walk-ins', branchId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/reception/branches/${branchId}/walk-ins`);
      return res.data;
    }
  });

  const registerWalkIn = useMutation({
    mutationFn: async (data) => {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        reasonForVisit: data.reasonForVisit
      };
      if (data.patientId) {
        payload.patient = { id: parseInt(data.patientId) };
      }
      
      const res = await axiosPrivate.post(`/reception/branches/${branchId}/walk-ins`, payload);
      const walkIn = res.data;
      const tokenRes = await axiosPrivate.post(`/reception/branches/${branchId}/queue/generate?walkInId=${walkIn.id}`);
      return { walkIn, token: tokenRes.data };
    },
    onSuccess: (data) => {
      toast.success(`OP Registered! OP No: ${data.walkIn.opNumber} | Token No: ${data.token.tokenNumber}`);
      setWalkInForm({ patientId: '', firstName: '', lastName: '', phone: '', reasonForVisit: '' });
      queryClient.invalidateQueries({ queryKey: ['reception-walk-ins', branchId] });
      queryClient.invalidateQueries({ queryKey: ['reception-queue', branchId] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to register walk-in');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!walkInForm.patientId && (!walkInForm.firstName || !walkInForm.phone)) {
      toast.error('First Name and Phone are required for unregistered patients');
      return;
    }
    registerWalkIn.mutate(walkInForm);
  };

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/reception" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reception Desk
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <Clock className="w-7 h-7 text-[var(--color-navy-800)]" />
            Walk-In Check-In
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Register arrival for existing or quick walk-in patients and generate queue tokens.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <h2 className="text-lg font-bold text-[var(--color-navy-900)]">New Walk-In</h2>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Existing Patient ID (optional)" id="patientId">
                <input 
                  id="patientId"
                  type="text"
                  value={walkInForm.patientId} 
                  onChange={e => setWalkInForm({ ...walkInForm, patientId: e.target.value })} 
                  placeholder="e.g. 12" 
                  className="input-field" 
                />
              </FormField>
              
              {!walkInForm.patientId && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="First Name" required id="firstName">
                    <input 
                      id="firstName"
                      type="text"
                      value={walkInForm.firstName} 
                      onChange={e => setWalkInForm({ ...walkInForm, firstName: e.target.value })} 
                      placeholder="First Name" 
                      className="input-field" 
                      required
                    />
                  </FormField>
                  <FormField label="Last Name" id="lastName">
                    <input 
                      id="lastName"
                      type="text"
                      value={walkInForm.lastName} 
                      onChange={e => setWalkInForm({ ...walkInForm, lastName: e.target.value })} 
                      placeholder="Last Name" 
                      className="input-field" 
                    />
                  </FormField>
                  <div className="col-span-2">
                    <FormField label="Phone Number" required id="phone">
                      <input 
                        id="phone"
                        type="tel"
                        value={walkInForm.phone} 
                        onChange={e => setWalkInForm({ ...walkInForm, phone: e.target.value })} 
                        placeholder="Phone Number" 
                        className="input-field" 
                        required
                      />
                    </FormField>
                  </div>
                </div>
              )}

              <FormField label="Reason for Visit" id="reasonForVisit">
                <textarea 
                  id="reasonForVisit"
                  value={walkInForm.reasonForVisit} 
                  onChange={e => setWalkInForm({ ...walkInForm, reasonForVisit: e.target.value })} 
                  placeholder="Brief reason for visit"
                  className="input-field min-h-[80px]" 
                />
              </FormField>

              <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
                <Button 
                  type="submit" 
                  variant="primary" 
                  icon={Save}
                  isLoading={registerWalkIn.isPending}
                  className="w-full"
                >
                  Register OP & Generate Token
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Today's Walk-Ins (Waiting)</h2>
          </Card.Header>
          <Card.Body className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading...</div>
            ) : walkIns.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">No waiting walk-in patients.</div>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {walkIns.map(w => (
                  <li key={w.id} className="p-4 hover:bg-[var(--color-surface-alt)] transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-[var(--color-navy-900)] text-sm">
                          {w.patient ? w.patient.name : `${w.firstName} ${w.lastName || ''}`}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          OP: {w.opNumber} {w.phone ? `• ${w.phone}` : ''}
                        </p>
                      </div>
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {w.status}
                      </span>
                    </div>
                    {w.reasonForVisit && (
                      <p className="text-xs text-[var(--color-text)] mt-2 bg-[var(--color-surface)] p-2 rounded border border-[var(--color-border)]">
                        {w.reasonForVisit}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>
      </div>
    </motion.div>
    
  );
};

export default WalkInCheckIn;
