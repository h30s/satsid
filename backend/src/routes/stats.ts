import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SATSID_CORE_CONTRACT, SATSID_STAKE_CONTRACT } from '../config/stacks';
import { callReadOnly } from '../services/stacks.service';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/stats
 * Get global SatsID platform statistics.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Try to fetch stats from contracts
    let totalIdentities = 0;
    let totalStaked = '0';
    let totalCredentials = 0;

    try {
      const identityStats = await callReadOnly(
        SATSID_CORE_CONTRACT.address,
        SATSID_CORE_CONTRACT.name,
        'get-total-identities',
        []
      );
      totalIdentities = parseInt(identityStats?.value || '0');
    } catch {
      // Fall back to cached data
      const cachedCount = await prisma.identityCache.count({
        where: { isRegistered: true },
      });
      totalIdentities = cachedCount;
    }

    try {
      const stakeStats = await callReadOnly(
        SATSID_STAKE_CONTRACT.address,
        SATSID_STAKE_CONTRACT.name,
        'get-total-staked',
        []
      );
      totalStaked = stakeStats?.value || '0';
    } catch {
      // Use cached data
    }

    // Count verifications from the log
    const totalVerifications = await prisma.verificationLog.count();

    // Count credentials from cache
    try {
      const credStats = await prisma.identityCache.aggregate({
        _sum: { credentialCount: true },
      });
      totalCredentials = credStats._sum.credentialCount || 0;
    } catch {
      totalCredentials = 0;
    }

    // Count payments processed
    const totalPayments = await prisma.paymentRecord.count();

    res.status(200).json({
      totalIdentities,
      totalStaked,
      totalVerifications,
      totalCredentials,
      totalPayments,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch platform statistics.',
    });
  }
});

/**
 * GET /api/leaderboard
 * Get the top identities by reputation score.
 * Fetches real on-chain data for known registered addresses.
 */
router.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const { getIdentity, getStake } = require('../services/identity.service');
    const { computeReputation, buildDefaultInput } = require('../services/reputation.service');
    const { getAccountTransactions, getCurrentBlockHeight } = require('../services/stacks.service');

    // Get total identities count from contract
    let totalCount = 0;
    try {
      const countResult = await callReadOnly(
        SATSID_CORE_CONTRACT.address,
        SATSID_CORE_CONTRACT.name,
        'get-total-identities',
        []
      );
      totalCount = parseInt(countResult?.value || '0');
    } catch {
      totalCount = 1; // At least the deployer
    }

    // Known registered addresses — in production this would come from event indexing
    // For now, gather from sessions table + deployer
    const knownAddresses = new Set<string>();
    knownAddresses.add('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');

    try {
      const sessions = await prisma.session.findMany({
        select: { address: true },
        distinct: ['address'],
      });
      sessions.forEach((s: any) => knownAddresses.add(s.address));
    } catch {}

    // Fetch on-chain data for each known address
    const leaderboard = [];
    for (const address of knownAddresses) {
      try {
        const identity = await getIdentity(address);
        if (!identity.isRegistered) continue;

        const stakeInfo = await getStake(address);

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
        } catch {}

        const reputation = computeReputation(input);

        leaderboard.push({
          rank: 0,
          address,
          displayName: identity.displayName,
          bnsName: identity.bnsName,
          totalScore: reputation.totalScore,
          tier: reputation.tier,
          stakeAmount: stakeInfo.amount,
          isVerified: identity.isVerified,
          baseScore: reputation.baseScore,
          stakeScore: reputation.stakeScore,
          activityScore: reputation.activityScore,
        });
      } catch {}
    }

    // Sort by score descending and assign ranks
    leaderboard.sort((a, b) => b.totalScore - a.totalScore);
    leaderboard.forEach((entry, i) => { entry.rank = i + 1; });

    res.status(200).json({
      leaderboard,
      total: leaderboard.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch leaderboard.',
    });
  }
});

export default router;
