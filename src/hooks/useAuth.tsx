import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
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
  login: (identifier: string, password: string) => Promise<void>;
  signup: (identifier: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "synledger_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Authentication via Telegram WebApp
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Expand the WebApp to take full screen height if possible
        WebApp.expand();

        if (WebApp.initData) {
          // Authentic Telegram session
          console.log("Authenticating via Telegram initData...");
          const response = await api.post<AuthResponse>('/auth/telegram', { initData: WebApp.initData });
          localStorage.setItem(STORAGE_KEY, response.token);
          setToken(response.token);
          setUser(response.user);
        } else {
          // Fallback to local storage (for local development outside Telegram)
          console.log("No Telegram initData found, falling back to cached session...");
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
  }, []);

  // No-ops for typical TMA usage, preserved to avoid breaking generic UI components
  const login = useCallback(async (identifier: string, password: string) => {
    console.warn("Manual login disabled in Telegram Mini App");
  }, []);

  const signup = useCallback(async (identifier: string, password: string, displayName?: string) => {
    console.warn("Manual signup disabled in Telegram Mini App");
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    // Optionally close the TMA
    WebApp.close();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
