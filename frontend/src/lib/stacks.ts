import { StacksTestnet, StacksMainnet } from "@stacks/network";

const networkType = process.env.NEXT_PUBLIC_STACKS_NETWORK || "testnet";

export const STACKS_NETWORK =
  networkType === "mainnet" ? new StacksMainnet() : new StacksTestnet();

export const STACKS_API_URL =
  process.env.NEXT_PUBLIC_STACKS_API_URL || "https://api.testnet.hiro.so";

// Contract addresses
export const SATSID_CORE_CONTRACT =
  process.env.NEXT_PUBLIC_SATSID_CORE_CONTRACT ||
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-core";

export const SATSID_STAKE_CONTRACT =
  process.env.NEXT_PUBLIC_SATSID_STAKE_CONTRACT ||
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-stake";

export const SATSID_CREDENTIALS_CONTRACT =
  process.env.NEXT_PUBLIC_SATSID_CREDENTIALS_CONTRACT ||
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-credentials";

export const SBTC_CONTRACT =
  process.env.NEXT_PUBLIC_SBTC_CONTRACT ||
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-sbtc";

export const USDCX_CONTRACT =
  process.env.NEXT_PUBLIC_USDCX_CONTRACT ||
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-usdcx";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "SatsID";

// Helper to split contract identifier into [address, name]
export function splitContractId(contractId: string): [string, string] {
  const parts = contractId.split(".");
  return [parts[0], parts[1]];
}

// Get contract address and name from a contract identifier
export function getContractParts(contractId: string) {
  const [contractAddress, contractName] = splitContractId(contractId);
  return { contractAddress, contractName };
}
