import { useCallback } from 'react';
import { api } from '@/lib/api';

export interface SwapPayload {
  chain: string;
  fromToken: 'USDT' | 'USDC';
  toToken: 'USDT' | 'USDC';
  amount: string;
}

export interface SwapResult {
  swapId: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fee: string;
  rate: string;
  status: string;
}

export interface SwapHistoryItem {
  id: string;
  chain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fee: string;
  rate: string;
  status: string;
  createdAt: string;
}

export function useSwap() {
  const executeSwap = useCallback(async (payload: SwapPayload): Promise<SwapResult> => {
    return api.post<SwapResult>('/swap', payload);
  }, []);

  const getSwapHistory = useCallback(async (): Promise<SwapHistoryItem[]> => {
    return api.get<SwapHistoryItem[]>('/swap/history');
  }, []);

  return { executeSwap, getSwapHistory };
}
