"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Wallet,
  Lock,
  Search,
  ArrowRight,
  Zap,
  Users,
  TrendingUp,
} from "lucide-react";
import { SatsIDButton } from "@/components/auth/SatsIDButton";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface Stats {
  totalIdentities: number;
  totalStaked: number;
  verificationsToday: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-32 md:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-500 mb-8"
            >
              <Shield className="h-4 w-4" />
              Built on Stacks. Secured by Bitcoin.
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight"
            >
              <span className="text-white">We Solve </span>
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Fake Humans
              </span>
              <br />
              <span className="text-white">on the Internet</span>
              <br />
              <span className="text-white">Using </span>
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Bitcoin
              </span>
              <span className="text-white">.</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              The first identity protocol where trust costs real Bitcoin.
              Stake sBTC. Prove you&apos;re human. Fake it, and lose everything.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <SatsIDButton
                size="xl"
                onSuccess={() => router.push("/dashboard")}
              />
              <a
                href="/verify"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900/50 px-8 py-4 text-lg font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <Search className="h-5 w-5" />
                Verify Someone
              </a>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white">
                  {stats?.totalIdentities?.toLocaleString() || "---"}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total Identities</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-amber-500">
                  {stats?.totalStaked
                    ? (stats.totalStaked / 100_000_000).toFixed(2)
                    : "---"}
                </p>
                <p className="text-sm text-gray-500 mt-1">sBTC Staked</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white">
                  {stats?.verificationsToday?.toLocaleString() || "---"}
                </p>
                <p className="text-sm text-gray-500 mt-1">Verifications Today</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t border-gray-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Identity That Means Something
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              Unlike traditional identity systems, SatsID makes lying expensive.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Wallet,
                title: "Passwordless Auth",
                description:
                  "Sign in with your Stacks wallet. No passwords, no emails. Your Bitcoin keys are your identity.",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                icon: Lock,
                title: "Staked Reputation",
                description:
                  "Lock sBTC behind your identity. Your reputation is backed by real economic value on Bitcoin.",
                color: "text-amber-500",
                bg: "bg-amber-500/10",
              },
              {
                icon: Zap,
                title: "Pay-Per-Verify",
                description:
                  "x402 micropayments for instant trust verification. Know who you're dealing with for pennies.",
                color: "text-purple-500",
                bg: "bg-purple-500/10",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-gray-800 bg-gray-900/50 hover:border-gray-700 transition-all h-full group">
                  <CardContent className="pt-6">
                    <div
                      className={`h-12 w-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 border-t border-gray-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              How It Works
            </h2>
            <p className="mt-4 text-gray-400">
              Four steps to provable identity on Bitcoin
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: Wallet,
                title: "Connect Wallet",
                description: "Link your Stacks wallet to sign in with Bitcoin keys",
              },
              {
                step: "02",
                icon: Users,
                title: "Register Identity",
                description: "Create your on-chain identity anchored to Bitcoin",
              },
              {
                step: "03",
                icon: Lock,
                title: "Stake sBTC",
                description: "Lock real Bitcoin value behind your identity",
              },
              {
                step: "04",
                icon: Shield,
                title: "Get Verified",
                description: "Build reputation and earn trust through honest participation",
              },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-center">
                  <div className="text-5xl font-black text-gray-800 mb-4">
                    {step.step}
                  </div>
                  <div className="h-14 w-14 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-7 w-7 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>
                {/* Arrow connector */}
                {i < 3 && (
                  <div className="hidden md:block absolute top-16 -right-3 z-10">
                    <ArrowRight className="h-6 w-6 text-gray-700" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-gray-800/50">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Prove You&apos;re Real?
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              Join the Sybil-resistant revolution. Your identity, backed by Bitcoin.
            </p>
            <SatsIDButton
              size="xl"
              onSuccess={() => router.push("/dashboard")}
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
