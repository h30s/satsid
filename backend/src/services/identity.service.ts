import { principalCV, uintCV, cvToJSON, hexToCV } from '@stacks/transactions';
import {
  SATSID_CORE_CONTRACT,
  SATSID_STAKE_CONTRACT,
  SATSID_CREDENTIALS_CONTRACT,
  buildApiUrl,
} from '../config/stacks';
import { callReadOnly, getAccountInfo } from './stacks.service';

export interface IdentityProfile {
  address: string;
  bnsName: string | null;
  displayName: string | null;
  bio: string | null;
  isVerified: boolean;
  isRegistered: boolean;
  reputationScore: number;
  credentialCount: number;
  stakeAmount: string;
}

export interface StakeInfo {
  address: string;
  amount: string;
  stakedAt: number;
  isActive: boolean;
}

export interface Credential {
  id: number;
  issuer: string;
  subject: string;
  credentialType: string;
  data: string;
  issuedAt: number;
  isRevoked: boolean;
}

/**
 * Get identity profile from the satsid-core contract.
 */
export async function getIdentity(address: string): Promise<IdentityProfile> {
  try {
    const result = await callReadOnly(
      SATSID_CORE_CONTRACT.address,
      SATSID_CORE_CONTRACT.name,
      'get-identity',
      [principalCV(address)]
    );

    // Result is (optional (tuple ...)) so we need result.value.value
    const optionalValue = result?.value;
    if (!optionalValue || !optionalValue.value) {
      throw new Error('Identity not found');
    }
    const identity = optionalValue.value;

    const displayName = identity?.['display-name']?.value || null;
    const bio = identity?.bio?.value || null;
    const isVerified = identity?.['is-verified']?.value || false;
    const reputationScore = parseInt(identity?.['reputation-score']?.value || '0');
    const credentialCount = parseInt(identity?.['credential-count']?.value || '0');

    const bnsName = await resolveBnsName(address);

    return {
      address,
      bnsName,
      displayName,
      bio,
      isVerified,
      isRegistered: true,
      reputationScore,
      credentialCount,
      stakeAmount: '0',
    };
  } catch (error: any) {
    // If contract call fails, return a default unregistered profile
    const bnsName = await resolveBnsName(address).catch(() => null);
    return {
      address,
      bnsName,
      displayName: null,
      bio: null,
      isVerified: false,
      isRegistered: false,
      reputationScore: 0,
      credentialCount: 0,
      stakeAmount: '0',
    };
  }
}

/**
 * Get staking info for an address from the satsid-stake contract.
 */
export async function getStake(address: string): Promise<StakeInfo> {
  try {
    const result = await callReadOnly(
      SATSID_STAKE_CONTRACT.address,
      SATSID_STAKE_CONTRACT.name,
      'get-stake',
      [principalCV(address)]
    );

    // Result is (optional (tuple ...)) so we need result.value.value for the tuple fields
    const optionalValue = result?.value;
    if (!optionalValue || !optionalValue.value) {
      // none — no stake
      return { address, amount: '0', stakedAt: 0, isActive: false };
    }

    const stake = optionalValue.value;
    const amount = stake?.amount?.value || '0';
    const stakedAt = parseInt(stake?.['staked-at']?.value || '0');
    const isLocked = stake?.['is-locked']?.value || false;
    const unstakeRequested = parseInt(stake?.['unstake-requested-at']?.value || '0');

    return {
      address,
      amount: amount.toString(),
      stakedAt,
      isActive: parseInt(amount) > 0,
    };
  } catch (error: any) {
    console.error('Error reading stake:', error.message);
    return {
      address,
      amount: '0',
      stakedAt: 0,
      isActive: false,
    };
  }
}

/**
 * Get credentials for an address from the satsid-credentials contract.
 */
export async function getCredentials(address: string): Promise<Credential[]> {
  try {
    const result = await callReadOnly(
      SATSID_CREDENTIALS_CONTRACT.address,
      SATSID_CREDENTIALS_CONTRACT.name,
      'get-credentials',
      [principalCV(address)]
    );

    const credentials = result?.value || result;

    if (Array.isArray(credentials)) {
      return credentials.map((cred: any, index: number) => {
        const c = cred?.value || cred;
        return {
          id: parseInt(c?.id?.value || index.toString()),
          issuer: c?.issuer?.value || '',
          subject: c?.subject?.value || address,
          credentialType: c?.['credential-type']?.value || c?.credentialType?.value || 'unknown',
          data: c?.data?.value || '',
          issuedAt: parseInt(c?.['issued-at']?.value || c?.issuedAt?.value || '0'),
          isRevoked: Boolean(c?.['is-revoked']?.value || c?.isRevoked?.value || false),
        };
      });
    }

    return [];
  } catch (error: any) {
    return [];
  }
}

/**
 * Attempt to resolve a BNS name for an address.
 */
export async function resolveBnsName(address: string): Promise<string | null> {
  try {
    const url = buildApiUrl(`/v1/addresses/stacks/${address}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    const data: any = await response.json();
    const names = data?.names || [];

    if (names.length > 0) {
      return names[0];
    }

    return null;
  } catch {
    return null;
  }
}
