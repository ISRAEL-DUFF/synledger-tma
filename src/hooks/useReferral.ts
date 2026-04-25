import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ReferralSummary {
  code: string;
  totalEarned: number;
  totalReferrals: number;
  pendingReferrals: number;
}

export interface ReferralInvite {
  username: string;
  status: "pending" | "completed";
  date: string;
  reward: number;
}

export function useReferral() {
  const summaryQuery = useQuery({
    queryKey: ["referral", "summary"],
    queryFn: () => api.get<ReferralSummary>("/referrals/summary"),
  });

  const invitesQuery = useQuery({
    queryKey: ["referral", "invites"],
    queryFn: () => api.get<ReferralInvite[]>("/referrals/invites"),
  });

  return {
    summary: summaryQuery.data,
    invites: invitesQuery.data ?? [],
    isLoading: summaryQuery.isLoading || invitesQuery.isLoading,
    isError: summaryQuery.isError || invitesQuery.isError,
    refetch: async () => {
      await Promise.all([summaryQuery.refetch(), invitesQuery.refetch()]);
    },
  };
}
