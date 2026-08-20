import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import {
  FileText, Plus, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staggerChildren, fadeIn } from '../../components/ui/motion';



const DOC_TYPES = ['Lab Report', 'Prescription', 'Medical Record', 'Radiology', 'Referral Letter', 'Other'];

const DocumentScanning = () => {
  const queryClient = useQueryClient();
  const [patientProfileId, setPatientProfileId] = useState('');
  const [searchedId, setSearchedId] = useState(null);
  const [branchId] = useState(1); // Can be made dynamic via auth store
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    documentType: 'Lab Report',
    fileUrl: '',
    scanDevice: '',
    notes: ''
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['receptionDocs', searchedId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/reception/kiosk/patient/${searchedId}/documents`);
      return res.data;
    },
    enabled: !!searchedId
  });

  const uploadDocument = useMutation({
    mutationFn: async () => {
      const res = await axiosPrivate.post(`/reception/kiosk/branch/${branchId}/documents`, {
        patientProfileId: searchedId,
        ...form
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries(['receptionDocs', searchedId]);
      setShowForm(false);
      setForm({ title: '', documentType: 'Lab Report', fileUrl: '', scanDevice: '', notes: '' });
    },
    onError: () => toast.error('Upload failed')
  });

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
          <FileText className="w-7 h-7 text-[var(--color-navy-800)]" />
          Document Scanning
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Scan and upload patient documents at the reception desk.
        </p>
      </div>

      {/* Patient Lookup */}
      <Card>
        <Card.Header>
          <h2 className="font-display font-bold text-base text-[var(--color-navy-900)]">Patient Lookup</h2>
        </Card.Header>
        <Card.Body>
          <div className="flex gap-3">
            <Input
              placeholder="Enter Patient Profile ID..."
              value={patientProfileId}
              onChange={e => setPatientProfileId(e.target.value)}
              className="flex-1"
            />
            <Button variant="primary" onClick={() => setSearchedId(patientProfileId || null)} disabled={!patientProfileId}>
              Load
            </Button>
          </div>
        </Card.Body>
      </Card>

      {searchedId && (
        <>
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between w-full">
                <h2 className="font-display font-bold text-lg text-[var(--color-navy-900)] flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Patient Documents
                </h2>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowForm(true)}>
                  Scan New Document
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--color-navy-600)]" />
                </div>
              ) : documents.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No Documents"
                  description="No documents have been uploaded for this patient."
                />
              ) : (
                <div className="space-y-3">
                  {documents.map(doc => (
                    <motion.div
                      key={doc.id}
                      variants={fadeIn}
                      className="flex items-center justify-between p-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)]/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-[var(--color-primary-bg)]/20 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[var(--color-primary)]" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[var(--color-navy-900)]">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="info" size="sm">{doc.documentType}</Badge>
                            <span className="text-xs text-[var(--color-text-muted)]">
                              {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown date'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[var(--color-primary)] hover:underline font-semibold"
                      >
                        View
                      </a>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Upload Form */}
          {showForm && (
            <motion.div variants={fadeIn}>
              <Card>
                <Card.Header>
                  <h2 className="font-display font-bold text-lg text-[var(--color-navy-900)] flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Scanned Document
                  </h2>
                </Card.Header>
                <Card.Body className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Document Title"
                      placeholder="e.g. Blood Test Report"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    />
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-[var(--color-navy-900)]">Document Type</label>
                      <select
                        className="w-full h-10 px-3 py-2 bg-transparent border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                        value={form.documentType}
                        onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))}
                      >
                        {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <Input
                      label="File URL / Path"
                      placeholder="https://... or leave blank for placeholder"
                      value={form.fileUrl}
                      onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                    />
                    <Input
                      label="Scan Device (optional)"
                      placeholder="e.g. Fuji Scanner S2"
                      value={form.scanDevice}
                      onChange={e => setForm(f => ({ ...f, scanDevice: e.target.value }))}
                    />
                  </div>
                  <Input
                    label="Notes (optional)"
                    placeholder="Any notes about this document..."
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                  <div className="flex gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                    <Button
                      variant="primary"
                      icon={CheckCircle2}
                      isLoading={uploadDocument.isPending}
                      onClick={() => uploadDocument.mutate()}
                      disabled={!form.title}
                    >
                      Upload Document
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
    
  );
};

export default DocumentScanning;
