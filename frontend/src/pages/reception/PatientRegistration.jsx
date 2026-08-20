import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Save, UserPlus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer } from '../../components/ui/motion';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';



const PatientRegistration = () => {
  const [patient, setPatient] = useState({
    firstName: '', lastName: '', age: '', gender: 'Male', phone: '', email: '',
    address: '', bloodGroup: 'O+', emergencyContact: '', reasonForVisit: ''
  });

  const registerPatient = useMutation({
    mutationFn: async () => axiosPrivate.post('/reception/patients/register', patient),
    onSuccess: (data) => {
      toast.success(`Patient registered successfully! OP Number: ${data.data.opNumber}`);
      setPatient({ firstName: '', lastName: '', age: '', gender: 'Male', phone: '', email: '', address: '', bloodGroup: 'O+', emergencyContact: '', reasonForVisit: '' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to register patient');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patient.firstName || !patient.phone) {
      toast.error('First Name and Phone are required fields');
      return;
    }
    registerPatient.mutate();
  };

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/reception" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reception Desk
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <UserPlus className="w-7 h-7 text-[var(--color-navy-800)]" />
            Patient Registration
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Enter new patient details for intake and clinical record creation.
          </p>
        </div>
      </div>

      <Card>
        <Card.Body>
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div variants={fadeIn}>
              <FormField label="First Name" required id="firstName">
                <input 
                  id="firstName"
                  type="text"
                  value={patient.firstName} 
                  onChange={e => setPatient({ ...patient, firstName: e.target.value })} 
                  placeholder="e.g. Ramesh" 
                  className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" 
                  required
                />
              </FormField>
              </motion.div>

              <motion.div variants={fadeIn}>
              <FormField label="Last Name" id="lastName">
                <input 
                  id="lastName"
                  type="text"
                  value={patient.lastName} 
                  onChange={e => setPatient({ ...patient, lastName: e.target.value })} 
                  placeholder="e.g. Kumar" 
                  className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" 
                />
              </FormField>
              </motion.div>

              <motion.div variants={fadeIn}>
              <FormField label="Phone Number" required id="phone">
                <input 
                  id="phone"
                  type="tel"
                  value={patient.phone} 
                  onChange={e => setPatient({ ...patient, phone: e.target.value })} 
                  placeholder="+91 98765 43210" 
                  className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" 
                  required
                />
              </FormField>
              </motion.div>

              <motion.div variants={fadeIn}>
              <FormField label="Age" id="age">
                <input 
                  id="age"
                  type="number" 
                  value={patient.age} 
                  onChange={e => setPatient({ ...patient, age: e.target.value })} 
                  placeholder="e.g. 35"
                  className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" 
                />
              </FormField>
              </motion.div>

              <motion.div variants={fadeIn}>
              <FormField label="Email Address" id="email">
                <input 
                  id="email"
                  type="email"
                  value={patient.email} 
                  onChange={e => setPatient({ ...patient, email: e.target.value })} 
                  placeholder="e.g. email@example.com"
                  className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" 
                />
              </FormField>
              </motion.div>

              <motion.div variants={fadeIn}>
              <FormField label="Address" id="address">
                <input 
                  id="address"
                  type="text"
                  value={patient.address} 
                  onChange={e => setPatient({ ...patient, address: e.target.value })} 
                  placeholder="e.g. 123 Main St"
                  className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" 
                />
              </FormField>
              </motion.div>

              <motion.div variants={fadeIn}>
              <FormField label="Gender" id="gender">
                <select 
                  id="gender"
                  value={patient.gender} 
                  onChange={e => setPatient({ ...patient, gender: e.target.value })} 
                  className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </FormField>
              </motion.div>

              <motion.div variants={fadeIn}>
              <FormField label="Blood Group" id="bloodGroup">
                <select 
                  id="bloodGroup"
                  value={patient.bloodGroup} 
                  onChange={e => setPatient({ ...patient, bloodGroup: e.target.value })} 
                  className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg}>{bg}</option>
                  ))}
                </select>
              </FormField>
              </motion.div>

              <motion.div variants={fadeIn}>
              <FormField label="Emergency Contact" id="emergencyContact">
                <input 
                  id="emergencyContact"
                  type="tel"
                  value={patient.emergencyContact} 
                  onChange={e => setPatient({ ...patient, emergencyContact: e.target.value })} 
                  placeholder="Emergency Phone Number"
                  className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" 
                />
              </FormField>
              </motion.div>

              <motion.div variants={fadeIn}>
              <FormField label="Reason for Visit" required id="reasonForVisit">
                <input 
                  id="reasonForVisit"
                  type="text"
                  value={patient.reasonForVisit} 
                  onChange={e => setPatient({ ...patient, reasonForVisit: e.target.value })} 
                  placeholder="e.g. Fever and Cough"
                  className="input-field focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" 
                  required
                />
              </FormField>
              </motion.div>
            </motion.div>

            <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
              <Link to="/reception">
                <Button variant="secondary">Cancel</Button>
              </Link>
              <Button 
                type="submit" 
                variant="primary" 
                icon={Save}
                isLoading={registerPatient.isPending}
              >
                Register Patient
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </motion.div>
    
  );
};

export default PatientRegistration;
