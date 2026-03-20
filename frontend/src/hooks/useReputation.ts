"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface ReputationBreakdown {
  base: number;
  walletAge: number;
  sbtcStake: number;
  stakeDuration: number;
  activityScore: number;
  credentialScore: number;
  challengeBonus: number;
}

interface Reputation {
  score: number;
  tier: string;
  breakdown: ReputationBreakdown;
  lastUpdated?: string;
}

export function useReputation(address: string | null) {
  const [reputation, setReputation] = useState<Reputation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReputation = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getReputation(address);
      // Normalize — backend returns { reputation: { totalScore, baseScore, ... } }
      const rep = data?.reputation || data;
      setReputation({
        score: rep.totalScore ?? rep.score ?? 0,
        tier: rep.tier || "Untrusted",
        breakdown: {
          base: rep.baseScore ?? 0,
          walletAge: rep.walletAgeScore ?? 0,
          sbtcStake: rep.stakeScore ?? 0,
          stakeDuration: rep.durationScore ?? 0,
          activityScore: rep.activityScore ?? 0,
          credentialScore: rep.credentialScore ?? 0,
          challengeBonus: rep.challengeBonus ?? 0,
        },
        lastUpdated: data?.computedAt,
      });
    } catch (err: any) {
      setError(err.message);
      setReputation(null);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchReputation();
  }, [fetchReputation]);

  return { reputation, isLoading, error, refetch: fetchReputation };
}
