import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type Token = 'USDT' | 'USDC';

export type Bank = {
  id: number;
  code: string;
  name: string;
};

export interface QuoteResult {
  amountNGN: number;
  amountCrypto: number;
  rate: number;
  fee: number;
  total: number;
  token: string;
  feePercentage: number;
  feeCap: number;
}

export interface BalanceData {
  available: number;
  inEscrow: number;
  total: number;
  currency: string;
}

export interface PaymentStatusData {
  id: string;
  status: string;
  amountNgn: number;
  amountCrypto: number;
  token: string;
  paymentType: string;
  completedAt?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
}

interface SpendRequest {
  currency: Token;
  amountNgn: number;
  paymentType: 'transfer' | 'airtime' | 'bill' | 'dataTopup';
  metadata: Record<string, any>;
}

interface SpendResponse {
  success: boolean;
  data: {
    paymentId: string;
    status: string;
  };
}

interface BankListResponse {
  success: boolean;
  banks: Bank[];
}

interface ResolveAccountResponse {
  success: boolean;
  accountNumber: string;
  accountName: string;
  bankCode: string;
}

interface BalanceResponse {
  success: boolean;
  data: BalanceData;
}

interface PaymentStatusResponse {
  success: boolean;
  data: PaymentStatusData;
}

export function useUnifiedPayment() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState<string | null>(null);

  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusData | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Load banks on mount
  useEffect(() => {
    let mounted = true;
    setBanksLoading(true);
    api
      .get<BankListResponse>('/payments/banks')
      .then((response) => {
        if (!mounted) return;
        if (response.success) {
          setBanks([...response.banks].sort((a, b) => a.name.localeCompare(b.name)));
        } else {
          setBanksError('Failed to load banks');
        }
      })
      .catch((err: unknown) => {
        if (mounted) setBanksError(err instanceof Error ? err.message : 'Failed to load banks');
      })
      .finally(() => {
        if (mounted) setBanksLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const verifyAccount = useCallback(async (accountNumber: string, accountBank: string) => {
    const response = await api.post<ResolveAccountResponse>('/payments/resolve-account', {
      accountNumber,
      accountBank,
    });
    if (!response.success) throw new Error('Could not resolve account details');
    return response.accountName;
  }, []);

  const fetchQuote = useCallback(async (amountNgn: number, selectedToken: Token) => {
    setQuoteLoading(true);
    try {
      return await api.get<QuoteResult>(`/exchange-rate/calculate/${amountNgn}?token=${selectedToken}`);
    } finally {
      setQuoteLoading(false);
    }
  }, []);

  const fetchBalance = useCallback(async (currency: Token = 'USDC') => {
    setBalanceLoading(true);
    try {
      const response = await api.get<BalanceResponse>(`/wallets/me/balance?currency=${currency}`);
      if (response.success) setBalance(response.data);
    } catch {
      // silent
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const fetchPaymentStatus = useCallback(async (paymentId: string) => {
    setStatusLoading(true);
    try {
      const response = await api.get<PaymentStatusResponse>(`/payments/${paymentId}`);
      if (response.success) {
        setPaymentStatus(response.data);
        return response.data;
      }
      return null;
    } catch {
      return null;
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const initiateUnifiedPayment = useCallback(async (request: SpendRequest) => {
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const response = await api.post<SpendResponse>('/payments/spend', request);
      if (!response.success) throw new Error('Could not initiate payment');
      return response.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setSubmitError(message);
      throw err;
    } finally {
      setSubmitLoading(false);
    }
  }, []);

  const initiateTransfer = useCallback(
    async (params: {
      accountNumber: string;
      accountName: string;
      accountBank: string;
      bankName: string;
      amount: number;
      narration?: string;
      token: Token;
    }) => {
      return initiateUnifiedPayment({
        currency: params.token,
        amountNgn: params.amount,
        paymentType: 'transfer',
        metadata: {
          accountNumber: params.accountNumber,
          bankCode: params.accountBank,
          accountName: params.accountName,
          narration: params.narration,
        },
      });
    },
    [initiateUnifiedPayment]
  );

  const initiateAirtime = useCallback(
    async (params: {
      amount: number;
      phoneNumber: string;
      network: string;
      token: Token;
    }) => {
      return initiateUnifiedPayment({
        currency: params.token,
        amountNgn: params.amount,
        paymentType: 'airtime',
        metadata: {
          network: params.network,
          phoneNumber: params.phoneNumber,
        },
      });
    },
    [initiateUnifiedPayment]
  );

  const initiateBill = useCallback(
    async (params: {
      amount: number;
      billType: string;
      provider: string;
      accountNumber: string;
      token: Token;
    }) => {
      return initiateUnifiedPayment({
        currency: params.token,
        amountNgn: params.amount,
        paymentType: 'bill',
        metadata: {
          billType: params.billType,
          provider: params.provider,
          accountNumber: params.accountNumber,
        },
      });
    },
    [initiateUnifiedPayment]
  );

  const initiateDataTopup = useCallback(
    async (params: {
      amount: number;
      phoneNumber: string;
      network: string;
      plan: string;
      billerName?: string;
      token: Token;
    }) => {
      return initiateUnifiedPayment({
        currency: params.token,
        amountNgn: params.amount,
        paymentType: 'dataTopup',
        metadata: {
          network: params.network,
          phoneNumber: params.phoneNumber,
          plan: params.plan,
          billerName: params.billerName,
        },
      });
    },
    [initiateUnifiedPayment]
  );

  return {
    banks,
    banksLoading,
    banksError,
    verifyAccount,
    balance,
    balanceLoading,
    fetchBalance,
    quoteLoading,
    fetchQuote,
    submitLoading,
    submitError,
    paymentStatus,
    statusLoading,
    fetchPaymentStatus,
    initiateUnifiedPayment,
    initiateTransfer,
    initiateAirtime,
    initiateBill,
    initiateDataTopup,
  };
}

/** Sub-hook: poll payment status while in processing state */
export function usePaymentPolling(paymentId: string | null) {
  return useQuery({
    queryKey: ['payment-status', paymentId],
    queryFn: async () => {
      const response = await api.get<PaymentStatusResponse>(`/payments/${paymentId}`);
      return response.success ? response.data : null;
    },
    enabled: !!paymentId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'COMPENSATED') return false;
      return 3000; // Poll every 3 seconds
    },
    staleTime: 2000,
  });
}
