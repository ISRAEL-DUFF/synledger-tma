import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import WebApp from '@twa-dev/sdk';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  walletAddress?: string;
  kycStatus?: string;
  preferredChain?: string;
  preferredToken?: string;
  [key: string]: any;
}

interface AuthResponse {
  token: string;
  user: User;
  isNewTelegramUser?: boolean;
}

interface TwoFactorChallenge {
  requires2FA: true;
  email: string;
}

type LoginResult = { requires2FA: false } | TwoFactorChallenge;

function isTwoFactorChallenge(response: AuthResponse | TwoFactorChallenge): response is TwoFactorChallenge {
  return "requires2FA" in response && response.requires2FA;
}

interface TelegramReferralOnboarding {
  referralCode: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isTelegram: boolean;
  needsLinking: boolean;
  pending2FAEmail: string | null;
  pendingSignupEmail: string | null;
  telegramReferralOnboarding: TelegramReferralOnboarding | null;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  verifyTwoFactorLogin: (email: string, otp: string) => Promise<void>;
  generateOtpForSignup: (email: string) => Promise<void>;
  signup: (identifier: string, password: string, displayName?: string, referralCode?: string, otpCode?: string) => Promise<void>;
  linkTelegram: (email: string, password: string) => Promise<void>;
  setCredentials: (email: string, password: string, displayName?: string) => Promise<void>;
  completeTelegramReferralOnboarding: () => void;
  skipLinking: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "synledger_token";
const LINK_SKIPPED_KEY = "synledger_link_skipped";
const TG_REFERRAL_ONBOARDING_KEY = "synledger_tg_referral_onboarding";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pending2FAEmail, setPending2FAEmail] = useState<string | null>(null);
  const [pendingSignupEmail, setPendingSignupEmail] = useState<string | null>(null);
  const [telegramReferralOnboarding, setTelegramReferralOnboarding] = useState<TelegramReferralOnboarding | null>(() => {
    try {
      const raw = sessionStorage.getItem(TG_REFERRAL_ONBOARDING_KEY);
      return raw ? JSON.parse(raw) as TelegramReferralOnboarding : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [linkSkipped, setLinkSkipped] = useState(() => localStorage.getItem(LINK_SKIPPED_KEY) === "true");

  const isTelegram = useMemo(() => !!WebApp.initData, []);

  // Initialize Authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isTelegram) {
          WebApp.expand();
        }

        if (isTelegram && WebApp.initData) {
          // Authentic Telegram session
          console.log("Authenticating via Telegram initData...");
          const rawStartParam = (WebApp as any)?.initDataUnsafe?.start_param as string | undefined;
          const referralCode = rawStartParam
            ? (rawStartParam.startsWith("ref=") ? rawStartParam.slice(4) : rawStartParam)
            : undefined;

          const response = await api.post<AuthResponse>('/auth/telegram', {
            initData: WebApp.initData,
            ...(referralCode ? { referralCode } : {}),
          });

          if (response.isNewTelegramUser && referralCode) {
            const onboarding = { referralCode };
            sessionStorage.setItem(TG_REFERRAL_ONBOARDING_KEY, JSON.stringify(onboarding));
            setTelegramReferralOnboarding(onboarding);
          }

          localStorage.setItem(STORAGE_KEY, response.token);
          setToken(response.token);
          // Fetch canonical user via /auth/me to ensure all fields (email, etc.) are present
          try {
            const freshUser = await api.get<User>('/auth/me', { token: response.token });
            setUser(freshUser);
          } catch {
            setUser(response.user);
          }
        } else {
          // Browser mode — restore session from localStorage
          const storedToken = localStorage.getItem(STORAGE_KEY);
          if (storedToken) {
            setToken(storedToken);
            try {
              const userData = await api.get<User>('/auth/me', { token: storedToken });
              setUser(userData);
            } catch (err) {
              localStorage.removeItem(STORAGE_KEY);
              setToken(null);
            }
          }
        }
      } catch (err) {
        console.error("Authentication failed:", err);
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [isTelegram]);

  // Browser-mode login (email/phone + password)
  const login = useCallback(async (identifier: string, password: string): Promise<LoginResult> => {
    const isEmail = identifier.includes("@");
    const response = await api.post<AuthResponse | TwoFactorChallenge>('/auth/login', {
      ...(isEmail ? { email: identifier } : { phoneNumber: identifier }),
      password,
    });

    if (isTwoFactorChallenge(response)) {
      setPending2FAEmail(response.email);
      return { requires2FA: true, email: response.email };
    }

    localStorage.setItem(STORAGE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
    setPending2FAEmail(null);
    return { requires2FA: false };
  }, []);

  const verifyTwoFactorLogin = useCallback(async (email: string, otp: string) => {
    const response = await api.post<AuthResponse>('/auth/verify-2fa', { email, otp });
    localStorage.setItem(STORAGE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
    setPending2FAEmail(null);
  }, []);

  // Generate OTP for signup
  const generateOtpForSignup = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      await api.post("/auth/generate-otp-signup", { email });
      setPendingSignupEmail(email);
      toast.success("OTP sent to your email");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Failed to generate OTP. Please try again.";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Browser-mode signup
  const signup = useCallback(async (identifier: string, password: string, displayName?: string, referralCode?: string, otpCode?: string) => {
    const isEmail = identifier.includes("@");
    const response = await api.post<AuthResponse>('/auth/signup', {
      ...(isEmail ? { email: identifier } : { phoneNumber: identifier }),
      displayName: displayName || identifier.split("@")[0],
      password,
      ...(referralCode ? { referralCode } : {}),
      ...(otpCode ? { otpCode } : {}),
    });
    localStorage.setItem(STORAGE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
    setPendingSignupEmail(null);
  }, []);

  // Link existing email account to current Telegram session (mobile→TMA)
  const linkTelegram = useCallback(async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/link-telegram', { email, password });
    localStorage.setItem(STORAGE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  // Set email + password on a Telegram-first account (TMA→mobile)
  const setCredentials = useCallback(async (email: string, password: string, displayName?: string) => {
    await api.post('/auth/set-credentials', { email, password, displayName });
    // Refresh user to reflect the new email
    const userData = await api.get<User>('/auth/me');
    setUser(userData);
  }, []);

  const skipLinking = useCallback(() => {
    localStorage.setItem(LINK_SKIPPED_KEY, "true");
    setLinkSkipped(true);
  }, []);

  const completeTelegramReferralOnboarding = useCallback(() => {
    sessionStorage.removeItem(TG_REFERRAL_ONBOARDING_KEY);
    setTelegramReferralOnboarding(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const userData = await api.get<User>('/auth/me');
      setUser(userData);
    } catch { /* ignore */ }
  }, [token]);

  // User needs linking if: in Telegram, has no email, and hasn't skipped
  const needsLinking = isTelegram && !!user && !user.email && !linkSkipped;

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setPending2FAEmail(null);
    setPendingSignupEmail(null);
    setTelegramReferralOnboarding(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LINK_SKIPPED_KEY);
    sessionStorage.removeItem(TG_REFERRAL_ONBOARDING_KEY);
    if (isTelegram) {
      WebApp.close();
    }
  }, [isTelegram]);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, isTelegram, needsLinking, pending2FAEmail, pendingSignupEmail, telegramReferralOnboarding,
      login, verifyTwoFactorLogin, generateOtpForSignup, signup, linkTelegram, setCredentials, completeTelegramReferralOnboarding, skipLinking, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
