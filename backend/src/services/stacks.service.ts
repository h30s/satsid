import { buildApiUrl, STACKS_API_URL } from '../config/stacks';
import {
  cvToJSON,
  hexToCV,
  serializeCV,
  stringAsciiCV,
  uintCV,
  principalCV,
  noneCV,
  ClarityValue,
} from '@stacks/transactions';

/**
 * Make a read-only contract call against the Stacks API.
 */
export async function callReadOnly(
  contractAddress: string,
  contractName: string,
  functionName: string,
  args: ClarityValue[] = [],
  senderAddress?: string
): Promise<any> {
  const url = buildApiUrl(
    `/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`
  );

  const sender = senderAddress || contractAddress;

  const body = {
    sender: sender,
    arguments: args.map((arg) => `0x${Buffer.from(serializeCV(arg)).toString('hex')}`),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stacks API call failed (${response.status}): ${errorText}`);
  }

  const data: any = await response.json();

  if (!data.okay) {
    throw new Error(`Contract call failed: ${data.cause || 'unknown error'}`);
  }

  // Parse the Clarity value result
  const resultCV = hexToCV(data.result);
  return cvToJSON(resultCV);
}

/**
 * Fetch transaction details from the Stacks API.
 */
export async function getTransactionInfo(txId: string): Promise<any> {
  const cleanTxId = txId.startsWith('0x') ? txId : `0x${txId}`;
  const url = buildApiUrl(`/extended/v1/tx/${cleanTxId}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const errorText = await response.text();
    throw new Error(`Failed to fetch transaction (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch account info (balances, nonces) from the Stacks API.
 */
export async function getAccountInfo(address: string): Promise<any> {
  const url = buildApiUrl(`/extended/v1/address/${address}/balances`);

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const errorText = await response.text();
    throw new Error(`Failed to fetch account info (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Get the current block height from the Stacks API.
 */
export async function getCurrentBlockHeight(): Promise<number> {
  const url = buildApiUrl('/extended/v1/block?limit=1');

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch block height: ${response.status}`);
  }

  const data: any = await response.json();
  return data.results?.[0]?.height || 0;
}

/**
 * Get account transactions to determine wallet age and activity.
 */
export async function getAccountTransactions(
  address: string,
  limit: number = 50
): Promise<any> {
  const url = buildApiUrl(`/extended/v1/address/${address}/transactions?limit=${limit}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return { results: [] };
    }
    const errorText = await response.text();
    throw new Error(`Failed to fetch transactions (${response.status}): ${errorText}`);
  }

  return response.json();
}
