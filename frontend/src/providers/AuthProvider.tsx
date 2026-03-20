"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { openSignatureRequestPopup } from "@stacks/connect";
import { useStacks } from "./StacksProvider";
import { api } from "@/lib/api";

interface User {
  address: string;
  bnsName?: string;
  identityRegistered?: boolean;
  reputationScore?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { stxAddress, userSession, isConnected, connectWallet } = useStacks();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loginAttemptedRef = useRef(false);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = typeof window !== "undefined" ? localStorage.getItem("satsid_token") : null;
    if (savedToken && isConnected) {
      setToken(savedToken);
      api
        .getMe(savedToken)
        .then((data) => {
          setUser(data.user || data);
        })
        .catch(() => {
          localStorage.removeItem("satsid_token");
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [isConnected]);

  const login = useCallback(async () => {
    if (!stxAddress) {
      connectWallet();
      return;
    }

    try {
      setIsLoading(true);

      // Step 1: Get nonce from backend
      const { nonce, message } = await api.getNonce(stxAddress);

      // Step 2: Sign the EXACT message the backend sent us
      const signMessage = message;

      await openSignatureRequestPopup({
        message: signMessage,
        network: undefined,
        appDetails: {
          name: "SatsID",
          icon: "/icon.png",
        },
        onFinish: async (data: { signature: string; publicKey: string }) => {
          try {
            // Step 3: Verify signature with backend — send the exact message back
            const result = await api.verifySignature({
              address: stxAddress,
              signature: data.signature,
              publicKey: data.publicKey,
              nonce,
              message: signMessage,
            });

            // Step 4: Store JWT
            const jwt = result.token;
            localStorage.setItem("satsid_token", jwt);
            localStorage.removeItem("satsid_pending_login");
            setToken(jwt);
            setUser(result.user || { address: stxAddress });
          } catch (err) {
            console.error("Verification failed:", err);
          } finally {
            setIsLoading(false);
          }
        },
        onCancel: () => {
          localStorage.removeItem("satsid_pending_login");
          setIsLoading(false);
        },
      });
    } catch (err) {
      console.error("Login failed:", err);
      setIsLoading(false);
    }
  }, [stxAddress, connectWallet]);

  // Auto-login after wallet connects (page reload with pending flag)
  useEffect(() => {
    if (
      isConnected &&
      stxAddress &&
      !token &&
      !loginAttemptedRef.current &&
      typeof window !== "undefined" &&
      localStorage.getItem("satsid_pending_login") === "true"
    ) {
      loginAttemptedRef.current = true;
      // Small delay to let the page finish rendering
      const timer = setTimeout(() => {
        login();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, stxAddress, token, login]);

  const logout = useCallback(() => {
    localStorage.removeItem("satsid_token");
    localStorage.removeItem("satsid_pending_login");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
