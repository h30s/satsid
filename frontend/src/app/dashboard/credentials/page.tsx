"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CredentialCard } from "@/components/dashboard/CredentialCard";
import { useAuth } from "@/hooks/useAuth";
import { useStacks } from "@/providers/StacksProvider";
import { api } from "@/lib/api";
import Link from "next/link";

export default function CredentialsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { stxAddress } = useStacks();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const address = stxAddress || user?.address;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (address) {
      api
        .getCredentials(address)
        .then((data) => setCredentials(data.credentials || data || []))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [address]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <Button asChild variant="ghost" className="mb-6 text-gray-400">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <h1 className="text-3xl font-bold text-white">Credentials</h1>
        <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black">
          <Link href="/issue">
            <Award className="mr-2 h-4 w-4" />
            Issue New
          </Link>
        </Button>
      </motion.div>

      {credentials.length > 0 ? (
        <div className="space-y-4">
          {credentials.map((cred: any, i: number) => (
            <motion.div
              key={cred.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <CredentialCard credential={cred} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Award className="h-16 w-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No Credentials Yet
          </h3>
          <p className="text-gray-500 mb-6">
            Credentials are issued by other users to verify your skills,
            memberships, or achievements.
          </p>
          <Button asChild variant="outline">
            <Link href="/issue">Issue a Credential</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
