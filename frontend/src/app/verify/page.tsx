"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, CreditCard, Loader2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerificationReport } from "@/components/verify/VerificationReport";
import { useStacks } from "@/providers/StacksProvider";
import { openContractCall } from "@stacks/connect";
import {
  uintCV,
  standardPrincipalCV,
  PostConditionMode,
} from "@stacks/transactions";
import { STACKS_NETWORK, USDCX_CONTRACT, splitContractId } from "@/lib/stacks";
import { api } from "@/lib/api";

const VERIFICATION_FEE = 500_000; // 0.50 USDCx
const FEE_RECIPIENT = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

export default function VerifyPage() {
  const { stxAddress, isConnected, connectWallet } = useStacks();
  const [address, setAddress] = useState("");
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentTxId, setPaymentTxId] = useState<string | null>(null);

  const fetchReport = async (txId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const identity = await api.getIdentity(address);
      const repData = await api.getReputation(address);
      setReport({
        address,
        identity,
        reputation: repData?.reputation,
        paymentTxId: txId || null,
        verifiedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!address.trim()) return;

    if (!isConnected) {
      connectWallet();
      return;
    }

    // Try to send x402 USDCx payment via Leather
    try {
      const [usdcAddr, usdcName] = splitContractId(USDCX_CONTRACT);

      await openContractCall({
        network: STACKS_NETWORK,
        contractAddress: usdcAddr,
        contractName: usdcName,
        functionName: "transfer",
        functionArgs: [
          uintCV(VERIFICATION_FEE),
          standardPrincipalCV(stxAddress!),
          standardPrincipalCV(FEE_RECIPIENT),
          { type: 9, value: "none" } as any,
        ],
        postConditionMode: PostConditionMode.Allow,
        postConditions: [],
        appDetails: { name: "SatsID", icon: "/icon.png" },
        onFinish: (data: any) => {
          // Payment submitted — now fetch the report
          setPaymentTxId(data.txId);
          fetchReport(data.txId);
        },
        onCancel: () => {
          // User cancelled the payment — still fetch the report
          // In production this would be blocked, but on testnet we allow it
          fetchReport();
        },
      });
    } catch (err: any) {
      // If wallet call fails (no USDCx balance, etc), still fetch report
      fetchReport();
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-amber-500" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Verify an Identity
          </h1>
          <p className="text-gray-400 max-w-md mx-auto">
            Look up any Stacks address and get a full trust report via x402
            micropayment.
          </p>
        </div>
      </motion.div>

      {/* Search Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-gray-800 mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="verify-address" className="sr-only">
                  Stacks Address
                </Label>
                <Input
                  id="verify-address"
                  placeholder="Enter a Stacks address (e.g., ST1PQHQ...)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-12"
                />
              </div>
              <Button
                onClick={handleVerify}
                disabled={!address.trim() || isLoading}
                className="h-12 px-8 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Verify - $0.50 USDCx
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Verification costs $0.50 USDCx via x402 micropayment protocol
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="pt-6">
              <p className="text-red-400 text-sm">{error}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Report */}
      {report && <VerificationReport report={report} />}

      {/* How it works */}
      {!report && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-800 mt-8">
            <CardHeader>
              <CardTitle className="text-lg text-gray-300">
                How x402 Verification Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <span className="text-sm font-bold text-amber-500">1</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">Enter Address</h4>
                  <p className="text-sm text-gray-500">
                    Paste any Stacks address to look up
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <span className="text-sm font-bold text-amber-500">2</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">Pay $0.50 USDCx</h4>
                  <p className="text-sm text-gray-500">
                    Micropayment via x402 protocol
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <span className="text-sm font-bold text-amber-500">3</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">Get Report</h4>
                  <p className="text-sm text-gray-500">
                    Full trust report with reputation, stake, and credentials
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
