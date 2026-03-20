"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Lock,
  Award,
  Search,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IdentityOverview } from "@/components/dashboard/IdentityOverview";
import { ReputationGauge } from "@/components/dashboard/ReputationGauge";
import { ReputationBreakdown } from "@/components/dashboard/ReputationBreakdown";
import { StakeCard } from "@/components/dashboard/StakeCard";
import { CredentialCard } from "@/components/dashboard/CredentialCard";
import { useAuth } from "@/hooks/useAuth";
import { useStacks } from "@/providers/StacksProvider";
import { useIdentity } from "@/hooks/useIdentity";
import { useReputation } from "@/hooks/useReputation";
import { useStake } from "@/hooks/useStake";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { stxAddress } = useStacks();
  const address = stxAddress || user?.address || null;

  const { identity, isLoading: identityLoading, isRegistering, registerIdentity } = useIdentity(address);
  const { reputation, isLoading: repLoading } = useReputation(address);
  const { stake, isLoading: stakeLoading } = useStake(address);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [credsLoading, setCredsLoading] = useState(false);

  // Don't redirect — show a connect prompt instead
  // This prevents the redirect loop when wallet is connected but auth is pending

  useEffect(() => {
    if (address) {
      setCredsLoading(true);
      api
        .getCredentials(address)
        .then((data) => setCredentials(data.credentials || data || []))
        .catch(console.error)
        .finally(() => setCredsLoading(false));
    }
  }, [address]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Lock className="h-12 w-12 text-amber-500 opacity-60" />
        <h2 className="text-2xl font-bold text-white">Sign In Required</h2>
        <p className="text-gray-400 text-center max-w-md">
          Connect your Stacks wallet and sign in to access your dashboard.
        </p>
        <Button
          onClick={() => router.push("/")}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold mt-2"
        >
          Go to Home & Sign In
        </Button>
      </div>
    );
  }

  const isLoading = identityLoading || repLoading || stakeLoading;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Identity Overview */}
            <IdentityOverview
              address={address || ""}
              bnsName={identity?.bnsName || user?.bnsName}
              displayName={identity?.displayName}
              isActive={identity?.isActive ?? false}
              isRegistered={identity?.isRegistered ?? identity?.registered ?? false}
              stakeAmount={stake?.amount}
              reputationScore={reputation?.score}
              onRegister={registerIdentity}
              isRegistering={isRegistering}
            />

            {/* Reputation Card */}
            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-300">
                  Reputation Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <ReputationGauge score={reputation?.score || 0} size={180} />
                  {reputation?.breakdown && (
                    <div className="flex-1 w-full">
                      <ReputationBreakdown breakdown={reputation.breakdown} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Credentials */}
            <Card className="border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium text-gray-300">
                  Credentials
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/credentials">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {credsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                  </div>
                ) : credentials.length > 0 ? (
                  <div className="space-y-3">
                    {credentials.slice(0, 3).map((cred: any, i: number) => (
                      <CredentialCard key={cred.id || i} credential={cred} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p>No credentials yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Stake Card */}
            <StakeCard
              amount={stake?.amount || 0}
              status={stake?.status || "none"}
              stakedAt={stake?.stakedAt}
              durationDays={stake?.durationDays}
            />

            {/* Quick Actions */}
            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-300">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  asChild
                  className="w-full justify-start bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20"
                  variant="outline"
                >
                  <Link href="/dashboard/stake">
                    <Lock className="mr-2 h-4 w-4" />
                    {stake?.amount ? "Manage Stake" : "Stake sBTC"}
                  </Link>
                </Button>

                <Button
                  asChild
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Link href="/issue">
                    <Award className="mr-2 h-4 w-4" />
                    Issue Credential
                  </Link>
                </Button>

                <Button
                  asChild
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Link href="/verify">
                    <Search className="mr-2 h-4 w-4" />
                    Verify Someone
                  </Link>
                </Button>

                <Button
                  asChild
                  className="w-full justify-start text-red-400 border-red-500/20 hover:bg-red-500/10"
                  variant="outline"
                >
                  <Link href="/challenge">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Challenge Identity
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
