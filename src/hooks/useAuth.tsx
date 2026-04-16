import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import WebApp from '@twa-dev/sdk';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  displayName?: string;
  walletAddress?: string;
  kycStatus?: string;
  preferredChain?: string;
  preferredToken?: string;
  [key: string]: any;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isTelegram: boolean;
  needsLinking: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (identifier: string, password: string, displayName?: string) => Promise<void>;
  linkTelegram: (email: string, password: string) => Promise<void>;
  setCredentials: (email: string, password: string, displayName?: string) => Promise<void>;
  skipLinking: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "synledger_token";
const LINK_SKIPPED_KEY = "synledger_link_skipped";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
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
          const response = await api.post<AuthResponse>('/auth/telegram', { initData: WebApp.initData });
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
  const login = useCallback(async (identifier: string, password: string) => {
    const isEmail = identifier.includes("@");
    const response = await api.post<AuthResponse>('/auth/login', {
      ...(isEmail ? { email: identifier } : { phoneNumber: identifier }),
      password,
    });
    localStorage.setItem(STORAGE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  // Browser-mode signup
  const signup = useCallback(async (identifier: string, password: string, displayName?: string) => {
    const isEmail = identifier.includes("@");
    const response = await api.post<AuthResponse>('/auth/signup', {
      ...(isEmail ? { email: identifier } : { phoneNumber: identifier }),
      displayName: displayName || identifier.split("@")[0],
      password,
    });
    localStorage.setItem(STORAGE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
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
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LINK_SKIPPED_KEY);
    if (isTelegram) {
      WebApp.close();
    }
  }, [isTelegram]);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, isTelegram, needsLinking,
      login, signup, linkTelegram, setCredentials, skipLinking, logout, refreshUser,
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
