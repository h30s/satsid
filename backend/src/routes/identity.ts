import { Router, Request, Response } from 'express';
import { getIdentity, getStake, getCredentials } from '../services/identity.service';
import {
  computeReputation,
  ReputationInput,
  buildDefaultInput,
} from '../services/reputation.service';
import {
  getAccountTransactions,
  getCurrentBlockHeight,
} from '../services/stacks.service';

const router = Router();

/**
 * GET /api/identity/:address
 * Get the public identity profile for an address.
 */
router.get('/:address', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;

    if (!address) {
      res.status(400).json({ error: 'Bad Request', message: 'Address is required.' });
      return;
    }

    const identity = await getIdentity(address);

    // Also fetch stake info to include in the profile
    let stakeInfo;
    try {
      stakeInfo = await getStake(address);
      identity.stakeAmount = stakeInfo.amount;
    } catch {
      // Stake info is optional
    }

    res.status(200).json(identity);
  } catch (error: any) {
    console.error('Error fetching identity:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch identity profile.',
    });
  }
});

/**
 * GET /api/identity/:address/reputation
 * Get detailed reputation breakdown for an address.
 */
router.get('/:address/reputation', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;

    // Gather on-chain data for reputation computation
    const input = buildDefaultInput();

    // Fetch transaction history for wallet age and activity
    try {
      const [txData, currentBlock, stakeInfo, credentials] = await Promise.all([
        getAccountTransactions(address, 50),
        getCurrentBlockHeight(),
        getStake(address),
        getCredentials(address),
      ]);

      const transactions = txData?.results || [];

      // Wallet age: difference between current block and first transaction block
      if (transactions.length > 0) {
        const firstTx = transactions[transactions.length - 1];
        const firstTxBlock = firstTx?.block_height || currentBlock;
        input.walletAgeBlocks = currentBlock - firstTxBlock;
      }

      // Stake amount and duration
      if (stakeInfo.isActive) {
        input.stakeAmount = parseInt(stakeInfo.amount) || 0;
        input.stakeDurationBlocks = currentBlock - stakeInfo.stakedAt;
      }

      // Unique contract interactions
      const uniqueContracts = new Set<string>();
      for (const tx of transactions) {
        if (tx.tx_type === 'contract_call' && tx.contract_call?.contract_id) {
          uniqueContracts.add(tx.contract_call.contract_id);
        }
      }
      input.uniqueContractInteractions = uniqueContracts.size;

      // Credential count
      input.credentialCount = credentials.length;
    } catch (error: any) {
      console.error('Error gathering reputation data:', error);
      // Continue with default input
    }

    const reputation = computeReputation(input);

    res.status(200).json({
      address,
      reputation,
      computedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error computing reputation:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to compute reputation.',
    });
  }
});

/**
 * GET /api/identity/:address/credentials
 * Get all credentials for an address.
 */
router.get('/:address/credentials', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    const credentials = await getCredentials(address);

    res.status(200).json({
      address,
      credentials,
      count: credentials.length,
    });
  } catch (error: any) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch credentials.',
    });
  }
});

/**
 * GET /api/identity/:address/stake
 * Get staking info for an address.
 */
router.get('/:address/stake', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    const stakeInfo = await getStake(address);

    res.status(200).json(stakeInfo);
  } catch (error: any) {
    console.error('Error fetching stake info:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch stake information.',
    });
  }
});

export default router;
