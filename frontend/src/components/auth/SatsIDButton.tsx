"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Loader2 } from "lucide-react";
import { useStacks } from "@/providers/StacksProvider";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SatsIDButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  size?: "default" | "lg" | "xl";
  className?: string;
}

export function SatsIDButton({
  onSuccess,
  onError,
  size = "lg",
  className,
}: SatsIDButtonProps) {
  const { isConnected, connectWallet } = useStacks();
  const { isAuthenticated, isLoading, login } = useAuth();

  const handleClick = async () => {
    try {
      if (!isConnected) {
        connectWallet();
        return;
      }
      if (!isAuthenticated) {
        await login();
        onSuccess?.();
      }
    } catch (err: any) {
      onError?.(err);
    }
  };

  if (isAuthenticated) return null;

  const sizeClasses = {
    default: "h-10 px-6 text-sm",
    lg: "h-12 px-8 text-base",
    xl: "h-16 px-12 text-lg",
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "relative inline-flex items-center justify-center gap-3 rounded-xl font-bold text-black",
        "bg-gradient-to-r from-amber-500 to-orange-500",
        "hover:from-amber-400 hover:to-orange-400",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-all duration-300",
        sizeClasses[size],
        className
      )}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 0 40px rgba(245, 158, 11, 0.4)",
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 opacity-0"
        animate={{
          opacity: [0, 0.4, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ filter: "blur(20px)" }}
      />

      <span className="relative flex items-center gap-3">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Shield className="h-5 w-5" />
        )}
        {isLoading
          ? "Connecting..."
          : isConnected
          ? "Sign In with Bitcoin"
          : "Connect Wallet"}
      </span>
    </motion.button>
  );
}
