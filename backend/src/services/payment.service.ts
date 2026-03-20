import { PrismaClient } from '@prisma/client';
import { getTransactionInfo } from './stacks.service';

const prisma = new PrismaClient();

export interface PaymentVerification {
  valid: boolean;
  reason?: string;
  payer?: string;
  amount?: string;
}

/**
 * Verify a payment transaction on the Stacks blockchain.
 * Checks that the tx exists, is confirmed, sent to the correct recipient, and has the correct amount.
 */
export async function verifyPayment(
  txId: string,
  expectedRecipient: string,
  expectedAmount: number
): Promise<PaymentVerification> {
  try {
    const tx = await getTransactionInfo(txId);

    if (!tx) {
      return { valid: false, reason: 'Transaction not found' };
    }

    // Check transaction status
    if (tx.tx_status !== 'success') {
      return {
        valid: false,
        reason: `Transaction status is "${tx.tx_status}", expected "success"`,
      };
    }

    // Check transaction type - should be a contract call (token transfer) or STX transfer
    const sender = tx.sender_address;

    if (tx.tx_type === 'contract_call') {
      // For token transfers (USDCx), check the contract call details
      const functionName = tx.contract_call?.function_name;
      const contractId = tx.contract_call?.contract_id;

      // Verify it's a transfer function
      if (functionName !== 'transfer') {
        return { valid: false, reason: 'Transaction is not a transfer' };
      }

      // Check function args for recipient and amount
      const args = tx.contract_call?.function_args || [];
      let txAmount: string | null = null;
      let txRecipient: string | null = null;

      for (const arg of args) {
        if (arg.name === 'amount') {
          txAmount = arg.repr?.replace(/^u/, '') || null;
        }
        if (arg.name === 'recipient' || arg.name === 'to') {
          txRecipient = arg.repr?.replace(/^'/, '') || null;
        }
      }

      if (!txRecipient || txRecipient !== expectedRecipient) {
        return {
          valid: false,
          reason: `Recipient mismatch: expected ${expectedRecipient}, got ${txRecipient}`,
        };
      }

      if (!txAmount || parseInt(txAmount) < expectedAmount) {
        return {
          valid: false,
          reason: `Amount insufficient: expected ${expectedAmount}, got ${txAmount}`,
        };
      }

      return {
        valid: true,
        payer: sender,
        amount: txAmount,
      };
    } else if (tx.tx_type === 'token_transfer') {
      // For STX transfers
      const txRecipient = tx.token_transfer?.recipient_address;
      const txAmount = tx.token_transfer?.amount;

      if (txRecipient !== expectedRecipient) {
        return {
          valid: false,
          reason: `Recipient mismatch: expected ${expectedRecipient}, got ${txRecipient}`,
        };
      }

      if (!txAmount || parseInt(txAmount) < expectedAmount) {
        return {
          valid: false,
          reason: `Amount insufficient: expected ${expectedAmount}, got ${txAmount}`,
        };
      }

      return {
        valid: true,
        payer: sender,
        amount: txAmount,
      };
    }

    return { valid: false, reason: `Unsupported transaction type: ${tx.tx_type}` };
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return { valid: false, reason: `Verification error: ${error.message}` };
  }
}

/**
 * Check if a payment transaction has already been used (replay protection).
 */
export async function isPaymentUsed(txId: string): Promise<boolean> {
  const record = await prisma.paymentRecord.findUnique({
    where: { txId },
  });
  return record !== null;
}

/**
 * Record a used payment to prevent replay.
 */
export async function recordPayment(
  txId: string,
  payer: string,
  amount: string,
  endpoint: string,
  targetAddr: string
): Promise<void> {
  await prisma.paymentRecord.create({
    data: {
      txId,
      payer,
      amount,
      endpoint,
      targetAddr,
    },
  });
}
