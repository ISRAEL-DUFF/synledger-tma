import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

type RawOnRampRequest = Partial<OnRampRequest> & {
  virtualAccount?: Partial<VirtualAccountDetails> & {
    account_number?: string | null;
    bank_name?: string | null;
    account_name?: string | null;
  } | null;
  virtualAccountNumber?: string | null;
  virtualAccountBank?: string | null;
  virtualAccountName?: string | null;
  virtual_account_number?: string | null;
  virtual_account_bank?: string | null;
  virtual_account_name?: string | null;
};

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeVirtualAccount(request: RawOnRampRequest): VirtualAccountDetails | null {
  const nestedVirtualAccount = request.virtualAccount;
  const accountNumber = nestedVirtualAccount?.accountNumber
    ?? nestedVirtualAccount?.account_number
    ?? request.virtualAccountNumber
    ?? request.virtual_account_number
    ?? null;
  const bankName = nestedVirtualAccount?.bankName
    ?? nestedVirtualAccount?.bank_name
    ?? request.virtualAccountBank
    ?? request.virtual_account_bank
    ?? null;
  const accountName = nestedVirtualAccount?.accountName
    ?? nestedVirtualAccount?.account_name
    ?? request.virtualAccountName
    ?? request.virtual_account_name
    ?? null;

  if (!accountNumber && !bankName && !accountName) {
    return null;
  }

  return {
    accountNumber: String(accountNumber ?? ''),
    bankName: String(bankName ?? ''),
    accountName: String(accountName ?? ''),
  };
}

function normalizeOnRampRequest(request: RawOnRampRequest): OnRampRequest {
  return {
    id: String(request.id ?? ''),
    reference: String(request.reference ?? ''),
    amountNgn: Number(request.amountNgn ?? 0),
    token: String(request.token ?? ''),
    chain: String(request.chain ?? ''),
    status: (request.status ?? 'pending') as OnRampStatus,
    virtualAccount: normalizeVirtualAccount(request),
    withdrawalAddress: request.withdrawalAddress ?? null,
    withdrawalStatus: (request.withdrawalStatus ?? 'not_applicable') as WithdrawalStatus,
    tokenAmount: toNullableNumber(request.tokenAmount),
    exchangeRate: toNullableNumber(request.exchangeRate),
    actualAmountNgn: toNullableNumber(request.actualAmountNgn),
    withdrawalTxHash: request.withdrawalTxHash ?? null,
    expiresAt: String(request.expiresAt ?? ''),
    createdAt: String(request.createdAt ?? ''),
  };
}

/** List all on-ramp requests for current user */
export function useOnRampRequests() {
  return useQuery({
    queryKey: ['on-ramp-requests'],
    queryFn: async () => {
      const response = await api.get<OnRampListResponse>('/on-ramp/requests');
      return Array.isArray(response.data)
        ? response.data.map((request) => normalizeOnRampRequest(request))
        : [];
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
      return normalizeOnRampRequest(response.data);
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
      return normalizeOnRampRequest(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['on-ramp-requests'] });
    },
  });
}
