"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Award, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useStacks } from "@/providers/StacksProvider";
import { openContractCall } from "@stacks/connect";
import {
  stringAsciiCV,
  standardPrincipalCV,
  PostConditionMode,
} from "@stacks/transactions";
import {
  STACKS_NETWORK,
  SATSID_CREDENTIALS_CONTRACT,
  splitContractId,
} from "@/lib/stacks";
import Link from "next/link";

const credentialTypes = [
  "identity-verification",
  "skill-endorsement",
  "membership",
  "achievement",
  "kyc-verified",
  "dao-member",
  "developer",
  "community-leader",
];

export default function IssuePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { stxAddress } = useStacks();
  const [recipient, setRecipient] = useState("");
  const [credType, setCredType] = useState(credentialTypes[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!recipient || !title) {
        throw new Error("Recipient and title are required");
      }

      const [contractAddr, contractName] = splitContractId(
        SATSID_CREDENTIALS_CONTRACT
      );

      await openContractCall({
        network: STACKS_NETWORK,
        contractAddress: contractAddr,
        contractName: contractName,
        functionName: "issue-credential",
        functionArgs: [
          standardPrincipalCV(recipient),
          stringAsciiCV(credType),
          stringAsciiCV(title.slice(0, 64)),
          stringAsciiCV((description || "").slice(0, 256)),
        ],
        postConditionMode: PostConditionMode.Allow,
        appDetails: {
          name: "SatsID",
          icon: "/icon.png",
        },
        onFinish: (data: any) => {
          console.log("Issue credential tx:", data.txId);
          setSuccess(true);
          setIsSubmitting(false);
        },
        onCancel: () => {
          setIsSubmitting(false);
        },
      });
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <Button asChild variant="ghost" className="mb-6 text-gray-400">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-8">Issue Credential</h1>
      </motion.div>

      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Credential Issued!
              </h2>
              <p className="text-gray-400 mb-6">
                The transaction has been submitted. The credential will appear
                once confirmed on-chain.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setRecipient("");
                    setTitle("");
                    setDescription("");
                  }}
                  variant="outline"
                >
                  Issue Another
                </Button>
                <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card className="border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              New Credential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Credential Type</Label>
                <select
                  id="type"
                  value={credType}
                  onChange={(e) => setCredType(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {credentialTypes.map((type) => (
                    <option key={type} value={type}>
                      {type
                        .split("-")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Senior Developer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={64}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <textarea
                  id="description"
                  placeholder="Describe the credential..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={256}
                  rows={3}
                  className="flex w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold h-12"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Award className="mr-2 h-4 w-4" />
                    Issue Credential
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
