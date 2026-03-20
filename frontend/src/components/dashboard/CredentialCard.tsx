"use client";

import React from "react";
import { Award, CheckCircle, XCircle, Clock, Copy, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { truncateAddress, formatTimeAgo } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface CredentialCardProps {
  credential: {
    id: string;
    title: string;
    type: string;
    issuer: string;
    issuedAt: string;
    status: "valid" | "revoked" | "expired";
    description?: string;
  };
}

export function CredentialCard({ credential }: CredentialCardProps) {
  const statusConfig = {
    valid: {
      label: "Valid",
      variant: "success" as const,
      icon: CheckCircle,
    },
    revoked: {
      label: "Revoked",
      variant: "destructive" as const,
      icon: XCircle,
    },
    expired: {
      label: "Expired",
      variant: "secondary" as const,
      icon: Clock,
    },
  };

  const config = statusConfig[credential.status];
  const StatusIcon = config.icon;

  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${credential.issuer}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link copied",
      description: "Verification link copied to clipboard",
    });
  };

  return (
    <Card className="border-gray-800 hover:border-gray-700 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h4 className="font-semibold text-white">{credential.title}</h4>
              <p className="text-sm text-gray-400">{credential.type}</p>
              <p className="text-xs text-gray-500 mt-1">
                By {truncateAddress(credential.issuer)} &middot;{" "}
                {formatTimeAgo(credential.issuedAt)}
              </p>
              {credential.description && (
                <p className="text-sm text-gray-400 mt-2">
                  {credential.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={config.variant}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {config.label}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-gray-400"
              onClick={handleCopyLink}
            >
              <Copy className="mr-1 h-3 w-3" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
