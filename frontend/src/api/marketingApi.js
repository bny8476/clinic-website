import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from './axios';

const BASE = '/api/marketing';

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const useMarketingDashboard = (branchId) =>
  useQuery({
    queryKey: ['marketing-dashboard', branchId],
    queryFn: async () => (await axiosPrivate.get(`${BASE}/dashboard`, { params: { branchId } })).data,
    staleTime: 30_000,
  });

// ─── Campaigns ───────────────────────────────────────────────────────────────
export const useCampaigns = () =>
  useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => (await axiosPrivate.get(`${BASE}/campaigns`)).data,
  });

export const useCampaignAnalytics = (id) =>
  useQuery({
    queryKey: ['campaign-analytics', id],
    queryFn: async () => (await axiosPrivate.get(`${BASE}/campaigns/${id}/analytics`)).data,
    enabled: !!id,
  });

export const useCampaignMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['campaigns'] });

  const create = useMutation({
    mutationFn: ({ campaign, ownerId, branchId }) =>
      axiosPrivate.post(`${BASE}/campaigns`, campaign, { params: { ownerId, branchId } }),
    onSuccess: invalidate,
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }) => axiosPrivate.post(`${BASE}/campaigns/${id}/${action}`),
    onSuccess: invalidate,
  });

  return { create, actionMutation };
};

// ─── Consent ─────────────────────────────────────────────────────────────────
export const usePatientConsents = (patientId) =>
  useQuery({
    queryKey: ['marketing-consents', patientId],
    queryFn: async () => (await axiosPrivate.get(`${BASE}/consent/patient/${patientId}`)).data,
    enabled: !!patientId,
  });

// ─── Leads ───────────────────────────────────────────────────────────────────
export const useLeads = (branchId, status, page = 0) =>
  useQuery({
    queryKey: ['leads', branchId, status, page],
    queryFn: async () =>
      (await axiosPrivate.get(`${BASE}/leads`, { params: { branchId, status, page, size: 20 } })).data,
  });

export const useLeadActivities = (leadId) =>
  useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async () => (await axiosPrivate.get(`${BASE}/leads/${leadId}/activities`)).data,
    enabled: !!leadId,
  });

// ─── Loyalty ─────────────────────────────────────────────────────────────────
export const usePatientLoyalty = (patientId) =>
  useQuery({
    queryKey: ['loyalty', patientId],
    queryFn: async () => (await axiosPrivate.get(`${BASE}/loyalty/${patientId}`)).data,
    enabled: !!patientId,
  });

export const useLoyaltyHistory = (patientId, page = 0) =>
  useQuery({
    queryKey: ['loyalty-history', patientId, page],
    queryFn: async () =>
      (await axiosPrivate.get(`${BASE}/loyalty/${patientId}/transactions`, { params: { page, size: 10 } })).data,
    enabled: !!patientId,
  });

// ─── NPS ─────────────────────────────────────────────────────────────────────
export const useNpsSurveys = (branchId, page = 0) =>
  useQuery({
    queryKey: ['nps-surveys', branchId, page],
    queryFn: async () =>
      (await axiosPrivate.get(`${BASE}/nps/surveys`, { params: { branchId, page, size: 20 } })).data,
    enabled: !!branchId,
  });

export const useNpsMetrics = (branchId) =>
  useQuery({
    queryKey: ['nps-metrics', branchId],
    queryFn: async () => (await axiosPrivate.get(`${BASE}/nps/metrics`, { params: { branchId } })).data,
    enabled: !!branchId,
  });

// ─── Segments ────────────────────────────────────────────────────────────────
export const useSegments = (branchId) =>
  useQuery({
    queryKey: ['segments', branchId],
    queryFn: async () => (await axiosPrivate.get(`${BASE}/segments`, { params: { branchId } })).data,
  });

export const useSegmentCount = (segmentId) =>
  useQuery({
    queryKey: ['segment-count', segmentId],
    queryFn: async () => (await axiosPrivate.get(`${BASE}/segments/${segmentId}/count`)).data,
    enabled: !!segmentId,
  });
