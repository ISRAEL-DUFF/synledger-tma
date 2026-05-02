import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { SupportedChain, WalletType, normalizeChain } from '@/lib/chains-config';
import { api } from '@/lib/api';

export type { WalletType, SupportedChain };
export type ChainType = SupportedChain;

interface SpenderBalances {
  usdt: number;
  usdc: number;
  total: number;
  inEscrow: number;
  available: number;
}

interface WalletBalanceState {
  native: number;
  usdt: number;
  usdc: number;
  eth: number;
  locked: number;
  totalUsdt: number;
  totalUsdc: number;
  total: number;
}

export const useWallet = () => {
  const { user, token } = useAuth();
  const [balance, setBalance] = useState<WalletBalanceState>({
    native: 0,
    usdt: 0,
    usdc: 0,
    eth: 0,
    locked: 0,
    totalUsdt: 0,
    totalUsdc: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Default network Arbitrum
  const network = normalizeChain('arbitrum') as SupportedChain;

  const fetchBalance = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // Mirror Flutter's balanceProvider: GET /spender/balances
      // Returns pre-calculated { usdt, usdc, total, inEscrow, available }
      const raw = await api.get<any>('/spender/balances');
      const data: SpenderBalances = (raw as any)?.data ?? raw;

      const usdt   = Number(data.usdt     ?? 0);
      const usdc   = Number(data.usdc     ?? 0);
      const total  = Number(data.total    ?? 0) || (usdt + usdc);
      const locked = Number(data.inEscrow ?? 0);

      setBalance({
        native: 0,
        usdt,
        usdc,
        eth: 0,
        locked,
        totalUsdt: usdt,
        totalUsdc: usdc,
        total,
      });
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const getExplorerUrl = useCallback((hash: string) => {
    return `https://arbiscan.io/tx/${hash}`;
  }, []);

  const formatAddress = useCallback((addr: string | null) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  return {
    isConnected: !!user?.walletAddress,
    address: user?.walletAddress || null,
    chainId: 42161,
    walletType: 'custodial' as any,
    network,
    isCorrectNetwork: true,
    isConnecting: false,
    isLoading,
    balance,
    shortenedAddress: user?.walletAddress ? formatAddress(user.walletAddress) : '',

    // No-ops because TMA handles external connections automatically
    connect: async () => { },
    disconnect: async () => { },
    switchNetwork: async () => { },
    getExplorerUrl,
    formatAddress,
    refreshBalance: fetchBalance
  };
};
