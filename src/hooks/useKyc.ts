import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface KycSummary {
  status: string;
  tier: string;
  checks: KycCheck[];
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface KycCheck {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface KycLimits {
  tier: string;
  limits: Record<string, {
    enabled: boolean;
    dailyLimit: number;
    monthlyLimit: number;
    dailyUsed: number;
    monthlyUsed: number;
  }>;
}

export function useKycSummary() {
  return useQuery<KycSummary>({
    queryKey: ['kyc', 'me'],
    queryFn: () => api.get('/kyc/me'),
  });
}

export function useKycChecks() {
  return useQuery<KycCheck[]>({
    queryKey: ['kyc', 'me', 'checks'],
    queryFn: () => api.get('/kyc/me/checks'),
  });
}

export function useKycLimits() {
  return useQuery<KycLimits>({
    queryKey: ['kyc', 'me', 'limits'],
    queryFn: () => api.get('/kyc/me/limits'),
  });
}

export function useSubmitKycProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { firstName: string; lastName: string; email: string; phoneNumber: string }) =>
      api.post('/kyc/me/profile', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kyc'] }),
  });
}

export function useSubmitBvn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { bvn: string; consentAccepted: boolean }) =>
      api.post('/kyc/me/bvn', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kyc'] }),
  });
}

export function useSubmitNin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { nin: string; consentAccepted: boolean }) =>
      api.post('/kyc/me/nin', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kyc'] }),
  });
}

export function useSubmitLiveness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { sessionId?: string; selfieReference?: string }) =>
      api.post('/kyc/me/liveness', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kyc'] }),
  });
}

export function useSubmitProofOfAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentType: string; documentUrl: string; referenceId?: string }) =>
      api.post('/kyc/me/proof-of-address', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kyc'] }),
  });
}
