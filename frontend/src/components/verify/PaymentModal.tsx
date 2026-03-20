"use client";

import React, { useState } from "react";
import { Loader2, CreditCard, CheckCircle, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { openContractCall } from "@stacks/connect";
import {
  uintCV,
  standardPrincipalCV,
  PostConditionMode,
  makeStandardFungiblePostCondition,
  FungibleConditionCode,
  createAssetInfo,
} from "@stacks/transactions";
import { STACKS_NETWORK, USDCX_CONTRACT, splitContractId } from "@/lib/stacks";
import { useStacks } from "@/providers/StacksProvider";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number; // in micro USDCx
  recipient: string;
  onPaymentComplete: (txId: string) => void;
  description?: string;
}

export function PaymentModal({
  open,
  onOpenChange,
  amount,
  recipient,
  onPaymentComplete,
  description,
}: PaymentModalProps) {
  const { stxAddress } = useStacks();
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayAmount = (amount / 1_000_000).toFixed(2);

  const handlePay = async () => {
    if (!stxAddress) return;

    setStatus("pending");
    setError(null);

    try {
      const [usdcAddr, usdcName] = splitContractId(USDCX_CONTRACT);

      await openContractCall({
        network: STACKS_NETWORK,
        contractAddress: usdcAddr,
        contractName: usdcName,
        functionName: "transfer",
        functionArgs: [
          uintCV(amount),
          standardPrincipalCV(stxAddress),
          standardPrincipalCV(recipient),
          { type: 9, value: "none" } as any, // none memo
        ],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [
          makeStandardFungiblePostCondition(
            stxAddress,
            FungibleConditionCode.Equal,
            amount,
            createAssetInfo(usdcAddr, usdcName, "usdcx")
          ),
        ],
        appDetails: {
          name: "SatsID",
          icon: "/icon.png",
        },
        onFinish: (data: any) => {
          setTxId(data.txId);
          setStatus("success");
          onPaymentComplete(data.txId);
        },
        onCancel: () => {
          setStatus("idle");
        },
      });
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-500" />
            x402 Payment
          </DialogTitle>
          <DialogDescription>
            {description || "Pay to verify identity"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment details */}
          <div className="rounded-lg bg-gray-800/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Amount</span>
              <span className="text-lg font-bold text-amber-500">
                ${displayAmount} USDCx
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Network</span>
              <span className="text-sm text-white">Stacks Testnet</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Protocol</span>
              <span className="text-sm text-white">x402 Micropayment</span>
            </div>
          </div>

          {/* Status */}
          {status === "success" && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 p-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-400">Payment Successful</p>
                {txId && (
                  <p className="text-xs text-green-500/70 font-mono mt-0.5">
                    TX: {txId.slice(0, 16)}...
                  </p>
                )}
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-400">Payment Failed</p>
                <p className="text-xs text-red-500/70 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {status === "success" ? (
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Done
            </Button>
          ) : (
            <Button
              onClick={handlePay}
              disabled={status === "pending"}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {status === "pending" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ${displayAmount} & Verify
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
