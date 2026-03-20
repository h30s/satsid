"use client";

import React from "react";
import { motion } from "framer-motion";
import { Droplets, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaucetPanel } from "@/components/faucet/FaucetPanel";

export default function FaucetPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Droplets className="h-8 w-8 text-blue-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Test Token Faucet
        </h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Get test tokens to try out SatsID on the Stacks testnet
        </p>
      </motion.div>

      <FaucetPanel />

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <Card className="border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-gray-300">
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-500">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Get Testnet STX
                  </p>
                  <p className="text-sm text-gray-400">
                    Visit the{" "}
                    <a
                      href="https://explorer.hiro.so/sandbox/faucet?chain=testnet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-500 hover:text-amber-400 inline-flex items-center gap-1"
                    >
                      Stacks Testnet Faucet
                      <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    to get free STX for gas fees.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-500">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Mint Test sBTC
                  </p>
                  <p className="text-sm text-gray-400">
                    Use the faucet above to mint test sBTC tokens. These are used
                    for staking behind your identity.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-500">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Mint Test USDCx
                  </p>
                  <p className="text-sm text-gray-400">
                    Mint USDCx tokens to pay for x402 identity verification
                    micropayments.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-500">4</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Start Building Trust
                  </p>
                  <p className="text-sm text-gray-400">
                    Stake sBTC, get credentials, verify others, and climb the
                    reputation leaderboard!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
