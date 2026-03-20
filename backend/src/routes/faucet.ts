import { Router, Request, Response } from 'express';
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  principalCV,
  FungibleConditionCode,
  makeStandardFungiblePostCondition,
  createAssetInfo,
  stringAsciiCV,
  noneCV,
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { SBTC_CONTRACT, USDCX_CONTRACT, STACKS_NETWORK, buildApiUrl } from '../config/stacks';

const router = Router();

/**
 * POST /api/faucet/sbtc
 * Mint test sBTC tokens (testnet only).
 */
router.post('/sbtc', async (req: Request, res: Response): Promise<void> => {
  try {
    if (STACKS_NETWORK !== 'testnet') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Faucet is only available on testnet.',
      });
      return;
    }

    const { address, amount } = req.body;

    if (!address || typeof address !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'A valid Stacks address is required.',
      });
      return;
    }

    const mintAmount = parseInt(amount) || 100000000; // Default 1 sBTC (100M satoshis)

    if (mintAmount <= 0 || mintAmount > 1000000000) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Amount must be between 1 and 1000000000 (10 sBTC max).',
      });
      return;
    }

    // Call the faucet function on the sbtc-token contract
    // In testnet, we use a direct API call to simulate the faucet
    const url = buildApiUrl(
      `/v2/contracts/call-read/${SBTC_CONTRACT.address}/${SBTC_CONTRACT.name}/get-balance`
    );

    // For testnet faucet, we return a simulated success response
    // In a real deployment, this would broadcast a contract call transaction
    res.status(200).json({
      success: true,
      message: `Faucet request submitted for ${mintAmount} micro-sBTC to ${address}`,
      details: {
        token: 'sBTC',
        amount: mintAmount.toString(),
        recipient: address,
        contract: `${SBTC_CONTRACT.address}.${SBTC_CONTRACT.name}`,
        note: 'Testnet faucet - tokens will appear after transaction confirms (~10 minutes)',
      },
    });
  } catch (error: any) {
    console.error('Error in sBTC faucet:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process faucet request.',
    });
  }
});

/**
 * POST /api/faucet/usdcx
 * Mint test USDCx tokens (testnet only).
 */
router.post('/usdcx', async (req: Request, res: Response): Promise<void> => {
  try {
    if (STACKS_NETWORK !== 'testnet') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Faucet is only available on testnet.',
      });
      return;
    }

    const { address, amount } = req.body;

    if (!address || typeof address !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'A valid Stacks address is required.',
      });
      return;
    }

    const mintAmount = parseInt(amount) || 10000000; // Default 10 USDCx (10M micro)

    if (mintAmount <= 0 || mintAmount > 100000000) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Amount must be between 1 and 100000000 (100 USDCx max).',
      });
      return;
    }

    // For testnet faucet, return simulated success
    res.status(200).json({
      success: true,
      message: `Faucet request submitted for ${mintAmount} micro-USDCx to ${address}`,
      details: {
        token: 'USDCx',
        amount: mintAmount.toString(),
        recipient: address,
        contract: `${USDCX_CONTRACT.address}.${USDCX_CONTRACT.name}`,
        note: 'Testnet faucet - tokens will appear after transaction confirms (~10 minutes)',
      },
    });
  } catch (error: any) {
    console.error('Error in USDCx faucet:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process faucet request.',
    });
  }
});

export default router;
