"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, CheckCircle, Shield, UserPlus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { truncateAddress } from "@/lib/utils";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { toast } from "@/components/ui/use-toast";

interface IdentityOverviewProps {
  address: string;
  bnsName?: string;
  displayName?: string;
  isActive: boolean;
  isRegistered?: boolean;
  stakeAmount?: number;
  reputationScore?: number;
  onRegister?: (displayName: string, bio: string) => Promise<void>;
  isRegistering?: boolean;
}

export function IdentityOverview({
  address,
  bnsName,
  displayName,
  isActive,
  isRegistered,
  stakeAmount,
  reputationScore,
  onRegister,
  isRegistering,
}: IdentityOverviewProps) {
  const [copied, setCopied] = React.useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [regName, setRegName] = useState("");
  const [regBio, setRegBio] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast({ title: "Address copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegister = async () => {
    if (!onRegister) return;
    const name = regName.trim() || "SatsID User";
    const bio = regBio.trim() || "Identity registered on SatsID";
    await onRegister(name, bio);
    toast({ title: "Registration transaction submitted! Wait ~10 minutes for confirmation." });
    setShowRegister(false);
  };

  const avatarColors = React.useMemo(() => {
    const hash = address.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const hue1 = hash % 360;
    const hue2 = (hash * 7) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 70%, 50%))`;
  }, [address]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-gray-300">
            Identity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div
              className="h-16 w-16 rounded-full flex-shrink-0 ring-2 ring-gray-700"
              style={{ background: avatarColors }}
            />

            <div className="flex-1 min-w-0">
              {/* Name */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-white truncate">
                  {displayName || bnsName || truncateAddress(address)}
                </h3>
                {isActive && (
                  <Badge variant="success">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                )}
              </div>

              {bnsName && (
                <p className="text-sm text-amber-500 font-medium">{bnsName}</p>
              )}

              {/* Address */}
              <div className="flex items-center gap-1 mt-1">
                <code className="text-xs text-gray-500 font-mono">
                  {truncateAddress(address)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-gray-500" />
                  )}
                </Button>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-3">
                {stakeAmount && stakeAmount > 0 ? (
                  <Badge variant="warning">
                    <Shield className="mr-1 h-3 w-3" />
                    Verified Human
                  </Badge>
                ) : null}
                {reputationScore !== undefined && (
                  <TrustBadge score={reputationScore} size="sm" />
                )}
              </div>

              {/* Registration prompt */}
              {!isRegistered && !showRegister && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-400 mb-2">
                    Your identity is not registered on-chain yet. Register to unlock staking and credentials.
                  </p>
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                    onClick={() => setShowRegister(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register Identity
                  </Button>
                </div>
              )}

              {/* Registration form */}
              {!isRegistered && showRegister && (
                <div className="mt-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700 space-y-3">
                  <div>
                    <Label htmlFor="regName" className="text-sm text-gray-400">Display Name</Label>
                    <Input
                      id="regName"
                      placeholder="e.g. Himanshu"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="regBio" className="text-sm text-gray-400">Bio (optional)</Label>
                    <Input
                      id="regBio"
                      placeholder="e.g. Builder on Bitcoin"
                      value={regBio}
                      onChange={(e) => setRegBio(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRegister}
                      disabled={isRegistering}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                      size="sm"
                    >
                      {isRegistering ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registering...</>
                      ) : (
                        <><UserPlus className="mr-2 h-4 w-4" />Register On-Chain</>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRegister(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
