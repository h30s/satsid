"use client";

import React from "react";
import { motion } from "framer-motion";
import { getTierInfo } from "@/lib/utils";

interface ReputationGaugeProps {
  score: number;
  size?: number;
}

export function ReputationGauge({ score, size = 200 }: ReputationGaugeProps) {
  const tier = getTierInfo(score);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  const colorMap: Record<string, string> = {
    "purple-500": "#a855f7",
    "amber-500": "#f59e0b",
    "gray-400": "#9ca3af",
    "orange-700": "#c2410c",
    "red-500": "#ef4444",
  };

  const strokeColor = colorMap[tier.color] || "#f59e0b";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgb(31 41 55)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          {/* Glow filter */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            filter="url(#glow)"
            opacity={0.5}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Counter from={0} to={score} />
          </motion.span>
          <span className={`text-sm font-semibold ${tier.textColor}`}>
            {tier.emoji} {tier.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function Counter({ from, to }: { from: number; to: number }) {
  const [count, setCount] = React.useState(from);

  React.useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + (to - from) * eased));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [from, to]);

  return <>{count}</>;
}
