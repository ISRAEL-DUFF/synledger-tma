import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ExchangeRateResponse {
    token: string;
    currency: string;
    marketRate: number;
    spread: number;
    effectiveRate: number;
    timestamp: number;
    expiresAt: number;
}
interface ExchangeRateCalculatedResponse {
    amountNGN: number;
    amountCrypto: number;
    rate: number;
    fee: number;
    total: number;
    token: string;
    feePercentage: number;
    feeCap: number;
}

export function useExchangeRate(token: string = 'USDT') {
    return useQuery({
        queryKey: ['exchange-rate', token],
        queryFn: () => api.get<ExchangeRateResponse>(`/exchange-rate/current/${token}`),
        refetchInterval: 60000, // Refresh every 60 seconds
        retry: 3,
        staleTime: 30000,
    });
}

export function useExchangeRateCalculated(amountNGN: number, token: string = 'USDT') {
    return useQuery({
        queryKey: ['exchange-rate-calculated', amountNGN, token],
        queryFn: () => api.get<ExchangeRateCalculatedResponse>(`/exchange-rate/calculate/${amountNGN}?token=${token}`),
        refetchInterval: 60000, // Refresh every 60 seconds
        retry: 3,
        staleTime: 30000,
    });
}