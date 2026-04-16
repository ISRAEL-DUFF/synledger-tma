import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SupportedChain, TokenSymbol } from '@/lib/chains-config';

export type OnRampStatus = 'pending' | 'expired' | 'deposit_received' | 'credited' | 'completed' | 'failed';
export type WithdrawalStatus = 'not_applicable' | 'pending' | 'processing' | 'sent' | 'failed';

export const ON_RAMP_TERMINAL_STATUSES: OnRampStatus[] = ['expired', 'completed', 'failed'];

export interface VirtualAccountDetails {
  accountNumber: string;
  bankName: string;
  accountName: string;
}

export interface OnRampRequest {
  id: string;
  reference: string;
  amountNgn: number;
  token: string;
  chain: string;
  status: OnRampStatus;
  virtualAccount: VirtualAccountDetails | null;
  withdrawalAddress: any | null;
  withdrawalStatus: WithdrawalStatus;
  tokenAmount: number | null;
  exchangeRate: number | null;
  actualAmountNgn: number | null;
  withdrawalTxHash: string | null;
  expiresAt: string;
  createdAt: string;
}

interface CreateOnRampPayload {
  amountNgn: number;
  token: string;
  chain: string;
  withdrawalAddressId?: string;
}

interface OnRampListResponse {
  success: boolean;
  data: OnRampRequest[];
}

interface OnRampSingleResponse {
  success: boolean;
  data: OnRampRequest;
}

/** List all on-ramp requests for current user */
export function useOnRampRequests() {
  return useQuery({
    queryKey: ['on-ramp-requests'],
    queryFn: async () => {
      const response = await api.get<OnRampListResponse>('/on-ramp/requests');
      return response.data;
    },
    staleTime: 15000,
  });
}

/** Get a single on-ramp request with optional polling */
export function useOnRampRequest(requestId: string | null) {
  return useQuery({
    queryKey: ['on-ramp-request', requestId],
    queryFn: async () => {
      const response = await api.get<OnRampSingleResponse>(`/on-ramp/requests/${requestId}`);
      return response.data;
    },
    enabled: !!requestId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && ON_RAMP_TERMINAL_STATUSES.includes(status)) return false;
      return 8000; // Poll every 8 seconds
    },
    staleTime: 5000,
  });
}

/** Create a new on-ramp request */
export function useCreateOnRampRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOnRampPayload) => {
      const response = await api.post<OnRampSingleResponse>('/on-ramp/requests', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['on-ramp-requests'] });
    },
  });
}
