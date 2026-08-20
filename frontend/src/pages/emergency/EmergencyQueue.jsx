import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { AlertCircle, UserPlus, ArrowRight, Syringe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

import { staggerChildren } from '../../components/ui/motion';



const EmergencyQueue = () => {
  const [filter, setFilter] = useState('ALL');
  const [activeModal, setActiveModal] = useState(null); // 'REGISTER', 'TRIAGE', 'ASSIGN_MD', 'DISPOSITION'
  const [selectedEncounter, setSelectedEncounter] = useState(null);
  
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: encounters = [], isLoading } = useQuery({
    queryKey: ['emergency-encounters', filter],
    queryFn: async () => {
      let url = '/emergency/encounters';
      if (filter !== 'ALL') {
        url += `?status=${filter}`;
      }
      const res = await axiosPrivate.get(url);
      return res.data;
    },
    refetchInterval: 30000 
  });

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post('/emergency/encounters', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Patient registered in ED');
      queryClient.invalidateQueries({ queryKey: ['emergency-encounters'] });
      closeModal();
    }
  });

  const triageMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post(`/emergency/encounters/${selectedEncounter.id}/triage`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Triage completed');
      queryClient.invalidateQueries({ queryKey: ['emergency-encounters'] });
      closeModal();
    }
  });

  const assignMdMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post(`/emergency/encounters/${selectedEncounter.id}/assign-doctor`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Doctor assigned');
      queryClient.invalidateQueries({ queryKey: ['emergency-encounters'] });
      closeModal();
    }
  });

  const dispositionMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post(`/emergency/encounters/${selectedEncounter.id}/disposition`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Disposition saved');
      queryClient.invalidateQueries({ queryKey: ['emergency-encounters'] });
      closeModal();
    }
  });

  const openModal = (type, encounter = null) => {
    setSelectedEncounter(encounter);
    setActiveModal(type);
    setFormData({});
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedEncounter(null);
    setFormData({});
  };

  const handleAction = (e) => {
    if (e) e.preventDefault();
    if (activeModal === 'REGISTER') {
      registerMutation.mutate({
        patientId: formData.patientId || null,
        arrivalMode: formData.arrivalMode || 'WALK_IN'
      });
    } else if (activeModal === 'TRIAGE') {
      triageMutation.mutate({
        triageLevel: formData.triageLevel || 'URGENT',
        chiefComplaint: formData.chiefComplaint || ''
      });
    } else if (activeModal === 'ASSIGN_MD') {
      assignMdMutation.mutate({
        doctorId: formData.doctorId || 1
      });
    } else if (activeModal === 'DISPOSITION') {
      dispositionMutation.mutate({
        disposition: formData.disposition || 'ADMITTED'
      });
    }
  };

  const columns = [
    {
      key: 'arrivedAt',
      title: 'Wait Time',
      render: (_, row) => (
        <div>
          <div className="flex items-center gap-1.5 text-[var(--color-navy-800)] font-medium text-sm">
            <Clock size={14} />
            {formatDistanceToNow(new Date(row.arrivedAt))}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">
            {new Date(row.arrivedAt).toLocaleTimeString()}
          </div>
        </div>
      )
    },
    {
      key: 'patient',
      title: 'Patient',
      render: (val, row) => row.patient ? (
        <div>
          <div className="font-bold text-[var(--color-navy-900)]">
            {row.patient.firstName} {row.patient.lastName}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {row.patient.gender} • {new Date().getFullYear() - new Date(row.patient.dateOfBirth).getFullYear()}y
          </div>
        </div>
      ) : (
        <div className="font-bold text-[var(--color-text-muted)] italic">Unidentified Patient</div>
      )
    },
    {
      key: 'arrivalMode',
      title: 'Arrival Mode',
      render: (val) => (
        <div className="flex items-center gap-1.5 text-sm text-[var(--color-text)]">
          {val === 'AMBULANCE' ? <Ambulance size={16} className="text-[var(--color-danger)]" /> : <UserPlus size={16} className="text-[var(--color-info)]" />}
          {val}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Acuity / Status',
      render: (val) => {
        let variant = 'info';
        if (val === 'REGISTERED') variant = 'default';
        else if (val === 'IN_TREATMENT') variant = 'success';
        else if (val === 'IN_TRIAGE') variant = 'warning';
        return (
          <Badge variant={variant}>
            {val === 'REGISTERED' ? 'PENDING TRIAGE' : val}
          </Badge>
        );
      }
    },
    {
      key: 'assignedDoctor',
      title: 'Provider',
      render: (val) => val ? `Dr. ${val.userId}` : <span className="text-[var(--color-text-muted)] italic">Unassigned</span>
    },
    {
      key: 'actions',
      title: 'Action',
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          {row.status === 'REGISTERED' && (
            <Button size="sm" variant="ghost" className="text-[var(--color-warning)] hover:text-[var(--color-warning)]" icon={ArrowRight} iconPosition="right" onClick={() => openModal('TRIAGE', row)}>
              Triage
            </Button>
          )}
          {row.status === 'IN_TRIAGE' && (
            <Button size="sm" variant="ghost" className="text-[var(--color-info)] hover:text-[var(--color-info)]" icon={ArrowRight} iconPosition="right" onClick={() => openModal('ASSIGN_MD', row)}>
              Assign MD
            </Button>
          )}
          {row.status === 'IN_TREATMENT' && (
            <>
              <Button size="sm" variant="ghost" icon={Syringe} title="Orders" />
              <Button size="sm" variant="primary" icon={ArrowRight} iconPosition="right" onClick={() => openModal('DISPOSITION', row)}>
                Disposition
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    
    <motion.div initial="hidden" animate="visible" variants={staggerChildren} className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--color-navy-900)] flex items-center gap-2 m-0">
            <AlertCircle className="text-[var(--color-danger)]" />
            Emergency Department Queue
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm m-0 mt-1">Live triage and patient tracking for the ED.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="danger" icon={UserPlus} onClick={() => openModal('REGISTER')}>
            Register Patient
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'All Patients', value: 'ALL', count: encounters?.length || 0, color: 'text-[var(--color-info)] border-[var(--color-info)]/30 bg-[var(--color-info-bg)]' },
          { label: 'Waiting Triage', value: 'REGISTERED', count: encounters?.filter(e => e.status === 'REGISTERED').length || 0, color: 'text-[var(--color-text)] border-[var(--color-border)] bg-[var(--color-surface-alt)]' },
          { label: 'In Triage', value: 'IN_TRIAGE', count: encounters?.filter(e => e.status === 'IN_TRIAGE').length || 0, color: 'text-[var(--color-warning)] border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)]' },
          { label: 'In Treatment', value: 'IN_TREATMENT', count: encounters?.filter(e => e.status === 'IN_TREATMENT').length || 0, color: 'text-[var(--color-success)] border-[var(--color-success)]/30 bg-[var(--color-success-bg)]' },
        ].map(stat => (
          <div 
            key={stat.value}
            onClick={() => setFilter(stat.value)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${
              filter === stat.value ? stat.color : 'bg-[var(--color-surface)] border-transparent hover:border-[var(--color-border)] shadow-sm'
            }`}
          >
            <p className="text-sm font-semibold opacity-80 m-0">{stat.label}</p>
            <p className="text-2xl font-bold font-display m-0 mt-1">{stat.count}</p>
          </div>
        ))}
      </div>

      <Card>
        <Card.Body className="p-0">
          <DataTable 
             columns={columns}
             data={encounters}
             isLoading={isLoading}
             emptyTitle="Queue Empty"
             emptyDescription="No patients are currently in the emergency queue."
             emptyIcon={AlertCircle}
          />
        </Card.Body>
      </Card>

      {activeModal && (
        <Modal 
          isOpen={true} 
          onClose={closeModal} 
          title={
            activeModal === 'REGISTER' ? 'Register ER Patient' :
            activeModal === 'TRIAGE' ? 'Perform Triage' :
            activeModal === 'ASSIGN_MD' ? 'Assign Doctor' :
            'Set Disposition'
          }
        >
          <form onSubmit={handleAction} className="space-y-4 pt-2">
            {activeModal === 'REGISTER' && (
              <>
                <FormField label="Patient ID (Optional for Unknown)">
                  <input 
                    type="number" 
                    value={formData.patientId || ''}
                    onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                    className="input-field" 
                    placeholder="e.g. 101"
                  />
                </FormField>
                <FormField label="Arrival Mode">
                  <select 
                    value={formData.arrivalMode || 'WALK_IN'}
                    onChange={(e) => setFormData({...formData, arrivalMode: e.target.value})}
                    className="input-field cursor-pointer"
                  >
                    <option value="WALK_IN">Walk In</option>
                    <option value="AMBULANCE">Ambulance</option>
                    <option value="POLICE">Police</option>
                    <option value="OTHER">Other</option>
                  </select>
                </FormField>
              </>
            )}

            {activeModal === 'TRIAGE' && (
              <>
                <FormField label="Triage Level">
                  <select 
                    value={formData.triageLevel || 'URGENT'}
                    onChange={(e) => setFormData({...formData, triageLevel: e.target.value})}
                    className="input-field cursor-pointer"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="URGENT">Urgent</option>
                    <option value="SEMI_URGENT">Semi-Urgent</option>
                    <option value="NON_URGENT">Non-Urgent</option>
                  </select>
                </FormField>
                <FormField label="Chief Complaint">
                  <textarea 
                    value={formData.chiefComplaint || ''}
                    onChange={(e) => setFormData({...formData, chiefComplaint: e.target.value})}
                    className="input-field" 
                    rows="3"
                  />
                </FormField>
              </>
            )}

            {activeModal === 'ASSIGN_MD' && (
              <FormField label="Doctor ID">
                <input 
                  type="number" 
                  value={formData.doctorId || ''}
                  onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                  className="input-field" 
                  placeholder="e.g. 1"
                />
              </FormField>
            )}

            {activeModal === 'DISPOSITION' && (
              <FormField label="Disposition Outcome">
                <select 
                  value={formData.disposition || 'ADMITTED'}
                  onChange={(e) => setFormData({...formData, disposition: e.target.value})}
                  className="input-field cursor-pointer"
                >
                  <option value="ADMITTED">Admitted (Inpatient)</option>
                  <option value="DISCHARGED">Discharged Home</option>
                  <option value="TRANSFERRED">Transferred to another facility</option>
                  <option value="DECEASED">Deceased</option>
                  <option value="LAMA">Left Against Medical Advice</option>
                </select>
              </FormField>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)] mt-6">
              <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button type="submit" variant="primary">Confirm</Button>
            </div>
          </form>
        </Modal>
      )}

    </motion.div>
    
  );
};

export default EmergencyQueue;
