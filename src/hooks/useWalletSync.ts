import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface SyncResponse {
  jobId: string;
  message: string;
}

export function useWalletSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncWallet = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const response = await api.post<SyncResponse>('/wallets/me/sync');
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sync wallet.';
      setError(message);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return { syncWallet, isSyncing, error };
}
