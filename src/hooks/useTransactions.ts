import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Transaction } from '@/components/TransactionList';

export interface TransactionFilters {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
}

export interface PaginatedTransactionResponse {
    data: Transaction[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export function useTransactions(filters: TransactionFilters = {}) {
    return useQuery({
        queryKey: ['transactions', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });
            const queryString = params.toString();
            const endpoint = `/payments/transactions${queryString ? `?${queryString}` : ''}`;
            return api.get<PaginatedTransactionResponse>(endpoint);
        },
        staleTime: 30000, // 30 seconds
    });
}

export function useTransaction(id: string) {
    return useQuery({
        queryKey: ['transaction', id],
        queryFn: () => api.get<Transaction>(`/payments/transactions/${id}`),
        enabled: !!id,
    });
}
