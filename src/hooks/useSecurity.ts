import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AuthSession {
  id: string;
  expiresAt: string;
  lastActive: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  isRevoked: boolean;
}

export function useSecurity() {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ["security", "sessions"],
    queryFn: () => api.get<AuthSession[]>("/auth/sessions"),
  });

  const setPinMutation = useMutation({
    mutationFn: (payload: { pin: string; oldPin?: string }) => api.post("/users/me/transaction-pin", payload),
  });

  const verifyPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      const res = await api.post<any>("/users/me/verify-pin", { pin });
      if (typeof res === "boolean") return res;
      return Boolean(res?.success ?? true);
    },
  });

  const initiatePinRecoveryMutation = useMutation({
    mutationFn: () => api.post("/users/me/transaction-pin/recover"),
  });

  const resetPinMutation = useMutation({
    mutationFn: (payload: { otp: string; newPin: string }) => api.patch("/users/me/transaction-pin/reset", payload),
  });

  const enableTwoFactorMutation = useMutation({
    mutationFn: () => api.post("/auth/enable-2fa"),
  });

  const verifyTwoFactorMutation = useMutation({
    mutationFn: (payload: { email: string; otp: string }) => api.post("/auth/verify-2fa", payload),
  });

  const disableTwoFactorMutation = useMutation({
    mutationFn: (payload: { password: string }) => api.post("/auth/disable-2fa", payload),
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (payload: { sessionId: string }) => api.post("/auth/sessions/revoke", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["security", "sessions"] });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (payload: { email: string }) => api.post("/auth/forgot-password", payload),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: { email: string; otp: string; newPassword: string }) =>
      api.post("/auth/reset-password", payload),
  });

  return {
    sessionsQuery,
    setPinMutation,
    verifyPinMutation,
    initiatePinRecoveryMutation,
    resetPinMutation,
    enableTwoFactorMutation,
    verifyTwoFactorMutation,
    disableTwoFactorMutation,
    revokeSessionMutation,
    forgotPasswordMutation,
    resetPasswordMutation,
  };
}
