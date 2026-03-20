"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Lock,
  Unlock,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Clock,
  Info,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useStacks } from "@/providers/StacksProvider";
import { useStake } from "@/hooks/useStake";
import { formatSbtc } from "@/lib/utils";
import Link from "next/link";

export default function StakePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { stxAddress } = useStacks();
  const {
    stake,
    isLoading,
    isStaking,
    error,
    stakesBtc,
    requestUnstake,
    completeUnstake,
  } = useStake(stxAddress);

  const [amount, setAmount] = useState("");
  const [stakeError, setStakeError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleStake = async () => {
    setStakeError(null);
    const microAmount = Math.floor(parseFloat(amount) * 100_000_000);
    if (isNaN(microAmount) || microAmount <= 0) {
      setStakeError("Please enter a valid amount");
      return;
    }
    if (microAmount < 1_000_000) {
      setStakeError("Minimum stake is 0.01 sBTC");
      return;
    }
    try {
      await stakesBtc(microAmount);
      setAmount("");
    } catch (err: any) {
      setStakeError(err.message);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Button asChild variant="ghost" className="mb-6 text-gray-400">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-8">sBTC Staking</h1>
      </motion.div>

      <div className="space-y-6">
        {/* Current Stake */}
        <Card className="border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Current Stake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-amber-500">
                  {stake?.amount ? formatSbtc(stake.amount) : "0 sBTC"}
                </p>
                {stake?.status && stake.status !== "none" && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant={
                        stake.status === "active"
                          ? "success"
                          : stake.status === "cooldown"
                          ? "info"
                          : "warning"
                      }
                    >
                      {stake.status === "active" && <Lock className="mr-1 h-3 w-3" />}
                      {stake.status === "cooldown" && <Clock className="mr-1 h-3 w-3" />}
                      {stake.status.charAt(0).toUpperCase() + stake.status.slice(1)}
                    </Badge>
                    {stake.durationDays !== undefined && stake.durationDays > 0 && (
                      <span className="text-sm text-gray-500">
                        {stake.durationDays} days
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="h-20 w-20 rounded-full bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-10 w-10 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stake Form — only show if no active stake */}
        {stake?.amount && stake.amount > 0 ? (
          <Card className="border-gray-800 border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-400">Stake Active</p>
                  <p className="text-sm text-gray-400">
                    Your identity is backed by {formatSbtc(stake.amount)} staked on-chain
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-gray-800/50 p-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="text-green-400 font-medium">Verified Human</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Staked Amount</p>
                    <p className="text-amber-500 font-medium">{formatSbtc(stake.amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Protection</p>
                    <p className="text-white font-medium">Slashing Enabled</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Trust Level</p>
                    <p className="text-amber-500 font-medium">Trusted</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Stake sBTC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (sBTC)</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      step="0.001"
                      min="0.01"
                      placeholder="0.1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      sBTC
                    </span>
                  </div>
                  {/* Quick amounts */}
                  <div className="flex gap-2">
                    {["0.01", "0.05", "0.1", "0.5", "1.0"].map((val) => (
                      <Button
                        key={val}
                        variant="outline"
                        size="sm"
                        className="text-xs border-gray-700"
                        onClick={() => setAmount(val)}
                      >
                        {val}
                      </Button>
                    ))}
                  </div>
                </div>

                {stakeError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{stakeError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleStake}
                  disabled={isStaking || !amount}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold h-12"
                >
                  {isStaking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Staking...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Stake sBTC
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unstake Section */}
        {stake?.amount && stake.amount > 0 && (
          <Card className="border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Unlock className="h-5 w-5 text-gray-400" />
                Unstake
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stake.status === "active" && (
                <>
                  <p className="text-sm text-gray-400">
                    Request to unstake your sBTC. There is a 72-hour cooldown
                    period before you can complete the unstake.
                  </p>
                  <Button
                    onClick={requestUnstake}
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Request Unstake
                  </Button>
                </>
              )}

              {stake.status === "cooldown" && (
                <>
                  <Alert variant="warning">
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Cooldown Active</AlertTitle>
                    <AlertDescription>
                      {stake.cooldownEndsAt
                        ? `Cooldown ends at ${new Date(stake.cooldownEndsAt).toLocaleString()}`
                        : "Please wait for the cooldown period to end."}
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={completeUnstake}
                    variant="outline"
                    className="w-full"
                  >
                    <Unlock className="mr-2 h-4 w-4" />
                    Complete Unstake
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Staking Info */}
        <Card className="border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Staking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-800/50 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Min Stake</p>
                <p className="text-lg font-semibold text-white">0.01 sBTC</p>
              </div>
              <div className="rounded-lg bg-gray-800/50 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Cooldown</p>
                <p className="text-lg font-semibold text-white">72 Hours</p>
              </div>
            </div>
            <Separator />
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Slashing Risk</AlertTitle>
              <AlertDescription>
                If your identity is successfully challenged, a portion of your
                stake will be slashed and awarded to the challenger. Only stake
                what you can afford to lose.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
