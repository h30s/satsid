"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";
import { APP_NAME } from "@/lib/stacks";

interface StacksContextType {
  userSession: UserSession;
  userData: any;
  stxAddress: string | null;
  isConnected: boolean;
  connectWallet: () => void;
  disconnectWallet: () => void;
}

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

const StacksContext = createContext<StacksContextType>({
  userSession,
  userData: null,
  stxAddress: null,
  isConnected: false,
  connectWallet: () => {},
  disconnectWallet: () => {},
});

export function StacksProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<any>(null);
  const [stxAddress, setStxAddress] = useState<string | null>(null);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData();
      setUserData(data);
      setStxAddress(
        data.profile?.stxAddress?.testnet || data.profile?.stxAddress?.mainnet || null
      );
    }
  }, []);

  const connectWallet = useCallback(() => {
    showConnect({
      appDetails: {
        name: APP_NAME,
        icon: "/icon.png",
      },
      onFinish: () => {
        if (userSession.isUserSignedIn()) {
          const data = userSession.loadUserData();
          setUserData(data);
          const addr = data.profile?.stxAddress?.testnet || data.profile?.stxAddress?.mainnet || null;
          setStxAddress(addr);
          // Signal that wallet just connected so AuthProvider can auto-login
          if (addr) {
            localStorage.setItem("satsid_pending_login", "true");
          }
        }
        window.location.reload();
      },
      onCancel: () => {
        console.log("Wallet connection cancelled");
      },
      userSession,
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    userSession.signUserOut("/");
    setUserData(null);
    setStxAddress(null);
  }, []);

  return (
    <StacksContext.Provider
      value={{
        userSession,
        userData,
        stxAddress,
        isConnected: !!stxAddress,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </StacksContext.Provider>
  );
}

export function useStacks() {
  return useContext(StacksContext);
}
