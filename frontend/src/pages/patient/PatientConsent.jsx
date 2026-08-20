import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useState } from 'react';

const PatientConsent = () => {
  const queryClient = useQueryClient();

  const { data: versions, isLoading: loadingVersions } = useQuery({
    queryKey: ['consent-versions'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/v1/patient/settings/consents/versions');
      return res.data;
    }
  });

  const { data: consents, isLoading: loadingConsents } = useQuery({
    queryKey: ['patient-consents'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/v1/patient/settings/consents');
      return res.data;
    }
  });

  const grantMutation = useMutation({
    mutationFn: async (consentType) => {
      await axiosPrivate.post(`/v1/patient/settings/consents/${consentType}`);
    },
    onSuccess: () => queryClient.invalidateQueries(['patient-consents'])
  });

  const revokeMutation = useMutation({
    mutationFn: async (consentType) => {
      await axiosPrivate.delete(`/v1/patient/settings/consents/${consentType}`);
    },
    onSuccess: () => queryClient.invalidateQueries(['patient-consents'])
  });

  const isGranted = (consentType) => {
    const consent = consents?.find(c => c.consentVersion?.consentType === consentType);
    return consent?.isGranted || false;
  };

  if (loadingVersions || loadingConsents) return <div className="p-8 text-center text-slate-500">Loading consents...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-blue-600 h-8 w-8" />
        <h2 className="text-2xl font-bold text-slate-800">Digital Consents & Agreements</h2>
      </div>

      <div className="grid gap-6">
        {versions?.map(version => (
          <div key={version.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{version.consentType.replace(/_/g, ' ')}</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full mt-1 inline-block">
                  Version: {version.versionId}
                </span>
              </div>
              <div>
                {isGranted(version.consentType) ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full text-sm">
                    <CheckCircle size={16} /> Granted
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full text-sm">
                    <XCircle size={16} /> Not Granted
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 leading-relaxed max-h-40 overflow-y-auto mb-4 border border-slate-200">
              {version.documentText}
            </div>

            <div className="flex justify-end">
              {isGranted(version.consentType) ? (
                <button 
                  onClick={() => setConfirmRevoke({ isOpen: true, consentType: version.consentType })}
                  disabled={revokeMutation.isPending}
                  className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Revoke Consent
                </button>
              ) : (
                <button 
                  onClick={() => grantMutation.mutate(version.consentType)}
                  disabled={grantMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Grant Consent
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog 
        isOpen={confirmRevoke.isOpen}
        onClose={() => setConfirmRevoke({ isOpen: false, consentType: null })}
        onConfirm={() => {
          if (confirmRevoke.consentType) {
            revokeMutation.mutate(confirmRevoke.consentType);
            setConfirmRevoke({ isOpen: false, consentType: null });
          }
        }}
        title="Revoke Consent"
        description="Are you sure you want to revoke this consent?"
        confirmText="Revoke"
        isDestructive={true}
        isLoading={revokeMutation.isPending}
      />
    </div>
  );
};

export default PatientConsent;
