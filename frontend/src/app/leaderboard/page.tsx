"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Loader2, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { api } from "@/lib/api";
import { truncateAddress, formatSbtc } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  address: string;
  bnsName?: string;
  reputationScore: number;
  stakeAmount: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getLeaderboard()
      .then((data) => {
        const list = data.leaderboard || data || [];
        setEntries(
          list.map((entry: any, i: number) => ({
            rank: entry.rank || i + 1,
            address: entry.address,
            bnsName: entry.bnsName || entry.displayName,
            reputationScore: entry.totalScore || entry.reputationScore || entry.score || 0,
            stakeAmount: typeof entry.stakeAmount === "string" ? parseInt(entry.stakeAmount) || 0 : entry.stakeAmount || 0,
          }))
        );
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "text-amber-400";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-orange-400";
    return "text-gray-500";
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Medal className={`h-5 w-5 ${getRankStyle(rank)}`} />;
    return <span className={`text-sm font-mono ${getRankStyle(rank)}`}>{rank}</span>;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Reputation Leaderboard
        </h1>
        <p className="text-gray-400">
          Top identities ranked by reputation score
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : entries.length > 0 ? (
        <Card className="border-gray-800">
          <CardContent className="p-0">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-800 text-sm font-medium text-gray-500">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">Address / BNS</div>
              <div className="col-span-2 text-center">Score</div>
              <div className="col-span-2 text-center">Tier</div>
              <div className="col-span-2 text-right">Stake</div>
            </div>

            {/* Table body */}
            {entries.slice(0, 20).map((entry, i) => (
              <motion.div
                key={entry.address}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Address */}
                <div className="col-span-5">
                  <div className="flex items-center gap-3">
                    {/* Mini avatar */}
                    <div
                      className="h-8 w-8 rounded-full flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, hsl(${
                          entry.address
                            .split("")
                            .reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                        }, 70%, 50%), hsl(${
                          (entry.address
                            .split("")
                            .reduce((a, c) => a + c.charCodeAt(0), 0) *
                            7) %
                          360
                        }, 70%, 50%))`,
                      }}
                    />
                    <div>
                      {entry.bnsName && (
                        <p className="text-sm font-medium text-amber-500">
                          {entry.bnsName}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 font-mono">
                        {truncateAddress(entry.address)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="col-span-2 text-center">
                  <span className="text-lg font-bold text-white">
                    {entry.reputationScore}
                  </span>
                </div>

                {/* Tier */}
                <div className="col-span-2 flex justify-center">
                  <TrustBadge score={entry.reputationScore} size="sm" />
                </div>

                {/* Stake */}
                <div className="col-span-2 text-right">
                  <span className="text-sm text-amber-500 font-medium">
                    {entry.stakeAmount > 0
                      ? formatSbtc(entry.stakeAmount)
                      : "-"}
                  </span>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-800">
          <CardContent className="pt-6 text-center py-16">
            <Trophy className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No Data Yet
            </h3>
            <p className="text-gray-500">
              The leaderboard will populate as users register and build reputation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
