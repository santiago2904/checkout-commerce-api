/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result, ok, err } from '@application/utils';
import type {
  IPaymentGateway,
  PaymentResult,
  ITransactionRepository,
  MerchantInfo,
} from '@application/ports/out';
import { TransactionStatus } from '@domain/enums';
import { Transaction } from '@infrastructure/adapters/database/typeorm/entities';
import { FulfillmentService } from './fulfillment.service';

/**
 * Transaction Status Response
 */
export interface TransactionStatusResponse {
  transactionId: string;
  wompiTransactionId: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  amount: number;
  reference: string; // Unique reference for this transaction (REF-...)
  paymentMethod: string;
  errorCode?: string;
  errorMessage?: string;
  redirectUrl?: string; // URL where user is redirected after payment
  statusMessage?: string; // Human-readable status message from gateway
  merchant?: MerchantInfo; // Merchant information
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
    private readonly fulfillmentService: FulfillmentService,
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
        paymentData.errorCode,
        paymentData.errorMessage,
      );

      // Process fulfillment based on new status
      // Only process fulfillment on state transitions (not on every poll)
      if (currentStatus !== newStatus) {
        // Get updated transaction with relations for fulfillment
        const updatedTransaction = await this.transactionRepository.findById(
          transaction.id,
        );

        if (!updatedTransaction) {
          this.logger.error(
            `Transaction ${transactionId} not found after update`,
          );
        } else {
          // Process APPROVED transactions: reduce stock + create delivery
          if (
            newStatus === TransactionStatus.APPROVED &&
            currentStatus !== TransactionStatus.APPROVED
          ) {
            this.logger.log(
              `Processing fulfillment for APPROVED transaction ${transactionId}`,
            );
            const fulfillmentResult =
              await this.fulfillmentService.processApprovedTransaction(
                updatedTransaction,
              );

            if (fulfillmentResult.isErr()) {
              this.logger.error(
                `Fulfillment failed for transaction ${transactionId}: ${fulfillmentResult.error.message}`,
              );
              // Note: Transaction status remains APPROVED even if fulfillment fails
              // This allows for manual intervention or retry mechanisms
            } else {
              this.logger.log(
                `Fulfillment completed for transaction ${transactionId}. Delivery ID: ${fulfillmentResult.value.deliveryId}`,
              );
            }
          }

          // Process DECLINED transactions: log reason
          if (
            newStatus === TransactionStatus.DECLINED &&
            currentStatus !== TransactionStatus.DECLINED
          ) {
            this.logger.log(`Processing DECLINED transaction ${transactionId}`);
            const declinedResult =
              await this.fulfillmentService.processDeclinedTransaction(
                updatedTransaction,
              );

            if (declinedResult.isErr()) {
              this.logger.error(
                `Failed to process DECLINED transaction ${transactionId}: ${declinedResult.error.message}`,
              );
            }
          }

          // Process ERROR transactions: log error and alert
          if (
            newStatus === TransactionStatus.ERROR &&
            currentStatus !== TransactionStatus.ERROR
          ) {
            this.logger.error(`Processing ERROR transaction ${transactionId}`);
            const errorResult =
              await this.fulfillmentService.processErrorTransaction(
                updatedTransaction,
              );

            if (errorResult.isErr()) {
              this.logger.error(
                `Failed to process ERROR transaction ${transactionId}: ${errorResult.error.message}`,
              );
            }
          }
        }
      }
    }

    // Step 5: Return current transaction status
    const response: TransactionStatusResponse = {
      transactionId: transaction.id,
      wompiTransactionId: transaction.wompiTransactionId,
      status: paymentData.status,
      amount: parseFloat(transaction.amount.toString()),
      reference: transaction.reference || '',
      paymentMethod: transaction.paymentMethod,
      errorCode: paymentData.errorCode,
      errorMessage: paymentData.errorMessage,
      redirectUrl: paymentData.redirectUrl,
      statusMessage: paymentData.statusMessage,
      merchant: paymentData.merchant,
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
