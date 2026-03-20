"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Loader2,
  Shield,
  ArrowLeft,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { truncateAddress, formatSbtc, formatTimeAgo } from "@/lib/utils";
import Link from "next/link";

export default function ChallengePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, token } = useAuth();
  const [targetAddress, setTargetAddress] = useState("");
  const [reason, setReason] = useState("");
  const [bondAmount, setBondAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loadingTarget, setLoadingTarget] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    api
      .getChallenges()
      .then((data) => setChallenges(data.challenges || data || []))
      .catch(console.error);
  }, []);

  // Calculate bond when target changes
  useEffect(() => {
    if (targetAddress.length > 30) {
      setLoadingTarget(true);
      api
        .getStake(targetAddress)
        .then((data) => {
          const stakeAmount = data?.amount || 0;
          setBondAmount(Math.floor(stakeAmount * 0.5));
        })
        .catch(() => setBondAmount(0))
        .finally(() => setLoadingTarget(false));
    } else {
      setBondAmount(0);
    }
  }, [targetAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await api.submitChallenge(token, {
        targetAddress,
        reason,
        bondAmount,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <Button asChild variant="ghost" className="mb-6 text-gray-400">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-2">
          Challenge an Identity
        </h1>
        <p className="text-gray-400 mb-8">
          If you believe an identity is fraudulent, you can challenge it. You
          must bond sBTC equal to 50% of the target&apos;s stake.
        </p>
      </motion.div>

      {success ? (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Challenge Submitted!
            </h2>
            <p className="text-gray-400 mb-6">
              Your challenge has been recorded. The community will review the
              case. If successful, you&apos;ll receive the slashed stake.
            </p>
            <Button
              onClick={() => {
                setSuccess(false);
                setTargetAddress("");
                setReason("");
              }}
              variant="outline"
            >
              Submit Another
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Challenge Form */}
          <Card className="border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Submit Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="target">Target Address</Label>
                  <Input
                    id="target"
                    placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
                    value={targetAddress}
                    onChange={(e) => setTargetAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Challenge</Label>
                  <textarea
                    id="reason"
                    placeholder="Explain why you believe this identity is fraudulent..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    required
                    className="flex w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>

                {/* Bond display */}
                <div className="rounded-lg bg-gray-800/50 p-4 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Required Bond (50% of target&apos;s stake)
                    </span>
                    {loadingTarget ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    ) : (
                      <span className="text-lg font-bold text-amber-500">
                        {bondAmount > 0 ? formatSbtc(bondAmount) : "N/A"}
                      </span>
                    )}
                  </div>
                </div>

                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    If your challenge fails, you will lose your bond. Only
                    challenge identities you genuinely believe to be fraudulent.
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || !targetAddress || !reason || bondAmount === 0}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-12"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Submit Challenge
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Challenges */}
          <Card className="border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg text-gray-300">
                Active Challenges
              </CardTitle>
            </CardHeader>
            <CardContent>
              {challenges.length > 0 ? (
                <div className="space-y-3">
                  {challenges.map((challenge: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-gray-800/50 border border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">
                          {truncateAddress(challenge.targetAddress || challenge.target)}
                        </span>
                        <Badge
                          variant={
                            challenge.status === "active"
                              ? "warning"
                              : challenge.status === "resolved"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {challenge.status === "active" && (
                            <Clock className="mr-1 h-3 w-3" />
                          )}
                          {challenge.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">{challenge.reason}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>
                          Challenger: {truncateAddress(challenge.challenger)}
                        </span>
                        <span>{formatTimeAgo(challenge.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-6">
                  No active challenges
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
