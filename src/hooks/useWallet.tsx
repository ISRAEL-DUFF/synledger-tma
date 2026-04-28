import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { SupportedChain, WalletType, normalizeChain } from '@/lib/chains-config';
import { api } from '@/lib/api';

export type { WalletType, SupportedChain };
export type ChainType = SupportedChain;

interface WalletPortfolioItem {
  id: string;
  address: string;
  chain: string;
  type: string;
  status: string;
  createdAt: string;
  tokens: {
    usdt: {
      balance: string;
      reserved?: string;
    };
    usdc: {
      balance: string;
      reserved?: string;
    };
  };
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
      const data = await api.get<WalletPortfolioItem[]>('/wallets/me/portfolio');

      const spendableUsdt = data.reduce(
        (sum, wallet) => sum + Number(wallet.tokens.usdt.balance || 0),
        0,
      );
      const spendableUsdc = data.reduce(
        (sum, wallet) => sum + Number(wallet.tokens.usdc.balance || 0),
        0,
      );
      const reservedUsdt = data.reduce(
        (sum, wallet) => sum + Number(wallet.tokens.usdt.reserved || 0),
        0,
      );
      const reservedUsdc = data.reduce(
        (sum, wallet) => sum + Number(wallet.tokens.usdc.reserved || 0),
        0,
      );

      const totalUsdt = spendableUsdt + reservedUsdt;
      const totalUsdc = spendableUsdc + reservedUsdc;
      const locked = reservedUsdt + reservedUsdc;

      setBalance({
        native: 0, // Not used for now
        usdt: spendableUsdt,
        usdc: spendableUsdc,
        eth: 0,
        locked,
        totalUsdt,
        totalUsdc,
        total: totalUsdt + totalUsdc,
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
