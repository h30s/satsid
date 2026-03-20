"use client";

import React, { useState, useCallback } from "react";
import type { SatsIDButtonProps, SatsIDUser } from "../types";

const SIZES = {
  sm: { padding: "8px 16px", fontSize: "14px", height: "36px" },
  md: { padding: "12px 24px", fontSize: "16px", height: "44px" },
  lg: { padding: "16px 32px", fontSize: "18px", height: "52px" },
};

export function SatsIDButton({
  apiUrl,
  onSuccess,
  onError,
  theme = "dark",
  size = "md",
  showReputation = false,
  className = "",
}: SatsIDButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<SatsIDUser | null>(null);

  const handleSignIn = useCallback(async () => {
    setIsLoading(true);

    try {
      // Dynamic import to avoid SSR issues
      const { showConnect } = await import("@stacks/connect");
      const { StacksTestnet } = await import("@stacks/network");

      showConnect({
        appDetails: {
          name: "SatsID",
          icon: "/logo.svg",
        },
        onFinish: async ({ userSession }) => {
          try {
            const userData = userSession.loadUserData();
            const address =
              userData.profile?.stxAddress?.testnet ||
              userData.profile?.stxAddress?.mainnet;

            if (!address) throw new Error("No Stacks address found");

            // Step 1: Get nonce
            const nonceRes = await fetch(`${apiUrl}/api/auth/nonce`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address }),
            });
            const { nonce, message } = await nonceRes.json();

            // Step 2: Sign message
            const { openSignatureRequestPopup } = await import(
              "@stacks/connect"
            );

            openSignatureRequestPopup({
              message,
              network: new StacksTestnet(),
              onFinish: async ({ signature, publicKey }) => {
                try {
                  // Step 3: Verify with backend
                  const verifyRes = await fetch(`${apiUrl}/api/auth/verify`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      address,
                      signature,
                      publicKey,
                      nonce,
                    }),
                  });

                  if (!verifyRes.ok) {
                    throw new Error("Signature verification failed");
                  }

                  const { token, user: userData } = await verifyRes.json();

                  // Store JWT
                  if (typeof window !== "undefined") {
                    localStorage.setItem("satsid_token", token);
                  }

                  setUser(userData);
                  onSuccess(userData);
                } catch (err) {
                  onError?.(
                    err instanceof Error ? err : new Error("Auth failed")
                  );
                } finally {
                  setIsLoading(false);
                }
              },
              onCancel: () => {
                setIsLoading(false);
              },
            });
          } catch (err) {
            setIsLoading(false);
            onError?.(err instanceof Error ? err : new Error("Auth failed"));
          }
        },
        onCancel: () => {
          setIsLoading(false);
        },
      });
    } catch (err) {
      setIsLoading(false);
      onError?.(err instanceof Error ? err : new Error("Connection failed"));
    }
  }, [apiUrl, onSuccess, onError]);

  const sizeStyles = SIZES[size];
  const isDark = theme === "dark";

  const baseStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: isLoading ? "wait" : "pointer",
    transition: "all 0.2s ease",
    ...sizeStyles,
    backgroundColor: isDark ? "#f59e0b" : "#f59e0b",
    color: "#000",
    opacity: isLoading ? 0.7 : 1,
    boxShadow: "0 0 20px rgba(245, 158, 11, 0.3)",
  };

  if (user && showReputation) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px 16px",
          borderRadius: "8px",
          backgroundColor: isDark
            ? "rgba(255,255,255,0.05)"
            : "rgba(0,0,0,0.05)",
          color: isDark ? "#fff" : "#000",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f59e0b, #ea580c)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: "bold",
            color: "#000",
          }}
        >
          {user.reputationScore}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: "14px" }}>
            {user.bnsName || user.address.slice(0, 8) + "..."}
          </div>
          <div style={{ fontSize: "12px", opacity: 0.7 }}>
            {user.isVerified ? "✅ Verified Human" : "⚠️ Unverified"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      style={baseStyles}
      className={className}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
        <path
          d="M13 7.5C13 7.5 12.5 5 10 5C7.5 5 7 7 7 7.5C7 8.5 7.5 9 8.5 9.5L11.5 10.5C12.5 11 13 11.5 13 12.5C13 13 12.5 15 10 15C7.5 15 7 12.5 7 12.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="10"
          y1="3"
          x2="10"
          y2="5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="10"
          y1="15"
          x2="10"
          y2="17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {isLoading ? "Connecting..." : "Sign In with Bitcoin"}
    </button>
  );
}
