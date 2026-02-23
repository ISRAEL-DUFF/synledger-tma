import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { SupportedChain, WalletType, normalizeChain } from '@/lib/chains-config';
import { api } from '@/lib/api';

export type { WalletType, SupportedChain };
export type ChainType = SupportedChain;

interface BalanceResponse {
  usdt: number;
  usdc: number;
  total: number;
  inEscrow: number;
  available: number;
}

export const useWallet = () => {
  const { user, token } = useAuth();
  const [balance, setBalance] = useState({ native: 0, usdt: 0, usdc: 0, eth: 0, locked: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Default network Arbitrum
  const network = normalizeChain('arbitrum') as SupportedChain;

  const fetchBalance = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await api.get<BalanceResponse>('/wallets/me/balances');
      setBalance({
        native: 0, // Not used for now
        usdt: data.usdt,
        usdc: data.usdc,
        eth: 0,
        locked: data.inEscrow
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
