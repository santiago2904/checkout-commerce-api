import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result, ok, err } from '@application/utils';
import type {
  ITransactionRepository,
  ITransactionItemRepository,
  IDeliveryRepository,
} from '@application/ports/out';
import {
  Transaction,
  TransactionItem,
} from '@infrastructure/adapters/database/typeorm/entities';

/**
 * Get My Transactions Error
 */
export class GetMyTransactionsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'GetMyTransactionsError';
  }
}

/**
 * Transaction Response DTO
 */
export interface MyTransactionResponse {
  transactionId: string;
  reference: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  wompiTransactionId?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    imageUrl?: string;
  }>;
  delivery?: {
    deliveryId: string;
    status: string;
    trackingNumber?: string;
    recipientName: string;
    address: string;
    city: string;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
  };
}

/**
 * Get My Transactions Use Case
 * Railway Oriented Programming (ROP) implementation
 *
 * Retrieves all transactions for the authenticated customer.
 * This endpoint enables app resilience by allowing users to recover
 * their transaction progress after a page refresh.
 *
 * Returns transactions ordered by creation date (newest first).
 * Includes transaction items and delivery information when available.
 */
@Injectable()
export class GetMyTransactionsUseCase {
  private readonly logger = new Logger(GetMyTransactionsUseCase.name);

  constructor(
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
    @Inject('ITransactionItemRepository')
    private readonly transactionItemRepository: ITransactionItemRepository,
    @Inject('IDeliveryRepository')
    private readonly deliveryRepository: IDeliveryRepository,
  ) {}

  /**
   * Execute: Get all transactions for a customer
   *
   * @param customerId - Customer UUID
   * @returns Result with array of transactions or error
   */
  async execute(
    customerId: string,
  ): Promise<Result<MyTransactionResponse[], GetMyTransactionsError>> {
    this.logger.log(`Fetching transactions for customer ${customerId}`);

    try {
      // Step 1: Get transactions by customerId first
      const transactionsByCustomerId =
        await this.transactionRepository.findByCustomerId(customerId);

      // Step 2: Get customer email from first transaction (if any) to find guest transactions
      let transactionsByEmail: Transaction[] = [];
      if (transactionsByCustomerId.length > 0) {
        const customerEmail = transactionsByCustomerId[0].customer?.user?.email;
        if (customerEmail) {
          transactionsByEmail =
            await this.transactionRepository.findByCustomerEmail(customerEmail);
        }
      }

      // Step 3: Combine and deduplicate transactions
      const transactionMap = new Map<string, Transaction>();
      [...transactionsByCustomerId, ...transactionsByEmail].forEach((t) => {
        transactionMap.set(t.id, t);
      });
      const transactions = Array.from(transactionMap.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      this.logger.log(
        `Found ${transactions.length} transactions for customer ${customerId}`,
      );

      // Step 2: Build response with items and delivery info
      const response: MyTransactionResponse[] = await Promise.all(
        transactions.map(async (transaction) => {
          // Get transaction items
          const items =
            await this.transactionItemRepository.findByTransactionId(
              transaction.id,
            );

          // Get delivery if exists
          let delivery: MyTransactionResponse['delivery'] | undefined =
            undefined;
          try {
            const deliveryRecord =
              await this.deliveryRepository.findByTransactionId(transaction.id);
            if (deliveryRecord) {
              delivery = {
                deliveryId: deliveryRecord.id,
                status: deliveryRecord.status,
                trackingNumber: deliveryRecord.trackingNumber,
                recipientName: deliveryRecord.recipientName,
                address: deliveryRecord.address,
                city: deliveryRecord.city,
                estimatedDelivery: deliveryRecord.estimatedDelivery,
                actualDelivery: deliveryRecord.actualDelivery,
              };
            }
          } catch {
            // Delivery might not exist for failed/pending transactions
            this.logger.debug(
              `No delivery found for transaction ${transaction.id}`,
            );
          }

          const baseResponse: MyTransactionResponse = {
            transactionId: transaction.id,
            reference: transaction.reference,
            status: transaction.status,
            amount: Number(transaction.amount),
            currency: 'COP',
            paymentMethod: transaction.paymentMethod,
            wompiTransactionId: transaction.wompiTransactionId ?? undefined,
            errorCode: transaction.errorCode ?? undefined,
            errorMessage: transaction.errorMessage ?? undefined,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
            items: items.map((item: TransactionItem) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              subtotal: Number(item.subtotal),
              imageUrl: item.product?.imageUrl ?? undefined,
            })),
          };

          if (delivery) {
            baseResponse.delivery = delivery;
          }

          return baseResponse;
        }),
      );

      return ok(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to fetch transactions for customer ${customerId}: ${errorMessage}`,
        errorStack,
      );

      return err(
        new GetMyTransactionsError(
          'Failed to retrieve transactions',
          'GET_TRANSACTIONS_FAILED',
        ),
      );
    }
  }
}
