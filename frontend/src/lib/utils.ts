import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSbtc(microAmount: number): string {
  const amount = microAmount / 100_000_000;
  if (amount >= 1) return amount.toFixed(4) + " sBTC";
  if (amount >= 0.001) return amount.toFixed(6) + " sBTC";
  return amount.toFixed(8) + " sBTC";
}

export function formatUsdcx(microAmount: number): string {
  const amount = microAmount / 1_000_000;
  return "$" + amount.toFixed(2) + " USDCx";
}

export function truncateAddress(addr: string): string {
  if (!addr) return "";
  if (addr.length <= 14) return addr;
  return addr.slice(0, 8) + "..." + addr.slice(-4);
}

export interface TierInfo {
  label: string;
  color: string;
  emoji: string;
  bgColor: string;
  textColor: string;
}

export function getTierInfo(score: number): TierInfo {
  if (score >= 90) {
    return {
      label: "Diamond",
      color: "purple-500",
      emoji: "\u{1F48E}",
      bgColor: "bg-purple-500/20",
      textColor: "text-purple-400",
    };
  }
  if (score >= 70) {
    return {
      label: "Gold",
      color: "amber-500",
      emoji: "\u{1F947}",
      bgColor: "bg-amber-500/20",
      textColor: "text-amber-400",
    };
  }
  if (score >= 50) {
    return {
      label: "Silver",
      color: "gray-400",
      emoji: "\u{1F948}",
      bgColor: "bg-gray-400/20",
      textColor: "text-gray-300",
    };
  }
  if (score >= 30) {
    return {
      label: "Bronze",
      color: "orange-700",
      emoji: "\u{1F949}",
      bgColor: "bg-orange-700/20",
      textColor: "text-orange-400",
    };
  }
  return {
    label: "Untrusted",
    color: "red-500",
    emoji: "\u26A0\uFE0F",
    bgColor: "bg-red-500/20",
    textColor: "text-red-400",
  };
}

export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
