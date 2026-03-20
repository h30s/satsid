"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Award, Lock, AlertTriangle, CheckCircle, Clock, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ReputationGauge } from "@/components/dashboard/ReputationGauge";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { formatSbtc, truncateAddress } from "@/lib/utils";

interface VerificationReportProps {
  report: any;
}

export function VerificationReport({ report }: VerificationReportProps) {
  // Normalize data — handle both API response format and fallback format
  const address = report.address || "";
  const identity = report.identity || {};
  const reputation = report.reputation || {};

  const bnsName = report.bnsName || identity.bnsName || identity.displayName || null;
  const reputationScore = report.reputationScore ?? reputation.totalScore ?? 0;
  const tier = report.tier || reputation.tier || "Untrusted";
  const isVerifiedHuman =
    report.isVerifiedHuman ??
    (identity.isVerified || (identity.stakeAmount && parseInt(identity.stakeAmount) > 0));

  const stakeAmount = report.stake?.amount ?? identity.stakeAmount ?? "0";
  const stakeStatus = report.stake?.status ?? (parseInt(stakeAmount) > 0 ? "active" : "none");

  const credentials = report.credentials || [];
  const challenges = report.challenges || [];
  const verifiedAt = report.verifiedAt || new Date().toISOString();
  const note = report.note || null;
  const paymentTxId = report.paymentTxId || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <Card className="border-gray-800 overflow-hidden">
        <div
          className={`h-2 ${isVerifiedHuman ? "bg-green-500" : "bg-red-500"}`}
        />
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ReputationGauge score={reputationScore} size={160} />

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h2 className="text-2xl font-bold text-white">
                  {bnsName || truncateAddress(address)}
                </h2>
                <TrustBadge score={reputationScore} />
              </div>

              <code className="text-sm text-gray-500 font-mono block mt-1">
                {address}
              </code>

              <div className="flex items-center gap-3 mt-3 justify-center md:justify-start">
                {isVerifiedHuman ? (
                  <Badge variant="success" className="text-sm">
                    <Shield className="mr-1 h-4 w-4" />
                    Verified Human
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-sm">
                    <AlertTriangle className="mr-1 h-4 w-4" />
                    Not Verified
                  </Badge>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Verified at {new Date(verifiedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stake Info */}
      <Card className="border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" />
            Stake Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400">Amount</p>
              <p className="text-lg font-bold text-amber-500">
                {formatSbtc(typeof stakeAmount === "string" ? parseInt(stakeAmount) || 0 : stakeAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <p className="text-lg font-medium text-white capitalize">
                {stakeStatus}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Slashing</p>
              <p className="text-lg font-medium text-white">
                {parseInt(String(stakeAmount)) > 0 ? "Enabled" : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reputation Breakdown */}
      {reputation.totalScore !== undefined && (
        <Card className="border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Reputation Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Base", value: reputation.baseScore ?? 0 },
                { label: "Wallet Age", value: reputation.walletAgeScore ?? 0 },
                { label: "Stake", value: reputation.stakeScore ?? 0 },
                { label: "Activity", value: reputation.activityScore ?? 0 },
                { label: "Duration", value: reputation.durationScore ?? 0 },
                { label: "Credentials", value: reputation.credentialScore ?? 0 },
                { label: "Challenge Bonus", value: reputation.challengeBonus ?? 0 },
              ]
                .filter((item) => item.value > 0)
                .map((item) => (
                  <div key={item.label} className="rounded-lg bg-gray-800/50 p-3">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-xl font-bold text-amber-500">+{item.value}</p>
                  </div>
                ))}
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                <p className="text-xs text-gray-500">Total Score</p>
                <p className="text-xl font-bold text-amber-500">{reputation.totalScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credentials */}
      {credentials.length > 0 && (
        <Card className="border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Credentials ({credentials.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {credentials.map((cred: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
                >
                  <div>
                    <p className="font-medium text-white">{cred.title}</p>
                    <p className="text-sm text-gray-400">
                      {cred.type} &middot; By {truncateAddress(cred.issuer)}
                    </p>
                  </div>
                  <Badge variant={cred.status === "valid" ? "success" : "secondary"}>
                    {cred.status === "valid" ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <Clock className="mr-1 h-3 w-3" />
                    )}
                    {cred.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Challenge History */}
      {challenges.length > 0 && (
        <Card className="border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Challenge History ({challenges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {challenges.map((challenge: any, i: number) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-gray-800/50 border border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      By {truncateAddress(challenge.challenger)}
                    </span>
                    <Badge variant={challenge.status === "resolved" ? "success" : "warning"}>
                      {challenge.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-white mt-1">{challenge.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Proof */}
      {paymentTxId && paymentTxId !== "demo-mode" && (
        <Card className="border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-gray-400">
                  x402 Payment Verified
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  TX: {paymentTxId}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
