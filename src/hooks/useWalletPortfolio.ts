import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface WalletToken {
  balance: string;
  lockedBalance: string;
}

export interface WalletPortfolio {
  id: string;
  address: string;
  chain: string;
  type: string;
  status: string;
  createdAt: string;
  tokens: {
    usdt: WalletToken;
    usdc: WalletToken;
  };
}

export function useWalletPortfolio() {
  const [portfolio, setPortfolio] = useState<WalletPortfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<WalletPortfolio[]>('/wallets/me/portfolio');
      setPortfolio(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load portfolio.';
      setError(message);
      setPortfolio([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return { portfolio, loading, error, refetch: fetchPortfolio };
}
