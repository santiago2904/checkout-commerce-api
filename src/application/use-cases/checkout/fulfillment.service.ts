import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result, ok, err } from '@application/utils';
import type {
  IProductRepository,
  IDeliveryRepository,
  ITransactionItemRepository,
  IAuditLogRepository,
  ITransactionRepository,
} from '@application/ports/out';
import {
  Transaction,
  TransactionItem,
} from '@infrastructure/adapters/database/typeorm/entities';
import { AUDIT_ACTIONS } from '@infrastructure/adapters/web/constants';
import { TransactionStatus } from '@/domain/enums';

/**
 * Fulfillment Error
 */
export class FulfillmentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'FulfillmentError';
  }
}

/**
 * Fulfillment Result
 */
export interface FulfillmentResult {
  deliveryId?: string;
  stockReduced: boolean;
  deliveryCreated: boolean;
  message: string;
}

/**
 * Payment Status Type
 */
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';

/**
 * Fulfillment Service
 *
 * Responsible for processing transaction fulfillment based on status:
 * - APPROVED: Reduce stock + Create delivery + Send confirmation email
 * - DECLINED: Log reason + Send notification email
 * - ERROR: Log error + Send alert to admins
 *
 * All actions are logged in audit_logs table
 */
@Injectable()
export class FulfillmentService {
  private readonly logger = new Logger(FulfillmentService.name);

  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('ITransactionItemRepository')
    private readonly transactionItemRepository: ITransactionItemRepository,
    @Inject('IDeliveryRepository')
    private readonly deliveryRepository: IDeliveryRepository,
    @Inject('IAuditLogRepository')
    private readonly auditLogRepository: IAuditLogRepository,
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  /**
   * Process fulfillment for APPROVED transaction
   *
   * Steps:
   * 1. Log start in audit_logs
   * 2. Get transaction items
   * 3. Reduce stock for each item
   * 4. Create delivery record
   * 5. Log success in audit_logs
   * 6. TODO: Send confirmation email to customer
   *
   * @param transaction - The approved transaction
   * @param customerId - Customer ID from transaction
   * @param customerEmail - Customer email for notifications
   * @param shippingAddress - Shipping address (if available, otherwise use customer address)
   */
  async processApprovedTransaction(
    transaction: Transaction,
    shippingAddress?: {
      addressLine1: string;
      city: string;
      postalCode?: string;
      recipientName: string;
      recipientPhone: string;
    },
  ): Promise<Result<FulfillmentResult, FulfillmentError>> {
    this.logger.log(
      `Starting fulfillment for APPROVED transaction ${transaction.id}`,
    );

    // Log start in audit_logs
    await this.auditLogRepository.create({
      userId: 'SYSTEM',
      roleName: 'SYSTEM',
      action: AUDIT_ACTIONS.FULFILLMENT_APPROVED_START,
      metadata: {
        transactionId: transaction.id,
        customerId: transaction.customerId,
        amount: transaction.amount,
      },
    });

    try {
      // Step 1: Get transaction items
      const items: TransactionItem[] =
        await this.transactionItemRepository.findByTransactionId(
          transaction.id,
        );

      if (!items || items.length === 0) {
        throw new Error('No transaction items found');
      }

      // Step 2: Reduce stock for each item
      for (const item of items) {
        await this.productRepository.updateStock(item.productId, item.quantity);
        this.logger.log(
          `Reduced stock for product ${item.productId}: ${item.quantity} units`,
        );
      }

      // Log stock reduction
      await this.auditLogRepository.create({
        userId: 'SYSTEM',
        roleName: 'SYSTEM',
        action: AUDIT_ACTIONS.FULFILLMENT_STOCK_REDUCED,
        metadata: {
          transactionId: transaction.id,
          customerId: transaction.customerId,
          itemsCount: items.length,
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
          })),
        },
      });

      // Step 3: Create delivery record
      const address = shippingAddress || {
        addressLine1: transaction.customer.address || 'Not provided',
        city: 'Not provided',
        postalCode: '',
        recipientName: `${transaction.customer.firstName} ${transaction.customer.lastName}`,
        recipientPhone: transaction.customer.phone || '',
      };

      const delivery = await this.deliveryRepository.create({
        transactionId: transaction.id,
        customerId: transaction.customerId,
        address: address.addressLine1,
        city: address.city,
        postalCode: address.postalCode || '',
        recipientName: address.recipientName,
        recipientPhone: address.recipientPhone,
        status: 'PENDING',
      });

      this.logger.log(
        `Created delivery ${delivery.id} for transaction ${transaction.id}`,
      );

      // Log delivery creation
      await this.auditLogRepository.create({
        userId: 'SYSTEM',
        roleName: 'SYSTEM',
        action: AUDIT_ACTIONS.FULFILLMENT_DELIVERY_CREATED,
        metadata: {
          transactionId: transaction.id,
          customerId: transaction.customerId,
          deliveryId: delivery.id,
          address: address.addressLine1,
          city: address.city,
        },
      });

      // Step 4: Log overall success
      await this.auditLogRepository.create({
        userId: 'SYSTEM',
        roleName: 'SYSTEM',
        action: AUDIT_ACTIONS.FULFILLMENT_APPROVED_SUCCESS,
        metadata: {
          transactionId: transaction.id,
          customerId: transaction.customerId,
          deliveryId: delivery.id,
          itemsCount: items.length,
          totalAmount: transaction.amount,
        },
      });

      // TODO: Step 5 - Send confirmation email to customer
      // await this.emailService.sendOrderConfirmation({
      //   to: transaction.customer.email,
      //   transactionNumber: transaction.transactionNumber,
      //   items: items,
      //   totalAmount: transaction.amount,
      //   deliveryAddress: address.addressLine1,
      //   estimatedDelivery: '5-7 business days'
      // });

      this.logger.log(
        `Fulfillment completed successfully for transaction ${transaction.id}`,
      );

      return ok({
        deliveryId: delivery.id,
        stockReduced: true,
        deliveryCreated: true,
        message: 'Fulfillment processed successfully',
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Fulfillment failed for transaction ${transaction.id}: ${errorMessage}`,
      );

      // Log failure in audit_logs
      await this.auditLogRepository.create({
        userId: 'SYSTEM',
        roleName: 'SYSTEM',
        action: AUDIT_ACTIONS.FULFILLMENT_APPROVED_FAILED,
        metadata: {
          transactionId: transaction.id,
          customerId: transaction.customerId,
          error: errorMessage,
        },
      });

      return err(
        new FulfillmentError(
          `Fulfillment failed: ${errorMessage}`,
          'FULFILLMENT_PROCESSING_ERROR',
        ),
      );
    }
  }

  /**
   * Process fulfillment for DECLINED transaction
   *
   * Steps:
   * 1. Log declined reason in audit_logs
   * 2. TODO: Send notification email to customer
   *
   * @param transaction - The declined transaction
   */
  async processDeclinedTransaction(
    transaction: Transaction,
  ): Promise<Result<void, FulfillmentError>> {
    this.logger.log(
      `Processing DECLINED transaction ${transaction.id}. Reason: ${transaction.errorMessage || 'Not specified'}`,
    );

    try {
      // Log declined transaction
      await this.auditLogRepository.create({
        userId: 'SYSTEM',
        roleName: 'SYSTEM',
        action: AUDIT_ACTIONS.FULFILLMENT_DECLINED_PROCESSED,
        metadata: {
          transactionId: transaction.id,
          customerId: transaction.customerId,
          amount: transaction.amount,
          declineReason: transaction.errorMessage || 'Unknown reason',
          errorCode: transaction.errorCode,
        },
      });

      // TODO: Send notification email to customer
      // await this.emailService.sendPaymentDeclinedNotification({
      //   to: transaction.customer.email,
      //   transactionNumber: transaction.transactionNumber,
      //   amount: transaction.amount,
      //   declineReason: transaction.errorMessage || 'Payment was declined by your bank',
      //   supportEmail: 'support@yourcompany.com'
      // });

      this.logger.log(
        `DECLINED transaction ${transaction.id} processed successfully`,
      );

      return ok(undefined);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to process DECLINED transaction ${transaction.id}: ${errorMessage}`,
      );

      return err(
        new FulfillmentError(
          `Failed to process declined transaction: ${errorMessage}`,
          'DECLINED_PROCESSING_ERROR',
        ),
      );
    }
  }

  /**
   * Process fulfillment for ERROR transaction
   *
   * Steps:
   * 1. Log error details in audit_logs
   * 2. Log error for monitoring/alerting
   * 3. TODO: Send alert email to administrators
   *
   * @param transaction - The error transaction
   */
  async processErrorTransaction(
    transaction: Transaction,
  ): Promise<Result<void, FulfillmentError>> {
    this.logger.error(
      `Processing ERROR transaction ${transaction.id}. Error: ${transaction.errorMessage || 'Not specified'}`,
    );

    try {
      // Log error transaction
      await this.auditLogRepository.create({
        userId: 'SYSTEM',
        roleName: 'SYSTEM',
        action: AUDIT_ACTIONS.FULFILLMENT_ERROR_LOGGED,
        metadata: {
          transactionId: transaction.id,
          customerId: transaction.customerId,
          amount: transaction.amount,
          errorMessage: transaction.errorMessage || 'Unknown error',
          errorCode: transaction.errorCode,
          wompiTransactionId: transaction.wompiTransactionId,
        },
      });

      // TODO: Send alert email to administrators
      // await this.emailService.sendAdminAlert({
      //   to: 'admin@yourcompany.com',
      //   subject: `Transaction Error: ${transaction.transactionNumber},
      //   transactionId: transaction.id,
      //   transactionNumber: transaction.transactionNumber,
      //   customerId: transaction.customerId,
      //   customerEmail: transaction.customer.email,
      //   errorMessage: transaction.errorMessage,
      //   errorCode: transaction.errorCode,
      //   timestamp: new Date().toISOString()
      // });

      this.logger.log(
        `ERROR transaction ${transaction.id} logged successfully`,
      );

      return ok(undefined);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to process ERROR transaction ${transaction.id}: ${errorMessage}`,
      );

      return err(
        new FulfillmentError(
          `Failed to process error transaction: ${errorMessage}`,
          'ERROR_PROCESSING_ERROR',
        ),
      );
    }
  }

  /**
   * Process fulfillment by Wompi transaction ID
   *
   * This method is called by the webhook controller when Wompi sends
   * a transaction.updated event. It finds the transaction in our database
   * and triggers the appropriate fulfillment process.
   *
   * @param wompiTransactionId - Wompi's transaction ID
   * @param status - Transaction status from Wompi
   */
  async processFulfillmentByWompiId(
    wompiTransactionId: string,
    status: string,
  ): Promise<void> {
    this.logger.log(
      `Processing fulfillment for Wompi transaction ${wompiTransactionId} with status ${status}`,
    );

    // Find transaction by wompiTransactionId
    const transaction =
      await this.transactionRepository.findByWompiTransactionId(
        wompiTransactionId,
      );

    if (!transaction) {
      this.logger.warn(
        `Transaction not found for Wompi ID: ${wompiTransactionId}`,
      );
      return;
    }

    // Only process if transaction status in DB is PENDING
    // This prevents re-processing already fulfilled transactions
    if (transaction.status !== TransactionStatus.PENDING) {
      this.logger.log(
        `Transaction ${transaction.id} already processed with status ${transaction.status}. Skipping fulfillment.`,
      );
      return;
    }

    // Update transaction status from Wompi
    const statusEnum = this.mapStatusToEnum(status as PaymentStatus);
    transaction.status = statusEnum;
    await this.transactionRepository.update(transaction.id, transaction);

    // Execute appropriate fulfillment based on status
    switch (status) {
      case 'APPROVED':
        await this.processApprovedTransaction(transaction);
        break;
      case 'DECLINED':
        await this.processDeclinedTransaction(transaction);
        break;
      case 'ERROR':
        await this.processErrorTransaction(transaction);
        break;
      default:
        this.logger.log(
          `Ignoring status ${status} for transaction ${transaction.id}`,
        );
    }
  }

  /**
   * Map payment status to TransactionStatus enum
   */
  private mapStatusToEnum(status: PaymentStatus): TransactionStatus {
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
