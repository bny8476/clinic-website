import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import {
  Shield, CheckCircle2, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staggerChildren, fadeIn } from '../../components/ui/motion';



const InsuranceVerificationPage = () => {
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState('');
  const [searchedId, setSearchedId] = useState(null);
  const [formData, setFormData] = useState({
    insuranceProvider: '',
    policyNumber: ''
  });
  const [reviewId, setReviewId] = useState(null);
  const [reviewData, setReviewData] = useState({ status: 'VERIFIED', coverageDetails: '' });

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ['insuranceVerifications', searchedId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/reception/insurance/patient/${searchedId}`);
      return res.data;
    },
    enabled: !!searchedId
  });

  const requestVerification = useMutation({
    mutationFn: async () => {
      const res = await axiosPrivate.post('/reception/insurance/request', {
        patientId: searchedId,
        ...formData
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Insurance verification requested');
      queryClient.invalidateQueries(['insuranceVerifications', searchedId]);
      setFormData({ insuranceProvider: '', policyNumber: '' });
    },
    onError: () => toast.error('Failed to request verification')
  });

  const verifyInsurance = useMutation({
    mutationFn: async (verificationId) => {
      const res = await axiosPrivate.put(`/reception/insurance/${verificationId}/verify`, reviewData);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Insurance verification updated');
      queryClient.invalidateQueries(['insuranceVerifications', searchedId]);
      setReviewId(null);
    },
    onError: () => toast.error('Failed to update verification')
  });

  const statusVariant = (s) => {
    if (s === 'VERIFIED') return 'success';
    if (s === 'REJECTED') return 'danger';
    return 'warning';
  };

  return (
    
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div>
        <Link to="/reception" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Reception Desk
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] flex items-center gap-2">
          <Shield className="w-7 h-7 text-[var(--color-navy-800)]" />
          Insurance Verification
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Request and manage insurance coverage verifications for patients.
        </p>
      </div>

      {/* Patient Search */}
      <Card>
        <Card.Header>
          <h2 className="font-display font-bold text-base text-[var(--color-navy-900)]">Patient Lookup</h2>
        </Card.Header>
        <Card.Body>
          <div className="flex gap-3">
            <Input
              placeholder="Enter Patient ID..."
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="flex-1"
            />
            <Button variant="primary" onClick={() => setSearchedId(patientId || null)} disabled={!patientId}>
              Search
            </Button>
          </div>
        </Card.Body>
      </Card>

      {searchedId && (
        <>
          {/* Request New Verification */}
          <Card>
            <Card.Header>
              <h2 className="font-display font-bold text-lg text-[var(--color-navy-900)] flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Request New Verification
              </h2>
            </Card.Header>
            <Card.Body className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Insurance Provider"
                  placeholder="e.g. BlueCross, Star Health"
                  value={formData.insuranceProvider}
                  onChange={e => setFormData(f => ({ ...f, insuranceProvider: e.target.value }))}
                />
                <Input
                  label="Policy Number"
                  placeholder="e.g. POL-123456"
                  value={formData.policyNumber}
                  onChange={e => setFormData(f => ({ ...f, policyNumber: e.target.value }))}
                />
              </div>
              <Button
                variant="primary"
                icon={Shield}
                isLoading={requestVerification.isPending}
                onClick={() => requestVerification.mutate()}
                disabled={!formData.insuranceProvider || !formData.policyNumber}
              >
                Request Verification
              </Button>
            </Card.Body>
          </Card>

          {/* Verifications List */}
          <Card>
            <Card.Header>
              <h2 className="font-display font-bold text-lg text-[var(--color-navy-900)] flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Verification History
              </h2>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--color-navy-600)]" />
                </div>
              ) : verifications.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="No Verifications"
                  description="No insurance verifications have been requested for this patient."
                />
              ) : (
                <div className="space-y-3">
                  {verifications.map(v => (
                    <motion.div key={v.id} variants={fadeIn} className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)]/40">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[var(--color-navy-900)]">
                              {v.insuranceProvider}
                            </span>
                            <Badge variant={statusVariant(v.status)} size="sm">{v.status}</Badge>
                          </div>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            Policy: {v.policyNumber}
                            {v.coverageDetails && ` | ${v.coverageDetails}`}
                          </p>
                        </div>
                        {v.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              icon={CheckCircle2}
                              onClick={() => {
                                setReviewId(v.id);
                                setReviewData({ status: 'VERIFIED', coverageDetails: '' });
                              }}
                            >
                              Verify
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={XCircle}
                              onClick={() => {
                                setReviewId(v.id);
                                setReviewData({ status: 'REJECTED', coverageDetails: '' });
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>

                      {reviewId === v.id && (
                        <motion.div variants={fadeIn} className="ml-4 p-4 border-l-2 border-[var(--color-primary)] bg-[var(--color-primary-bg)]/20 rounded-r-md space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Status: </span>
                            <select
                              className="h-9 px-3 bg-transparent border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                              value={reviewData.status}
                              onChange={e => setReviewData(d => ({ ...d, status: e.target.value }))}
                            >
                              <option value="VERIFIED">VERIFIED</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                          </div>
                          <Input
                            label="Coverage Details / Notes"
                            placeholder="e.g. Coverage: 80%, Max ₹50,000/year"
                            value={reviewData.coverageDetails}
                            onChange={e => setReviewData(d => ({ ...d, coverageDetails: e.target.value }))}
                          />
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setReviewId(null)}>Cancel</Button>
                            <Button
                              variant="primary"
                              size="sm"
                              isLoading={verifyInsurance.isPending}
                              onClick={() => verifyInsurance.mutate(v.id)}
                            >
                              Submit Review
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </motion.div>
    
  );
};

export default InsuranceVerificationPage;
