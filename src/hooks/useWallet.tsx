import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { SupportedChain, WalletType, normalizeChain } from '@/lib/chains-config';

export type { WalletType, SupportedChain };
export type ChainType = SupportedChain;

export const useWallet = () => {
  const { user } = useAuth();

  // Default network Arbitrum
  const network = normalizeChain('arbitrum') as SupportedChain;

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
    balance: { native: 0, usdt: 0, usdc: 0, eth: 0 }, // TODO: Fetch from backend API
    shortenedAddress: user?.walletAddress ? formatAddress(user.walletAddress) : '',

    // No-ops because TMA handles external connections automatically
    connect: async () => { },
    disconnect: async () => { },
    switchNetwork: async () => { },
    getExplorerUrl,
    formatAddress,
  };
};
