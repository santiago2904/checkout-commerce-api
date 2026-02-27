/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result, ok, err } from '@application/utils';
import type {
  IPaymentGateway,
  PaymentResult,
  ITransactionRepository,
} from '@application/ports/out';
import { TransactionStatus } from '@domain/enums';
import { Transaction } from '@infrastructure/adapters/database/typeorm/entities';

/**
 * Transaction Status Response
 */
export interface TransactionStatusResponse {
  transactionId: string;
  transactionNumber: string;
  wompiTransactionId: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  amount: number;
  reference: string;
  paymentMethod: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Check Transaction Status Error
 */
export class CheckTransactionStatusError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'CheckTransactionStatusError';
  }
}

/**
 * Check Transaction Status Use Case
 *
 * Used for polling transaction status from Wompi.
 * Client calls GET /checkout/status/:transactionId periodically until status is final.
 *
 * Flow:
 * 1. Find transaction in database
 * 2. Get wompiTransactionId from transaction
 * 3. Query Wompi API for current status
 * 4. Update transaction in database with new status
 * 5. Return updated transaction status
 *
 * NOTE: This use case ONLY updates transaction status.
 * Stock reduction and delivery creation should be handled separately:
 * - Via webhooks (recommended)
 * - Via background jobs
 * - Via a separate fulfillment endpoint
 */
@Injectable()
export class CheckTransactionStatusUseCase {
  private readonly logger = new Logger(CheckTransactionStatusUseCase.name);

  constructor(
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
    @Inject('IPaymentGateway')
    private readonly paymentGateway: IPaymentGateway,
  ) {}

  async execute(
    transactionId: string,
  ): Promise<Result<TransactionStatusResponse, CheckTransactionStatusError>> {
    this.logger.log(`Checking status for transaction ${transactionId}`);

    // Step 1: Find transaction in database
    const transaction =
      await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      return err(
        new CheckTransactionStatusError(
          `Transaction ${transactionId} not found`,
          'TRANSACTION_NOT_FOUND',
        ),
      );
    }

    // Step 2: Verify transaction has a Wompi transaction ID
    if (!transaction.wompiTransactionId) {
      return err(
        new CheckTransactionStatusError(
          'Transaction does not have a Wompi transaction ID',
          'NO_WOMPI_ID',
        ),
      );
    }

    // Step 3: Query Wompi for current status
    const wompiResult = await this.paymentGateway.getTransactionStatus(
      transaction.wompiTransactionId,
    );

    if (wompiResult.isErr()) {
      this.logger.error(
        `Error getting status from Wompi: ${wompiResult.error.message}`,
      );
      return err(
        new CheckTransactionStatusError(
          wompiResult.error.message,
          wompiResult.error.code,
        ),
      );
    }

    const paymentData: PaymentResult = wompiResult.value;

    // Step 4: Update transaction in database if status changed
    const currentStatus = transaction.status;
    const newStatus = this.mapStatusToEnum(paymentData.status);

    if (currentStatus !== newStatus) {
      this.logger.log(
        `Transaction ${transactionId} status changed from ${currentStatus} to ${newStatus}`,
      );

      await this.transactionRepository.updateStatus(
        transaction.id,
        newStatus,
        paymentData.transactionId,
        paymentData.reference,
        paymentData.errorCode,
        paymentData.errorMessage,
      );

      // TODO: When status becomes APPROVED, trigger fulfillment:
      // - Reduce product stock
      // - Create delivery record
      // - Send confirmation email
      // This should be handled by webhooks or background jobs
      if (
        newStatus === TransactionStatus.APPROVED &&
        currentStatus !== TransactionStatus.APPROVED
      ) {
        this.logger.warn(
          `Transaction ${transactionId} approved. Fulfillment not yet implemented. TODO: Reduce stock and create delivery.`,
        );
      }
    }

    // Step 5: Return current transaction status
    const response: TransactionStatusResponse = {
      transactionId: transaction.id,
      transactionNumber: transaction.transactionNumber,
      wompiTransactionId: transaction.wompiTransactionId,
      status: paymentData.status,
      amount: parseFloat(transaction.amount.toString()),
      reference: transaction.reference || '',
      paymentMethod: transaction.paymentMethod,
      errorCode: paymentData.errorCode,
      errorMessage: paymentData.errorMessage,
    };

    return ok(response);
  }

  /**
   * Map payment status to TransactionStatus enum
   */
  private mapStatusToEnum(
    status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR',
  ): TransactionStatus {
    switch (status) {
      case 'PENDING':
        return TransactionStatus.PENDING;
      case 'APPROVED':
        return TransactionStatus.APPROVED;
      case 'DECLINED':
        return TransactionStatus.DECLINED;
      case 'ERROR':
        return TransactionStatus.ERROR;
      default:
        return TransactionStatus.ERROR;
    }
  }
}
