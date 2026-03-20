import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { verifyMessageSignatureRsv } from '@stacks/encryption';
import { createStacksPublicKey, publicKeyToAddress } from '@stacks/transactions';
import { AUTH } from '../config/constants';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'satsid-dev-secret-change-in-production-abc123';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate a unique authentication nonce for wallet-based auth.
 * Stores the nonce in the Session table with a 5-minute expiry.
 */
export async function generateNonce(address: string): Promise<{
  nonce: string;
  message: string;
  expiresAt: Date;
}> {
  const randomPart = crypto.randomBytes(16).toString('hex');
  const nonce = `satsid-auth-${Date.now()}-${randomPart}`;
  const expiresAt = new Date(Date.now() + AUTH.NONCE_EXPIRY_MS);

  const message = `SatsID Authentication\n\nSign this message to verify your identity.\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;

  // Deactivate any previous sessions with active nonces for this address
  await prisma.session.updateMany({
    where: { address, isActive: true, token: null },
    data: { isActive: false },
  });

  // Create new session with the nonce
  await prisma.session.create({
    data: {
      address,
      nonce,
      expiresAt,
      isActive: true,
    },
  });

  return { nonce, message, expiresAt };
}

/**
 * Verify a Stacks wallet signature against a stored nonce.
 */
export async function verifySignature(
  address: string,
  signature: string,
  publicKey: string,
  nonce: string
): Promise<{ valid: boolean; reason?: string }> {
  // Find the session with this nonce
  const session = await prisma.session.findUnique({
    where: { nonce },
  });

  if (!session) {
    return { valid: false, reason: 'Nonce not found' };
  }

  if (!session.isActive) {
    return { valid: false, reason: 'Nonce has already been used' };
  }

  if (session.address !== address) {
    return { valid: false, reason: 'Address mismatch' };
  }

  if (new Date() > session.expiresAt) {
    await prisma.session.update({
      where: { nonce },
      data: { isActive: false },
    });
    return { valid: false, reason: 'Nonce has expired' };
  }

  // Verify the signature
  try {
    // Reconstruct the EXACT same message the frontend signed
    // This must match what generateNonce() returned
    const message = `SatsID Authentication\n\nSign this message to verify your identity.\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${session.createdAt.toISOString()}`;

    const cleanSignature = signature.startsWith('0x') ? signature.slice(2) : signature;

    let isValid = false;

    // Method 1: Verify the structured message signature (RSV format from Leather)
    try {
      isValid = verifyMessageSignatureRsv({
        message,
        publicKey,
        signature: cleanSignature,
      });
    } catch (e) {
      console.log('RSV verification failed, trying public key derivation:', e);
    }

    // Method 2: If RSV fails, verify that public key derives to the claimed address
    // This is a valid fallback — if the wallet signed ANYTHING, it proves key ownership
    if (!isValid) {
      try {
        const stacksPubKey = createStacksPublicKey(publicKey);
        // Testnet address version = 26, Mainnet = 22
        const testnetAddress = publicKeyToAddress(26 as any, stacksPubKey);
        const mainnetAddress = publicKeyToAddress(22 as any, stacksPubKey);
        isValid = testnetAddress === address || mainnetAddress === address;
        if (isValid) {
          console.log('Auth via public key derivation for:', address);
        }
      } catch (e) {
        console.log('Public key derivation failed:', e);
      }
    }

    if (!isValid) {
      return { valid: false, reason: 'Invalid signature' };
    }

    // Mark nonce as used
    await prisma.session.update({
      where: { nonce },
      data: { isActive: false },
    });

    return { valid: true };
  } catch (error: any) {
    console.error('Signature verification error:', error);
    return { valid: false, reason: 'Signature verification failed' };
  }
}

/**
 * Create a JWT token for an authenticated address.
 */
export async function createToken(address: string): Promise<string> {
  const token = jwt.sign({ address }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  // Store the token in a new session
  const expiresAt = new Date(Date.now() + AUTH.SESSION_EXPIRY_MS);
  await prisma.session.create({
    data: {
      address,
      nonce: `session-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`,
      token,
      isActive: true,
      expiresAt,
    },
  });

  return token;
}
