"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, Unlock, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSbtc } from "@/lib/utils";
import Link from "next/link";

interface StakeCardProps {
  amount: number;
  status: "active" | "locked" | "cooldown" | "none";
  stakedAt?: string;
  durationDays?: number;
}

export function StakeCard({ amount, status, stakedAt, durationDays }: StakeCardProps) {
  const statusConfig = {
    active: { label: "Active", variant: "success" as const, icon: Lock },
    locked: { label: "Locked", variant: "warning" as const, icon: Lock },
    cooldown: { label: "Cooldown", variant: "info" as const, icon: Clock },
    none: { label: "No Stake", variant: "secondary" as const, icon: Unlock },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium text-gray-300">
            sBTC Stake
          </CardTitle>
          <Badge variant={config.variant}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-3xl font-bold text-amber-500">
                {amount > 0 ? formatSbtc(amount) : "0 sBTC"}
              </p>
              {durationDays !== undefined && durationDays > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Staked for {durationDays} day{durationDays !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {amount > 0 ? (
              <div className="flex gap-2">
                <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
                  <Link href="/dashboard/stake">
                    <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                    Stake More
                  </Link>
                </Button>
              </div>
            ) : (
              <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black">
                <Link href="/dashboard/stake">
                  <Lock className="mr-1.5 h-4 w-4" />
                  Stake sBTC
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
