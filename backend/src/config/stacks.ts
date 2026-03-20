import dotenv from 'dotenv';
dotenv.config();

export interface ContractId {
  address: string;
  name: string;
}

function parseContractId(fullId: string): ContractId {
  const parts = fullId.split('.');
  if (parts.length !== 2) {
    throw new Error(`Invalid contract ID: ${fullId}`);
  }
  return { address: parts[0], name: parts[1] };
}

export const STACKS_NETWORK = process.env.STACKS_NETWORK || 'testnet';
export const STACKS_API_URL = process.env.STACKS_API_URL || 'https://api.testnet.hiro.so';

export const SATSID_CORE_CONTRACT = parseContractId(
  process.env.SATSID_CORE_CONTRACT || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-core'
);
export const SATSID_STAKE_CONTRACT = parseContractId(
  process.env.SATSID_STAKE_CONTRACT || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-stake'
);
export const SATSID_CREDENTIALS_CONTRACT = parseContractId(
  process.env.SATSID_CREDENTIALS_CONTRACT || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-credentials'
);
export const SBTC_CONTRACT = parseContractId(
  process.env.SBTC_CONTRACT || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc-token'
);
export const USDCX_CONTRACT = parseContractId(
  process.env.USDCX_CONTRACT || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-token'
);

export function buildApiUrl(path: string): string {
  const base = STACKS_API_URL.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function isTestnet(): boolean {
  return STACKS_NETWORK === 'testnet';
}
