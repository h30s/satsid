import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyPayment, isPaymentUsed, recordPayment } from '../services/payment.service';

const prisma = new PrismaClient();

const X402_BYPASS_MODE = process.env.X402_BYPASS_MODE === 'true';
const X402_BYPASS_TOKEN = process.env.X402_BYPASS_TOKEN || 'test-payment-token-dev';
const X402_RECIPIENT_ADDRESS = process.env.X402_RECIPIENT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

export interface X402PaymentInfo {
  version: string;
  network: string;
  recipient: string;
  amount: number;
  currency: string;
  description: string;
  endpoint: string;
}

/**
 * Factory function that creates x402 payment gating middleware.
 * @param feeAmount - The fee amount in micro-USDCx
 * @param description - Description of what the payment is for
 */
export function requirePayment(feeAmount: number, description: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const paymentToken = req.headers['x-payment-token'] as string | undefined;
    const endpoint = req.originalUrl;

    // No payment token provided - return 402 with payment instructions
    if (!paymentToken) {
      const paymentInfo: X402PaymentInfo = {
        version: '1.0',
        network: process.env.STACKS_NETWORK || 'testnet',
        recipient: X402_RECIPIENT_ADDRESS,
        amount: feeAmount,
        currency: 'USDCx',
        description,
        endpoint,
      };

      res.status(402).json({
        error: 'Payment Required',
        message: `This endpoint requires a payment of ${feeAmount} micro-USDCx.`,
        payment: paymentInfo,
        instructions: {
          header: 'X-Payment-Token',
          format: 'Provide a valid Stacks transaction ID as the X-Payment-Token header.',
        },
      });
      return;
    }

    // Bypass mode for development/testing
    if (X402_BYPASS_MODE && paymentToken === X402_BYPASS_TOKEN) {
      next();
      return;
    }

    try {
      // Check if payment has already been used (replay protection)
      const alreadyUsed = await isPaymentUsed(paymentToken);
      if (alreadyUsed) {
        res.status(402).json({
          error: 'Payment Already Used',
          message: 'This payment transaction has already been used. Please submit a new payment.',
        });
        return;
      }

      // Verify the payment transaction on-chain
      const verification = await verifyPayment(
        paymentToken,
        X402_RECIPIENT_ADDRESS,
        feeAmount
      );

      if (!verification.valid) {
        res.status(402).json({
          error: 'Invalid Payment',
          message: verification.reason || 'The payment transaction could not be verified.',
          payment: {
            version: '1.0',
            network: process.env.STACKS_NETWORK || 'testnet',
            recipient: X402_RECIPIENT_ADDRESS,
            amount: feeAmount,
            currency: 'USDCx',
            description,
            endpoint,
          },
        });
        return;
      }

      // Record the payment to prevent replay
      const targetAddr = req.params.address || 'unknown';
      await recordPayment(
        paymentToken,
        verification.payer || 'unknown',
        feeAmount.toString(),
        endpoint,
        targetAddr
      );

      next();
    } catch (error: any) {
      console.error('x402 payment verification error:', error);
      res.status(500).json({
        error: 'Payment Verification Error',
        message: 'An error occurred while verifying the payment.',
      });
    }
  };
}
