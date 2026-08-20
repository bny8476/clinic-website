import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';

const UploadRecordModal = ({ isOpen, onClose, patientId }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    recordType: 'CONSULTATION_NOTE',
    notes: ''
  });

  React.useEffect(() => {
    let previousFocus = null;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      previousFocus = document.activeElement;
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    };
  }, [isOpen, onClose]);

  const uploadMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post('/medical-records', {
        ...data,
        patientId
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['patientRecords', patientId]);
      setFormData({ title: '', recordType: 'CONSULTATION_NOTE', notes: '' });
      onClose();
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    uploadMutation.mutate(formData);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content card">
        <div className="modal-header">
          <h3>Add Medical Record</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="form-group">
          <div>
            <label className="form-label" htmlFor="recordType">Record Type</label>
            <select
              id="recordType"
              className="form-input"
              value={formData.recordType}
              onChange={(e) => setFormData({ ...formData, recordType: e.target.value })}
            >
              <option value="CONSULTATION_NOTE">Consultation Note</option>
              <option value="LAB_RESULT">Lab Result</option>
              <option value="PRESCRIPTION">Prescription</option>
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              className="form-input"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label" htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              className="form-input"
              rows="5"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            ></textarea>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadRecordModal;
