import { REPUTATION_TIERS } from '../config/constants';

/**
 * Convert micro-sBTC (satoshis) to sBTC display value.
 * sBTC has 8 decimal places.
 */
export function formatMicroToSbtc(microAmount: string | number): string {
  const amount = typeof microAmount === 'string' ? parseInt(microAmount) : microAmount;
  if (isNaN(amount)) return '0';
  return (amount / 100_000_000).toFixed(8);
}

/**
 * Convert micro-USDCx to USDCx display value.
 * USDCx has 6 decimal places.
 */
export function formatMicroToUsdcx(microAmount: string | number): string {
  const amount = typeof microAmount === 'string' ? parseInt(microAmount) : microAmount;
  if (isNaN(amount)) return '0';
  return (amount / 1_000_000).toFixed(6);
}

/**
 * Truncate a Stacks address for display.
 * e.g., ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM -> ST1PQH...TPGZGM
 */
export function truncateAddress(address: string, prefixLen: number = 6, suffixLen: number = 6): string {
  if (!address || address.length <= prefixLen + suffixLen + 3) {
    return address;
  }
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}

/**
 * Get the reputation tier label from a numeric score.
 */
export function getTierFromScore(score: number): string {
  if (score >= REPUTATION_TIERS.LEGEND.min) return REPUTATION_TIERS.LEGEND.label;
  if (score >= REPUTATION_TIERS.PILLAR.min) return REPUTATION_TIERS.PILLAR.label;
  if (score >= REPUTATION_TIERS.TRUSTED.min) return REPUTATION_TIERS.TRUSTED.label;
  if (score >= REPUTATION_TIERS.BUILDER.min) return REPUTATION_TIERS.BUILDER.label;
  return REPUTATION_TIERS.PIONEER.label;
}

/**
 * Format a block height into an approximate time string.
 * Stacks averages ~10 minutes per block.
 */
export function blocksToTimeString(blocks: number): string {
  const minutes = blocks * 10;
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  return `${years} years`;
}
