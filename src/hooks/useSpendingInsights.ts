import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SpendingInsights {
    totalSpentToday: number;
    totalSpentWeek: number;
    totalSpentMonth: number;
    weeklyChange?: number;
}

export const useSpendingInsights = () => {
    return useQuery<SpendingInsights>({
        queryKey: ["spending-insights"],
        queryFn: async () => {
            return api.get<SpendingInsights>("/payments/stats/spending");
        },
        // Refresh insights occasionally or on manual invalidation
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
