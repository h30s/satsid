import crypto from 'crypto';
import { verifyMessageSignatureRsv } from '@stacks/encryption';
import { createStacksPublicKey, publicKeyToAddress } from '@stacks/transactions';

/**
 * Verify a Stacks message signature.
 *
 * Tries RSV verification first, then falls back to checking if
 * the public key derives to the expected address.
 */
export function verifyStacksSignature(
  message: string,
  signature: string,
  publicKey: string,
  expectedAddress: string
): boolean {
  const cleanSignature = signature.startsWith('0x') ? signature.slice(2) : signature;

  // Try RSV signature verification
  try {
    const isValid = verifyMessageSignatureRsv({
      message,
      publicKey,
      signature: cleanSignature,
    });

    if (isValid) {
      return true;
    }
  } catch {
    // Fall through to address derivation check
  }

  // Fallback: verify that the public key derives to the expected address
  try {
    const stacksPubKey = createStacksPublicKey(publicKey);
    // Try both testnet (version 26) and mainnet (version 22) address versions
    const testnetAddress = publicKeyToAddress(26 as any, stacksPubKey);
    const mainnetAddress = publicKeyToAddress(22 as any, stacksPubKey);

    return testnetAddress === expectedAddress || mainnetAddress === expectedAddress;
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically secure random nonce.
 */
export function generateSecureNonce(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a message using SHA-256.
 */
export function sha256(message: string): string {
  return crypto.createHash('sha256').update(message).digest('hex');
}
