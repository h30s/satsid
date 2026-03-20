"use client";

import { useState, useEffect, useCallback } from "react";
import { openContractCall } from "@stacks/connect";
import { stringUtf8CV, PostConditionMode } from "@stacks/transactions";
import { api } from "@/lib/api";
import { STACKS_NETWORK, SATSID_CORE_CONTRACT, splitContractId } from "@/lib/stacks";

interface Identity {
  address: string;
  bnsName?: string;
  displayName?: string;
  registered: boolean;
  isRegistered?: boolean;
  registeredAt?: string;
  isActive: boolean;
  stakeAmount?: number;
  reputationScore?: number;
}

export function useIdentity(address: string | null) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdentity = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getIdentity(address);
      setIdentity(data);
    } catch (err: any) {
      setError(err.message);
      setIdentity(null);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchIdentity();
  }, [fetchIdentity]);

  const registerIdentity = useCallback(
    async (displayName: string, bio: string) => {
      if (!address) throw new Error("No address connected");
      setIsRegistering(true);
      setError(null);

      try {
        const [coreAddr, coreName] = splitContractId(SATSID_CORE_CONTRACT);

        await openContractCall({
          network: STACKS_NETWORK,
          contractAddress: coreAddr,
          contractName: coreName,
          functionName: "register-identity",
          functionArgs: [
            stringUtf8CV(displayName),
            stringUtf8CV(bio),
          ],
          postConditionMode: PostConditionMode.Allow,
          postConditions: [],
          appDetails: {
            name: "SatsID",
            icon: "/icon.png",
          },
          onFinish: (data: any) => {
            console.log("Register tx:", data.txId);
            // Wait for confirmation then refetch
            setTimeout(fetchIdentity, 10000);
          },
          onCancel: () => {
            setIsRegistering(false);
          },
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsRegistering(false);
      }
    },
    [address, fetchIdentity]
  );

  return { identity, isLoading, isRegistering, error, registerIdentity, refetch: fetchIdentity };
}
