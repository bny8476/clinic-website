import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';



const EngagementDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('REVIEWS');

  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      // In a real app we'd have a specific endpoint for fetching ALL reviews (not just published).
      // Re-using the existing one for demo, normally we'd filter or get pending ones.
      // Let's assume there is a /reviews/all endpoint in a real scenario.
      return []; 
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, status }) => await axiosPrivate.put(`/engagement/reviews/${id}/moderate?status=${status}&moderatedByUserId=1`),
    onSuccess: () => {
      toast.success('Review moderated');
      queryClient.invalidateQueries(['admin-reviews']);
    }
  });

  return (
    
    <div className="p-4 sm:p-6" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 className="text-xl sm:text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Engagement Dashboard</h1>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
        {['REVIEWS', 'SURVEY_TEMPLATES', 'PREVENTIVE_CARE', 'WELLNESS_PROGRAMS'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: activeTab === tab ? 700 : 500,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab.replace('_', ' ').toLowerCase()}
          </button>
        ))}
      </div>

      {activeTab === 'REVIEWS' && (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>Review Moderation</h2>
          
          <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Target</th>
                  <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Rating</th>
                  <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Comment</th>
                  <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
                  <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No reviews pending moderation.</td>
                  </tr>
                ) : (
                  reviews.map(review => (
                    <tr key={review.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>{review.targetType} {review.targetId}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={16} color="#eab308" fill="#eab308" />
                          <span>{review.rating}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>{review.reviewText || '-'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', background: 'var(--color-surface-hover)' }}>
                          {review.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => moderateMutation.mutate({ id: review.id, status: 'PUBLISHED' })}
                            style={{ padding: '6px', borderRadius: '4px', background: 'var(--color-success)', color: '#fff', border: 'none', cursor: 'pointer' }}
                            title="Publish"
                          ><Check size={16} /></button>
                          <button 
                            onClick={() => moderateMutation.mutate({ id: review.id, status: 'HIDDEN' })}
                            style={{ padding: '6px', borderRadius: '4px', background: 'var(--color-danger)', color: '#fff', border: 'none', cursor: 'pointer' }}
                            title="Hide"
                          ><X size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab !== 'REVIEWS' && (
        <div style={{ background: 'var(--color-surface)', padding: '40px', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
           <h3 style={{ color: 'var(--color-text)', fontSize: '1.25rem', fontWeight: 600 }}>{activeTab.replace('_', ' ')} Management</h3>
           <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>This section is ready for administrative content population.</p>
        </div>
      )}

    </div>
    
  );
};

export default EngagementDashboard;
