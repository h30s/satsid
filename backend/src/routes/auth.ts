import { Router, Request, Response } from 'express';
import { generateNonce, verifySignatureAndCreateToken, verifyToken } from '../services/auth.service';
import { getIdentity } from '../services/identity.service';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/nonce
 * Generate a challenge nonce for wallet authentication.
 */
router.post('/nonce', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.body;

    if (!address || typeof address !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'A valid Stacks address is required.',
      });
      return;
    }

    // Basic Stacks address validation
    if (!address.startsWith('ST') && !address.startsWith('SP') && !address.startsWith('SN')) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid Stacks address format.',
      });
      return;
    }

    const result = await generateNonce(address);

    res.status(200).json({
      nonce: result.nonce,
      message: result.message,
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating nonce:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate authentication nonce.',
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify a wallet signature and issue a JWT.
 */
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address, signature, publicKey, nonce } = req.body;

    if (!address || !signature || !publicKey || !nonce) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'address, signature, publicKey, and nonce are all required.',
      });
      return;
    }

    const { token, expiresAt } = await verifySignatureAndCreateToken(address, signature, publicKey, nonce);

    // Fetch on-chain identity data
    let identity;
    try {
      identity = await getIdentity(address);
    } catch {
      identity = { address, isRegistered: false };
    }

    res.status(200).json({
      token,
      user: {
        ...identity,
        address,
      },
    });
  } catch (error: any) {
    console.error('Error verifying signature:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify authentication.',
    });
  }
});

/**
 * GET /api/auth/me
 * Get the current authenticated user's profile.
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const address = req.user!.address;

    let identity;
    try {
      identity = await getIdentity(address);
    } catch {
      identity = { address, isRegistered: false };
    }

    res.status(200).json({
      user: {
        ...identity,
        address,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user profile.',
    });
  }
});

export default router;
