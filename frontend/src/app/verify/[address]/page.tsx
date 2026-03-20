"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationReport } from "@/components/verify/VerificationReport";
import { PaymentModal } from "@/components/verify/PaymentModal";
import { Card, CardContent } from "@/components/ui/card";
import { useStacks } from "@/providers/StacksProvider";
import { api } from "@/lib/api";
import Link from "next/link";

const VERIFICATION_FEE = 500_000;
const FEE_RECIPIENT = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

export default function VerifyAddressPage() {
  const params = useParams();
  const address = params.address as string;
  const { isConnected, connectWallet } = useStacks();

  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [needsPayment, setNeedsPayment] = useState(true);

  // Try to fetch free preview first
  useEffect(() => {
    if (!address) return;
    setIsLoading(true);
    api
      .verifyIdentity(address)
      .then((data) => {
        setReport(data);
        setNeedsPayment(false);
      })
      .catch((err) => {
        // 402 means payment required
        if (err.message.includes("402") || err.message.includes("payment")) {
          setNeedsPayment(true);
        } else {
          setError(err.message);
        }
      })
      .finally(() => setIsLoading(false));
  }, [address]);

  const handlePaymentComplete = async (txId: string) => {
    setShowPayment(false);
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.verifyIdentity(address, txId);
      setReport(data);
      setNeedsPayment(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <Button asChild variant="ghost" className="mb-6 text-gray-400">
        <Link href="/verify">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Verify
        </Link>
      </Button>

      <h1 className="text-2xl font-bold text-white mb-6">
        Verification Report
      </h1>

      {isLoading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      )}

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {needsPayment && !isLoading && !report && (
        <Card className="border-gray-800">
          <CardContent className="pt-6 text-center py-16">
            <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">$</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Payment Required
            </h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              This verification requires a $0.50 USDCx micropayment via x402
              protocol. Your payment goes directly to supporting the network.
            </p>
            <Button
              onClick={() => {
                if (!isConnected) {
                  connectWallet();
                } else {
                  setShowPayment(true);
                }
              }}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold h-12 px-8"
            >
              Pay $0.50 & View Report
            </Button>
          </CardContent>
        </Card>
      )}

      {report && <VerificationReport report={report} />}

      <PaymentModal
        open={showPayment}
        onOpenChange={setShowPayment}
        amount={VERIFICATION_FEE}
        recipient={FEE_RECIPIENT}
        onPaymentComplete={handlePaymentComplete}
        description={`Verify identity of ${address}`}
      />
    </div>
  );
}
