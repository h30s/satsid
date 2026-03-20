"use client";

import { useState, useEffect, useCallback } from "react";
import { openContractCall } from "@stacks/connect";
import {
  uintCV,
  PostConditionMode,
  FungibleConditionCode,
  makeStandardFungiblePostCondition,
  createAssetInfo,
} from "@stacks/transactions";
import { api } from "@/lib/api";
import {
  STACKS_NETWORK,
  SATSID_STAKE_CONTRACT,
  SBTC_CONTRACT,
  splitContractId,
} from "@/lib/stacks";

interface StakeInfo {
  amount: number;
  stakedAt?: string;
  status: "active" | "locked" | "cooldown" | "none";
  cooldownEndsAt?: string;
  durationDays?: number;
}

export function useStake(address: string | null) {
  const [stake, setStake] = useState<StakeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStake = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getStake(address);
      // Normalize — backend returns { amount: "5000000", isActive: true, stakedAt: 154147 }
      const amt = typeof data.amount === "string" ? parseInt(data.amount) || 0 : data.amount || 0;
      const isActive = data.isActive || data.is_active || amt > 0;
      setStake({
        amount: amt,
        stakedAt: data.stakedAt,
        status: isActive && amt > 0 ? "active" : data.status || "none",
        cooldownEndsAt: data.cooldownEndsAt,
        durationDays: data.durationDays,
      });
    } catch (err: any) {
      setError(err.message);
      setStake(null);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchStake();
  }, [fetchStake]);

  const stakesBtc = useCallback(
    async (amount: number) => {
      if (!address) throw new Error("No address connected");
      setIsStaking(true);
      setError(null);

      try {
        const [stakeAddr, stakeName] = splitContractId(SATSID_STAKE_CONTRACT);
        const [sbtcAddr, sbtcName] = splitContractId(SBTC_CONTRACT);

        await openContractCall({
          network: STACKS_NETWORK,
          contractAddress: stakeAddr,
          contractName: stakeName,
          functionName: "stake-sbtc",
          functionArgs: [uintCV(amount)],
          postConditionMode: PostConditionMode.Allow,
          postConditions: [],
          appDetails: {
            name: "SatsID",
            icon: "/icon.png",
          },
          onFinish: (data: any) => {
            console.log("Stake tx:", data.txId);
            setTimeout(fetchStake, 5000);
          },
          onCancel: () => {
            setIsStaking(false);
          },
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsStaking(false);
      }
    },
    [address, fetchStake]
  );

  const requestUnstake = useCallback(async () => {
    if (!address) throw new Error("No address connected");

    try {
      const [stakeAddr, stakeName] = splitContractId(SATSID_STAKE_CONTRACT);

      await openContractCall({
        network: STACKS_NETWORK,
        contractAddress: stakeAddr,
        contractName: stakeName,
        functionName: "request-unstake",
        functionArgs: [],
        postConditionMode: PostConditionMode.Allow,
        appDetails: {
          name: "SatsID",
          icon: "/icon.png",
        },
        onFinish: (data: any) => {
          console.log("Unstake request tx:", data.txId);
          setTimeout(fetchStake, 5000);
        },
      });
    } catch (err: any) {
      setError(err.message);
    }
  }, [address, fetchStake]);

  const completeUnstake = useCallback(async () => {
    if (!address) throw new Error("No address connected");

    try {
      const [stakeAddr, stakeName] = splitContractId(SATSID_STAKE_CONTRACT);

      await openContractCall({
        network: STACKS_NETWORK,
        contractAddress: stakeAddr,
        contractName: stakeName,
        functionName: "complete-unstake",
        functionArgs: [],
        postConditionMode: PostConditionMode.Allow,
        appDetails: {
          name: "SatsID",
          icon: "/icon.png",
        },
        onFinish: (data: any) => {
          console.log("Complete unstake tx:", data.txId);
          setTimeout(fetchStake, 5000);
        },
      });
    } catch (err: any) {
      setError(err.message);
    }
  }, [address, fetchStake]);

  return {
    stake,
    isLoading,
    isStaking,
    error,
    stakesBtc,
    requestUnstake,
    completeUnstake,
    refetch: fetchStake,
  };
}
