"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface BreakdownData {
  base: number;
  walletAge: number;
  sbtcStake: number;
  stakeDuration: number;
  activityScore: number;
  credentialScore: number;
  challengeBonus: number;
}

interface ReputationBreakdownProps {
  breakdown: BreakdownData;
}

export function ReputationBreakdown({ breakdown }: ReputationBreakdownProps) {
  const data = [
    { name: "Base", value: breakdown.base, color: "#6b7280" },
    { name: "Wallet Age", value: breakdown.walletAge, color: "#3b82f6" },
    { name: "sBTC Stake", value: breakdown.sbtcStake, color: "#f59e0b" },
    { name: "Duration", value: breakdown.stakeDuration, color: "#10b981" },
    { name: "Activity", value: breakdown.activityScore, color: "#8b5cf6" },
    { name: "Credentials", value: breakdown.credentialScore, color: "#ec4899" },
    { name: "Challenge", value: breakdown.challengeBonus, color: "#06b6d4" },
  ];

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" domain={[0, 30]} tick={{ fill: "#9ca3af", fontSize: 12 }} />
          <YAxis
            dataKey="name"
            type="category"
            width={90}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value: number) => [`${value} pts`, "Score"]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
