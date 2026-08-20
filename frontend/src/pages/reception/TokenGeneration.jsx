import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logger from '../../utils/logger';
import { Ticket, Printer, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fadeIn, staggerChildren } from '../../components/ui/motion';
import useAuthStore from '../../store/authStore';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';


const TokenGeneration = () => {
  const [issuedToken, setIssuedToken] = useState(null);
  const [walkIns, setWalkIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  
  const user = useAuthStore(state => state.user);
  const branchId = user?.branchId || 1;

  const fetchWalkIns = async () => {
    try {
      setLoading(true);
      const res = await axiosPrivate.get(`/reception/branches/${branchId}/walk-ins`);
      setWalkIns(res.data || []);
    } catch (err) {
      toast.error('Failed to load walk-in registrations');
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalkIns();
  }, [branchId]);

  const issueToken = async (walkIn) => {
    try {
      setIssuing(true);
      const res = await axiosPrivate.post(`/reception/branches/${branchId}/queue/generate?walkInId=${walkIn.id}`);
      
      const token = {
        tokenNumber: `T-${res.data.tokenNumber}`,
        department: walkIn.reasonForVisit || 'General OPD',
        doctor: walkIn.patient?.firstName 
          ? `${walkIn.patient.firstName} ${walkIn.patient.lastName}` 
          : `${walkIn.firstName} ${walkIn.lastName}`,
        issuedAt: new Date(res.data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      
      setIssuedToken(token);
      toast.success(`Token ${token.tokenNumber} issued successfully`);
      
      // Optionally refresh the list to remove the walk-in if it changes status, 
      // but the backend keeps it WAITING until called, so we don't strictly need to.
    } catch (err) {
      toast.error('Failed to issue token');
      logger.error(err);
    } finally {
      setIssuing(false);
    }
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
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
          <Ticket className="w-7 h-7 text-[var(--color-navy-800)]" />
          Issue Queue Token
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
          Generate physical print tokens for walk-in patient consultation and queues.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Walk-in Selection */}
        <Card className="md:col-span-2">
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-[var(--color-navy-900)] m-0">
                Pending Walk-in Registrations
              </h2>
              <Button variant="outline" size="sm" onClick={fetchWalkIns}>Refresh</Button>
            </div>
          </Card.Header>
          <Card.Body className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--color-navy-600)]" />
              </div>
            ) : walkIns.length === 0 ? (
              <EmptyState 
                icon={Ticket}
                title="No Walk-ins"
                description="There are no pending walk-in registrations."
              />
            ) : (
              walkIns.map((w) => {
                const name = w.patient ? `${w.patient.firstName} ${w.patient.lastName}` : `${w.firstName} ${w.lastName}`;
                return (
                  <div 
                    key={w.id} 
                    className="flex items-center justify-between p-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 hover:bg-[var(--color-surface-alt)] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-[var(--color-navy-900)] m-0">
                          {name}
                        </h3>
                        <Badge variant="info" size="sm">{w.opNumber}</Badge>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] m-0 mt-0.5">
                        {w.reasonForVisit || 'General Consultation'}
                      </p>
                    </div>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => issueToken(w)}
                      disabled={issuing}
                    >
                      Issue Token
                    </Button>
                  </div>
                );
              })
            )}
          </Card.Body>
        </Card>

        {/* Issued Slip Preview */}
        <Card className="md:col-span-1 flex flex-col justify-between">
          <Card.Header>
            <h2 className="font-display font-bold text-base text-[var(--color-navy-900)] m-0">
              Token Slip Preview
            </h2>
          </Card.Header>
          <Card.Body className="flex-1 flex flex-col items-center justify-center">
            {issuedToken ? (
              <motion.div 
                variants={fadeIn}
                className="w-full p-5 rounded-md border-2 border-dashed border-[var(--color-warning)] bg-[var(--color-warning-bg)]/40 text-center space-y-2"
              >
                <Badge variant="warning" size="sm">Aurelian Health Clinic</Badge>
                <h2 className="text-4xl font-extrabold font-display text-[var(--color-warning)] tracking-wider m-0 py-1">
                  {issuedToken.tokenNumber}
                </h2>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-[var(--color-navy-900)] m-0">
                    {issuedToken.doctor}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] m-0">
                    {issuedToken.department}
                  </p>
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)] m-0 pt-2 border-t border-[var(--color-warning)]/20">
                  Issued at {issuedToken.issuedAt}
                </p>
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    icon={Printer}
                    onClick={() => window.print()}
                    fullWidth
                  >
                    Print Slip
                  </Button>
                </div>
              </motion.div>
            ) : (
              <EmptyState 
                icon={Ticket}
                title="No Token Issued"
                description="Click 'Issue Token' on any walk-in to generate a slip preview."
              />
            )}
          </Card.Body>
        </Card>
      </div>
    </motion.div>
  );
};

export default TokenGeneration;
