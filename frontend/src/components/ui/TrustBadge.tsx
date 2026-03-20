"use client";

import React from "react";
import { getTierInfo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function TrustBadge({ score, size = "md", showLabel = true }: TrustBadgeProps) {
  const tier = getTierInfo(score);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        tier.bgColor,
        tier.textColor,
        sizeClasses[size]
      )}
    >
      <span>{tier.emoji}</span>
      {showLabel && <span>{tier.label}</span>}
    </div>
  );
}
