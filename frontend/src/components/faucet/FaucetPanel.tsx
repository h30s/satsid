"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Loader2, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { openContractCall } from "@stacks/connect";
import { uintCV, standardPrincipalCV, PostConditionMode } from "@stacks/transactions";
import { useStacks } from "@/providers/StacksProvider";
import { STACKS_NETWORK, SBTC_CONTRACT, USDCX_CONTRACT, splitContractId } from "@/lib/stacks";
import { toast } from "@/components/ui/use-toast";

export function FaucetPanel() {
  const { stxAddress, isConnected, connectWallet } = useStacks();
  const [mintingSbtc, setMintingSbtc] = useState(false);
  const [mintingUsdcx, setMintingUsdcx] = useState(false);

  const handleMintSbtc = async () => {
    if (!stxAddress) return;
    setMintingSbtc(true);
    try {
      const [addr, name] = splitContractId(SBTC_CONTRACT);
      await openContractCall({
        network: STACKS_NETWORK,
        contractAddress: addr,
        contractName: name,
        functionName: "faucet",
        functionArgs: [uintCV(100_000_000), standardPrincipalCV(stxAddress)], // 1 sBTC
        postConditionMode: PostConditionMode.Allow,
        postConditions: [],
        appDetails: { name: "SatsID", icon: "/icon.png" },
        onFinish: (data: any) => {
          console.log("sBTC mint tx:", data.txId);
          toast({
            title: "sBTC Mint Submitted!",
            description: `Transaction: ${data.txId.slice(0, 12)}... — wait ~10 minutes for confirmation.`,
          });
        },
        onCancel: () => {
          setMintingSbtc(false);
        },
      });
    } catch (err: any) {
      toast({
        title: "Minting Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setMintingSbtc(false);
    }
  };

  const handleMintUsdcx = async () => {
    if (!stxAddress) return;
    setMintingUsdcx(true);
    try {
      const [addr, name] = splitContractId(USDCX_CONTRACT);
      await openContractCall({
        network: STACKS_NETWORK,
        contractAddress: addr,
        contractName: name,
        functionName: "faucet",
        functionArgs: [uintCV(100_000_000), standardPrincipalCV(stxAddress)], // 100 USDCx
        postConditionMode: PostConditionMode.Allow,
        postConditions: [],
        appDetails: { name: "SatsID", icon: "/icon.png" },
        onFinish: (data: any) => {
          console.log("USDCx mint tx:", data.txId);
          toast({
            title: "USDCx Mint Submitted!",
            description: `Transaction: ${data.txId.slice(0, 12)}... — wait ~10 minutes for confirmation.`,
          });
        },
        onCancel: () => {
          setMintingUsdcx(false);
        },
      });
    } catch (err: any) {
      toast({
        title: "Minting Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setMintingUsdcx(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="border-gray-800">
        <CardContent className="pt-6 text-center">
          <Droplets className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Connect your wallet to use the faucet</p>
          <Button
            onClick={connectWallet}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* sBTC Faucet */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-gray-800 hover:border-amber-500/30 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Coins className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <span className="text-white">Test sBTC</span>
                <p className="text-xs text-gray-500 font-normal">Get 1 sBTC for testing</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              Mint test sBTC tokens to stake behind your identity and prove you&apos;re human.
            </p>
            <Button
              onClick={handleMintSbtc}
              disabled={mintingSbtc}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {mintingSbtc ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Minting...</>
              ) : (
                <><Coins className="mr-2 h-4 w-4" />Get Test sBTC</>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* USDCx Faucet */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-gray-800 hover:border-blue-500/30 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Coins className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <span className="text-white">Test USDCx</span>
                <p className="text-xs text-gray-500 font-normal">Get 100 USDCx for testing</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              Mint test USDCx tokens to pay for x402 identity verification micropayments.
            </p>
            <Button
              onClick={handleMintUsdcx}
              disabled={mintingUsdcx}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
            >
              {mintingUsdcx ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Minting...</>
              ) : (
                <><Coins className="mr-2 h-4 w-4" />Get Test USDCx</>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
