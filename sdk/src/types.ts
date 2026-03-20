export interface SatsIDUser {
  address: string;
  bnsName?: string;
  displayName?: string;
  bio?: string;
  isRegistered: boolean;
  isVerified: boolean;
  reputationScore: number;
  stakeAmount?: string;
  credentialCount: number;
  tier: "untrusted" | "low" | "moderate" | "trusted" | "highly-trusted";
}

export interface SatsIDButtonProps {
  apiUrl: string;
  onSuccess: (user: SatsIDUser) => void;
  onError?: (error: Error) => void;
  theme?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  showReputation?: boolean;
  className?: string;
}

export interface SatsIDClientConfig {
  apiUrl: string;
  network?: "testnet" | "mainnet";
}

export interface VerificationReport {
  identity: SatsIDUser;
  reputation: {
    totalScore: number;
    baseScore: number;
    walletAgeScore: number;
    stakeScore: number;
    durationScore: number;
    activityScore: number;
    credentialScore: number;
    challengeBonus: number;
    tier: string;
  };
  credentials: Array<{
    id: number;
    type: string;
    title: string;
    issuer: string;
    issuedAt: number;
    isValid: boolean;
  }>;
  stake: {
    amount: string;
    stakedAt: number;
    isLocked: boolean;
  } | null;
  verifiedAt: string;
}

export interface PaymentInstructions {
  status: 402;
  payment: {
    network: string;
    recipient: string;
    amount: string;
    currency: string;
    contractAddress: string;
    memo: string;
    x402Version: string;
  };
  description: string;
}
