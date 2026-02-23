import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/lib/api";
import { useAuth } from "./useAuth";

export interface CategoryBreakdown {
    name: string;
    value: number;
    color: string;
}

export interface TrendData {
    label: string | number;
    amount: number;
}

export interface AnalyticsData {
    totalSpentNgn: number;
    totalSpentUsd: number;
    avgTransactionNgn: number;
    totalTransactions: number;
    spendingChange?: number;
    categoryBreakdown: CategoryBreakdown[];
    dailyTrend: TrendData[];
    weeklyTrend: TrendData[];
}

export function useAnalytics() {
    const { token } = useAuth();
    return useQuery<AnalyticsData>({
        queryKey: ["analytics"],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/payments/analytics`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch analytics");
            }

            return response.json();
        },
    });
}
