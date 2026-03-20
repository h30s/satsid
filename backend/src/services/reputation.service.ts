import { REPUTATION_CONFIG, REPUTATION_TIERS } from '../config/constants';
import { getTierFromScore } from '../utils/formatting';

export interface ReputationInput {
  walletAgeBlocks: number;
  stakeAmount: number;         // in micro/satoshi units
  stakeDurationBlocks: number;
  uniqueContractInteractions: number;
  credentialCount: number;
  challengesSurvived: number;
  isSlashed: boolean;
}

export interface ReputationBreakdown {
  totalScore: number;
  baseScore: number;
  walletAgeScore: number;
  stakeScore: number;
  durationScore: number;
  activityScore: number;
  credentialScore: number;
  challengeBonus: number;
  tier: string;
  isSlashed: boolean;
}

/**
 * Compute the reputation score based on on-chain data inputs.
 *
 * Score breakdown:
 * - Base: 10 (everyone starts here)
 * - Wallet age: 0-15
 * - sBTC stake: 0-30
 * - Stake duration: 0-10
 * - Activity (unique contract interactions): 0-15
 * - Credentials: 0-10
 * - Challenge survival: 0-10
 * - Slash: score = 0 permanently
 *
 * Max possible: 100
 */
export function computeReputation(input: ReputationInput): ReputationBreakdown {
  // If slashed, return zero score permanently
  if (input.isSlashed) {
    return {
      totalScore: 0,
      baseScore: 0,
      walletAgeScore: 0,
      stakeScore: 0,
      durationScore: 0,
      activityScore: 0,
      credentialScore: 0,
      challengeBonus: 0,
      tier: 'Slashed',
      isSlashed: true,
    };
  }

  const baseScore = REPUTATION_CONFIG.BASE_SCORE;

  // Wallet age score (0-15)
  let walletAgeScore = 0;
  for (const threshold of REPUTATION_CONFIG.WALLET_AGE.THRESHOLDS) {
    if (input.walletAgeBlocks >= threshold.blocks) {
      walletAgeScore = threshold.score;
    }
  }
  walletAgeScore = Math.min(walletAgeScore, REPUTATION_CONFIG.WALLET_AGE.MAX_SCORE);

  // sBTC stake score (0-30)
  let stakeScore = 0;
  for (const threshold of REPUTATION_CONFIG.SBTC_STAKE.THRESHOLDS) {
    if (input.stakeAmount >= threshold.amount) {
      stakeScore = threshold.score;
    }
  }
  stakeScore = Math.min(stakeScore, REPUTATION_CONFIG.SBTC_STAKE.MAX_SCORE);

  // Stake duration score (0-10)
  let durationScore = 0;
  for (const threshold of REPUTATION_CONFIG.DURATION.THRESHOLDS) {
    if (input.stakeDurationBlocks >= threshold.blocks) {
      durationScore = threshold.score;
    }
  }
  durationScore = Math.min(durationScore, REPUTATION_CONFIG.DURATION.MAX_SCORE);

  // Activity score (0-15)
  const activityScore = Math.min(
    input.uniqueContractInteractions * REPUTATION_CONFIG.ACTIVITY.PER_INTERACTION,
    REPUTATION_CONFIG.ACTIVITY.MAX_SCORE
  );

  // Credential score (0-10)
  const credentialScore = Math.min(
    input.credentialCount * REPUTATION_CONFIG.CREDENTIALS.PER_CREDENTIAL,
    REPUTATION_CONFIG.CREDENTIALS.MAX_SCORE
  );

  // Challenge survival bonus (0-10)
  const challengeBonus = Math.min(
    input.challengesSurvived * REPUTATION_CONFIG.CHALLENGE_SURVIVAL.PER_SURVIVAL,
    REPUTATION_CONFIG.CHALLENGE_SURVIVAL.MAX_SCORE
  );

  const totalScore = Math.min(
    baseScore + walletAgeScore + stakeScore + durationScore + activityScore + credentialScore + challengeBonus,
    100
  );

  const tier = getTierFromScore(totalScore);

  return {
    totalScore,
    baseScore,
    walletAgeScore,
    stakeScore,
    durationScore,
    activityScore,
    credentialScore,
    challengeBonus,
    tier,
    isSlashed: false,
  };
}

/**
 * Build a ReputationInput from on-chain data.
 * This is a convenience function that gathers data and feeds it to computeReputation.
 */
export function buildDefaultInput(): ReputationInput {
  return {
    walletAgeBlocks: 0,
    stakeAmount: 0,
    stakeDurationBlocks: 0,
    uniqueContractInteractions: 0,
    credentialCount: 0,
    challengesSurvived: 0,
    isSlashed: false,
  };
}
