// Reputation tier thresholds
export const REPUTATION_TIERS = {
  PIONEER: { min: 0, max: 19, label: 'Pioneer' },
  BUILDER: { min: 20, max: 39, label: 'Builder' },
  TRUSTED: { min: 40, max: 59, label: 'Trusted' },
  PILLAR: { min: 60, max: 79, label: 'Pillar' },
  LEGEND: { min: 80, max: 100, label: 'Legend' },
} as const;

// Reputation score weights and thresholds
export const REPUTATION_CONFIG = {
  BASE_SCORE: 10,
  WALLET_AGE: {
    MAX_SCORE: 15,
    THRESHOLDS: [
      { blocks: 144 * 30, score: 3 },       // ~30 days
      { blocks: 144 * 90, score: 6 },       // ~90 days
      { blocks: 144 * 180, score: 9 },      // ~180 days
      { blocks: 144 * 365, score: 12 },     // ~1 year
      { blocks: 144 * 730, score: 15 },     // ~2 years
    ],
  },
  SBTC_STAKE: {
    MAX_SCORE: 30,
    THRESHOLDS: [
      { amount: 10000, score: 5 },          // 0.0001 sBTC
      { amount: 100000, score: 10 },        // 0.001 sBTC
      { amount: 1000000, score: 15 },       // 0.01 sBTC
      { amount: 10000000, score: 20 },      // 0.1 sBTC
      { amount: 100000000, score: 25 },     // 1 sBTC
      { amount: 1000000000, score: 30 },    // 10 sBTC
    ],
  },
  DURATION: {
    MAX_SCORE: 10,
    THRESHOLDS: [
      { blocks: 144 * 30, score: 2 },
      { blocks: 144 * 90, score: 4 },
      { blocks: 144 * 180, score: 6 },
      { blocks: 144 * 365, score: 8 },
      { blocks: 144 * 730, score: 10 },
    ],
  },
  ACTIVITY: {
    MAX_SCORE: 15,
    PER_INTERACTION: 3,                     // 3 points per unique contract interaction
  },
  CREDENTIALS: {
    MAX_SCORE: 10,
    PER_CREDENTIAL: 2,                      // 2 points per credential
  },
  CHALLENGE_SURVIVAL: {
    MAX_SCORE: 10,
    PER_SURVIVAL: 2,                        // 2 points per survived challenge
  },
} as const;

// x402 payment fee amounts (in micro-USDCx / 6 decimals)
export const X402_FEES = {
  FULL_VERIFY: Number(process.env.X402_VERIFY_FEE) || 500000,
  CREDENTIAL_VERIFY: Number(process.env.X402_CREDENTIAL_FEE) || 250000,
  HUMAN_CHECK: Number(process.env.X402_HUMAN_CHECK_FEE) || 100000,
} as const;

// Staking constants
export const STAKING = {
  MIN_STAKE_AMOUNT: 10000,                  // 0.0001 sBTC in satoshis
  UNSTAKE_DELAY_BLOCKS: 144,                // ~24 hours
  MAX_STAKE_AMOUNT: 10000000000,            // 100 sBTC in satoshis
} as const;

// Session/Auth constants
export const AUTH = {
  NONCE_EXPIRY_MS: 5 * 60 * 1000,          // 5 minutes
  SESSION_EXPIRY_MS: 24 * 60 * 60 * 1000,  // 24 hours
} as const;
