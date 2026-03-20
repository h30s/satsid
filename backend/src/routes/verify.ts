import { Router, Request, Response } from 'express';
import { requirePayment } from '../middleware/x402';
import { X402_FEES } from '../config/constants';
import { getIdentity, getStake, getCredentials } from '../services/identity.service';
import {
  computeReputation,
  buildDefaultInput,
} from '../services/reputation.service';
import {
  getAccountTransactions,
  getCurrentBlockHeight,
} from '../services/stacks.service';

// In-memory verification log (non-critical, just for stats)
const verificationLog: Array<{ verifierAddr: string; targetAddr: string; verificationType: string; paymentTxId: string; timestamp: string }> = [];

const router = Router();

/** Get the total number of verifications (for stats). */
export function getVerificationCount(): number {
  return verificationLog.length;
}

/**
 * GET /api/verify/:address
 * Full identity verification (x402 gated: 500000 micro-USDCx).
 * Returns complete identity + reputation + credentials + stake.
 */
router.get(
  '/:address',
  requirePayment(X402_FEES.FULL_VERIFY, 'Full SatsID identity verification'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { address } = req.params;

      const [identity, stakeInfo, credentials] = await Promise.all([
        getIdentity(address),
        getStake(address),
        getCredentials(address),
      ]);

      // Compute reputation
      const input = buildDefaultInput();
      try {
        const [txData, currentBlock] = await Promise.all([
          getAccountTransactions(address, 50),
          getCurrentBlockHeight(),
        ]);

        const transactions = txData?.results || [];

        if (transactions.length > 0) {
          const firstTx = transactions[transactions.length - 1];
          input.walletAgeBlocks = currentBlock - (firstTx?.block_height || currentBlock);
        }

        if (stakeInfo.isActive) {
          input.stakeAmount = parseInt(stakeInfo.amount) || 0;
          input.stakeDurationBlocks = currentBlock - stakeInfo.stakedAt;
        }

        const uniqueContracts = new Set<string>();
        for (const tx of transactions) {
          if (tx.tx_type === 'contract_call' && tx.contract_call?.contract_id) {
            uniqueContracts.add(tx.contract_call.contract_id);
          }
        }
        input.uniqueContractInteractions = uniqueContracts.size;
        input.credentialCount = credentials.length;
      } catch {
        // Continue with defaults
      }

      const reputation = computeReputation(input);

      // Log the verification (in-memory, non-critical)
      const paymentTxId = (req.headers['x-payment-token'] as string) || 'bypass';
      const verifierAddr = (req as any).user?.address || 'anonymous';
      verificationLog.push({
        verifierAddr,
        targetAddr: address,
        verificationType: 'full',
        paymentTxId,
        timestamp: new Date().toISOString(),
      });

      identity.stakeAmount = stakeInfo.amount;

      res.status(200).json({
        verified: true,
        verifiedAt: new Date().toISOString(),
        identity,
        reputation,
        credentials,
        stake: stakeInfo,
      });
    } catch (error: any) {
      console.error('Error in full verification:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to perform identity verification.',
      });
    }
  }
);

/**
 * GET /api/verify/:address/credential/:id
 * Verify a specific credential (x402 gated: 250000 micro-USDCx).
 */
router.get(
  '/:address/credential/:id',
  requirePayment(X402_FEES.CREDENTIAL_VERIFY, 'SatsID credential verification'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { address, id } = req.params;
      const credentialId = parseInt(id);

      if (isNaN(credentialId)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Credential ID must be a number.',
        });
        return;
      }

      const credentials = await getCredentials(address);
      const credential = credentials.find((c) => c.id === credentialId);

      if (!credential) {
        res.status(404).json({
          error: 'Not Found',
          message: `Credential ${credentialId} not found for address ${address}.`,
        });
        return;
      }

      // Log the verification (in-memory, non-critical)
      const paymentTxId = (req.headers['x-payment-token'] as string) || 'bypass';
      verificationLog.push({
        verifierAddr: (req as any).user?.address || 'anonymous',
        targetAddr: address,
        verificationType: 'credential',
        paymentTxId,
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({
        verified: true,
        verifiedAt: new Date().toISOString(),
        credential,
        isRevoked: credential.isRevoked,
      });
    } catch (error: any) {
      console.error('Error in credential verification:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify credential.',
      });
    }
  }
);

/**
 * GET /api/verify/:address/human
 * Proof-of-human check (x402 gated: 100000 micro-USDCx).
 * Returns whether the address is a verified human.
 */
router.get(
  '/:address/human',
  requirePayment(X402_FEES.HUMAN_CHECK, 'SatsID proof-of-human check'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { address } = req.params;

      const [identity, stakeInfo] = await Promise.all([
        getIdentity(address),
        getStake(address),
      ]);

      // Compute a basic reputation for tier
      const input = buildDefaultInput();
      input.stakeAmount = parseInt(stakeInfo.amount) || 0;
      input.credentialCount = identity.credentialCount;

      const reputation = computeReputation(input);

      // A "verified human" is defined as:
      // - Has a registered identity
      // - Has an active stake
      // - Reputation tier is at least "Builder"
      const isVerifiedHuman =
        identity.isRegistered &&
        stakeInfo.isActive &&
        reputation.totalScore >= 20;

      // Log the verification (in-memory, non-critical)
      const paymentTxId = (req.headers['x-payment-token'] as string) || 'bypass';
      verificationLog.push({
        verifierAddr: (req as any).user?.address || 'anonymous',
        targetAddr: address,
        verificationType: 'human',
        paymentTxId,
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({
        isVerifiedHuman,
        stakeAmount: stakeInfo.amount,
        reputationScore: reputation.totalScore,
        tier: reputation.tier,
        verifiedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error in human check:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to perform proof-of-human check.',
      });
    }
  }
);

export default router;
