import { Injectable, Logger, Inject } from '@nestjs/common';
import type {
  IProductRepository,
  ITransactionRepository,
  ITransactionItemRepository,
  IDeliveryRepository,
  IPaymentGateway,
} from '@application/ports/out';
import {
  TransactionData,
  PaymentMethodData,
  PaymentResult,
  PaymentError,
} from '@application/ports/out';
import { Result, ok, err } from '@application/utils';
import {
  CheckoutRequestDto,
  CheckoutResponseDto,
} from '@application/dtos/checkout';
import { TransactionStatus } from '@domain/enums';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@infrastructure/adapters/database/typeorm/entities';
import { Product } from '@infrastructure/adapters/database/typeorm/entities';

/**
 * Checkout Error Types
 */
export class CheckoutError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'CheckoutError';
  }
}

export class InsufficientStockError extends CheckoutError {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`,
      'INSUFFICIENT_STOCK',
    );
  }
}

export class ProductNotFoundError extends CheckoutError {
  constructor(productId: string) {
    super(`Product ${productId} not found`, 'PRODUCT_NOT_FOUND');
  }
}

/**
 * Process Checkout Use Case
 * Railway Oriented Programming (ROP) implementation
 *
 * IMPORTANT: Wompi payments are ASYNCHRONOUS!
 * Flow:
 * 1. Validate products and stock
 * 2. Calculate total amount
 * 3. Create transaction in PENDING state
 * 4. Process payment with Wompi Strategy (returns PENDING + wompiTransactionId)
 * 5. Update transaction with wompiTransactionId
 * 6. Return transaction info (status: PENDING)
 * 7. Client polls GET /checkout/status/:transactionId until status is final (APPROVED/DECLINED/ERROR)
 * 8. When APPROVED: stock reduction and delivery creation happens in background or via polling endpoint
 */
@Injectable()
export class ProcessCheckoutUseCase {
  private readonly logger = new Logger(ProcessCheckoutUseCase.name);

  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
    @Inject('ITransactionItemRepository')
    private readonly transactionItemRepository: ITransactionItemRepository,
    @Inject('IDeliveryRepository')
    private readonly deliveryRepository: IDeliveryRepository,
    @Inject('IPaymentGateway')
    private readonly paymentGateway: IPaymentGateway,
  ) {}

  async execute(
    request: CheckoutRequestDto,
    customerId: string,
    customerEmail: string,
    ipAddress: string,
  ): Promise<Result<CheckoutResponseDto, CheckoutError>> {
    this.logger.log(`Processing checkout for customer ${customerId}`);

    // Step 1: Validate products and stock (ROP)
    const validationResult = await this.validateProductsAndStock(request);
    if (validationResult.isErr()) {
      return err(validationResult.error);
    }
    const { products, totalAmount } = validationResult.value;

    // Step 2: Create transaction in PENDING state
    const transactionResult = await this.createPendingTransaction(
      customerId,
      customerEmail,
      totalAmount,
      request,
      ipAddress,
    );
    if (transactionResult.isErr()) {
      return err(transactionResult.error);
    }
    const transaction = transactionResult.value;

    // Step 2.5: Save transaction items (product snapshots)
    const itemsSaveResult = await this.saveTransactionItems(
      transaction.id,
      products,
    );
    if (itemsSaveResult.isErr()) {
      // Rollback transaction if items can't be saved
      await this.transactionRepository.updateStatus(
        transaction.id,
        TransactionStatus.ERROR,
        undefined,
        undefined,
        'ITEMS_SAVE_ERROR',
        'Failed to save transaction items',
      );
      return err(itemsSaveResult.error);
    }

    // Step 3: Process payment with Wompi Strategy (ROP)
    // Wompi is ASYNC: Always returns PENDING + wompiTransactionId
    const paymentResult = await this.processPayment(
      transaction,
      request,
      customerEmail,
      ipAddress,
    );
    if (paymentResult.isErr()) {
      // Payment gateway error (not transaction declined)
      await this.updateTransactionWithError(
        transaction.id,
        paymentResult.error.code,
        paymentResult.error.message,
      );
      return err(
        new CheckoutError(
          paymentResult.error.message,
          paymentResult.error.code,
        ),
      );
    }

    const paymentData = paymentResult.value;

    // Step 4: Update transaction with Wompi transaction ID and status
    await this.transactionRepository.updateStatus(
      transaction.id,
      this.mapStatusToEnum(paymentData.status),
      paymentData.transactionId,
      paymentData.reference,
      paymentData.errorCode,
      paymentData.errorMessage,
    );

    // Step 5: Return checkout response with PENDING status
    // Client will poll GET /checkout/status/:transactionId to check final status
    // Stock reduction and delivery creation happen when status becomes APPROVED
    const response: CheckoutResponseDto = {
      transactionId: transaction.id,
      transactionNumber: transaction.transactionNumber,
      status: paymentData.status, // Will be PENDING for Wompi
      amount: totalAmount,
      currency: 'COP',
      reference: transaction.reference,
      paymentMethod: paymentData.paymentMethod,
      wompiTransactionId: paymentData.transactionId, // For client polling
      errorCode: paymentData.errorCode,
      errorMessage: paymentData.errorMessage,
    };

    this.logger.log(
      `Checkout initiated successfully. Transaction: ${transaction.id}, Wompi ID: ${paymentData.transactionId}, Status: ${paymentData.status}`,
    );

    return ok(response);
  }

  /**
   * Step 1: Validate products and calculate total
   */
  private async validateProductsAndStock(request: CheckoutRequestDto): Promise<
    Result<
      {
        products: Array<{ product: Product; quantity: number }>;
        totalAmount: number;
      },
      CheckoutError
    >
  > {
    const products: Array<{ product: Product; quantity: number }> = [];
    let totalAmount = 0;

    for (const item of request.items) {
      // Find product
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        return err(new ProductNotFoundError(item.productId));
      }

      // Check stock
      const hasStock = await this.productRepository.hasStock(
        item.productId,
        item.quantity,
      );
      if (!hasStock) {
        return err(
          new InsufficientStockError(
            item.productId,
            item.quantity,
            product.stock,
          ),
        );
      }

      products.push({ product, quantity: item.quantity });
      totalAmount += product.price * item.quantity;
    }

    return ok({ products, totalAmount });
  }

  /**
   * Step 2: Create transaction in PENDING state
   */
  private async createPendingTransaction(
    customerId: string,
    customerEmail: string,
    totalAmount: number,
    request: CheckoutRequestDto,
    ipAddress: string,
  ): Promise<Result<Transaction, CheckoutError>> {
    try {
      const transactionNumber = `TXN-${Date.now()}-${uuidv4().slice(0, 8)}`;
      const reference = `REF-${Date.now()}-${uuidv4().slice(0, 8)}`;

      const transaction = await this.transactionRepository.create({
        transactionNumber,
        amount: totalAmount,
        reference,
        status: TransactionStatus.PENDING,
        customerId,
        paymentMethod: request.paymentMethod.type,
        ipAddress,
      });

      return ok(transaction);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create transaction: ${errorMessage}`);
      return err(
        new CheckoutError(
          'Failed to create transaction',
          'TRANSACTION_CREATION_ERROR',
        ),
      );
    }
  }

  /**
   * Step 2.5: Save transaction items (product snapshots)
   */
  private async saveTransactionItems(
    transactionId: string,
    products: Array<{ product: Product; quantity: number }>,
  ): Promise<Result<void, CheckoutError>> {
    try {
      const items = products.map(({ product, quantity }) => ({
        transactionId,
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        subtotal: product.price * quantity,
      }));

      await this.transactionItemRepository.createMany(items);
      this.logger.log(
        `Saved ${items.length} transaction items for transaction ${transactionId}`,
      );
      return ok(undefined);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to save transaction items: ${errorMessage}`);
      return err(
        new CheckoutError(
          'Failed to save transaction items',
          'ITEMS_SAVE_ERROR',
        ),
      );
    }
  }

  /**
   * Step 3: Process payment with Wompi Strategy
   */
  private async processPayment(
    transaction: Transaction,
    request: CheckoutRequestDto,
    customerEmail: string,
    ipAddress: string,
  ): Promise<Result<PaymentResult, PaymentError>> {
    const paymentMethod: PaymentMethodData = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      type: request.paymentMethod.type as any,
      token: request.paymentMethod.token,
      installments: request.paymentMethod.installments,
      phoneNumber: request.paymentMethod.phoneNumber,
      userType: request.paymentMethod.userType,
      financialInstitutionCode: request.paymentMethod.financialInstitutionCode,
    };

    const transactionData: TransactionData = {
      amount: transaction.amount,
      currency: 'COP',
      reference: transaction.reference,
      customerEmail,
      paymentMethod,
      ipAddress,
    };

    return await this.paymentGateway.processPayment(transactionData);
  }

  /**
   * Step 4a: Update transaction with error
   */
  private async updateTransactionWithError(
    transactionId: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<void> {
    await this.transactionRepository.updateStatus(
      transactionId,
      TransactionStatus.ERROR,
      undefined,
      undefined,
      errorCode,
      errorMessage,
    );
  }

  /**
   * Step 5: Process approved checkout (reduce stock + create delivery)
   */
  private async processApprovedCheckout(
    transaction: Transaction,
    request: CheckoutRequestDto,
    customerId: string,
  ): Promise<Result<string, CheckoutError>> {
    try {
      // Reduce stock for each product
      for (const item of request.items) {
        await this.productRepository.updateStock(item.productId, item.quantity);
      }

      // Create delivery
      const delivery = await this.deliveryRepository.create({
        transactionId: transaction.id,
        customerId,
        address: request.shippingAddress.addressLine1,
        city: request.shippingAddress.city,
        postalCode: request.shippingAddress.postalCode || '',
        recipientName: request.shippingAddress.recipientName,
        recipientPhone: request.shippingAddress.recipientPhone,
        status: 'PENDING',
      });

      return ok(delivery.id);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process approved checkout: ${errorMessage}`);
      return err(
        new CheckoutError(
          'Failed to process approved checkout',
          'APPROVED_PROCESSING_ERROR',
        ),
      );
    }
  }

  /**
   * Helper: Map payment status to TransactionStatus enum
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
