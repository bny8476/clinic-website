import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';

// In a real implementation this might load template questions dynamically.
// For now, a generic satisfaction survey UI.
const SurveyResponse = () => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const templateId = 1; // Assuming default survey template
  const patientId = 1; // Simulated patient

  const submitMutation = useMutation({
    mutationFn: async (payload) => await axiosPrivate.post(`/engagement/surveys/${templateId}/responses`, payload),
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Survey submitted successfully');
    },
    onError: () => toast.error('Failed to submit survey')
  });

  if (submitted) {
    return (
      <div className="p-4 sm:p-6" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <div style={{ background: 'var(--color-surface)', padding: '40px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <h2 style={{ color: 'var(--color-success)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>Thank you!</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>Your feedback is invaluable in helping us improve our care.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className="text-xl sm:text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Post-Visit Survey</h1>

      <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>
            How would you rate your recent experience?
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '2rem',
                  cursor: 'pointer',
                  color: rating >= star ? '#eab308' : 'var(--color-border)'
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>
            Any additional comments?
          </label>
          <textarea 
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
            placeholder="Tell us what went well, or what could be improved..."
          />
        </div>

        <button 
          onClick={() => submitMutation.mutate({ patientId, answers: JSON.stringify({ rating, feedback }) })}
          disabled={rating === 0 || submitMutation.isLoading}
          style={{ width: '100%', padding: '14px', borderRadius: '8px', background: rating > 0 ? 'var(--color-primary)' : 'var(--color-surface-hover)', color: rating > 0 ? '#fff' : 'var(--color-text-muted)', border: 'none', fontWeight: 600, cursor: rating > 0 ? 'pointer' : 'not-allowed' }}
        >
          {submitMutation.isLoading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );
};

export default SurveyResponse;
