import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import {
  Product,
  Transaction,
  TransactionItem,
  Delivery,
  AuditLog,
  Customer,
} from '@infrastructure/adapters/database/typeorm/entities';
import {
  TypeOrmProductRepository,
  TypeOrmTransactionRepository,
  TypeOrmTransactionItemRepository,
  TypeOrmDeliveryRepository,
  TypeOrmAuditLogRepository,
} from '@infrastructure/adapters/database/typeorm/repositories';
import {
  ProcessCheckoutUseCase,
  CheckTransactionStatusUseCase,
  GetMyTransactionsUseCase,
  FulfillmentService,
  TransactionStatusTokenService,
} from '@application/use-cases/checkout';
import {
  PRODUCT_REPOSITORY,
  TRANSACTION_REPOSITORY,
  TRANSACTION_ITEM_REPOSITORY,
  DELIVERY_REPOSITORY,
  PAYMENT_GATEWAY,
  AUDIT_LOG_REPOSITORY,
} from '@application/tokens';
import { CheckoutController } from '@infrastructure/adapters/http/controllers';
import { WebhookController } from '@infrastructure/adapters/http/controllers/webhook.controller';
import { I18nService } from '@infrastructure/config/i18n';
import { AuditInterceptor } from '@infrastructure/adapters/web/interceptors/audit.interceptor';
import { WompiStrategy } from '@infrastructure/adapters/payment/wompi/wompi.strategy';
import { WompiWebhookValidatorService } from '@infrastructure/adapters/payment/wompi/wompi-webhook-validator.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

/**
 * Checkout Module
 * Handles checkout and payment processing
 *
 * Responsibilities:
 * - Process checkout requests
 * - Validate products and stock
 * - Create transactions
 * - Process payments with Wompi
 * - Create deliveries
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Transaction,
      TransactionItem,
      Delivery,
      AuditLog,
      Customer,
    ]),
    HttpModule,
    ConfigModule,
    JwtModule.register({}), // Use default config from auth module
  ],
  controllers: [CheckoutController, WebhookController],
  providers: [
    // Internationalization
    I18nService,
    // Repository Implementations
    {
      provide: PRODUCT_REPOSITORY,
      useClass: TypeOrmProductRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TypeOrmTransactionRepository,
    },
    {
      provide: TRANSACTION_ITEM_REPOSITORY,
      useClass: TypeOrmTransactionItemRepository,
    },
    {
      provide: DELIVERY_REPOSITORY,
      useClass: TypeOrmDeliveryRepository,
    },
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: TypeOrmAuditLogRepository,
    },
    // Payment Gateway
    {
      provide: PAYMENT_GATEWAY,
      useClass: WompiStrategy,
    },
    // Webhook Validator
    WompiWebhookValidatorService,
    // Use Cases & Services
    ProcessCheckoutUseCase,
    CheckTransactionStatusUseCase,
    GetMyTransactionsUseCase,
    FulfillmentService,
    TransactionStatusTokenService,
    // Interceptors
    AuditInterceptor,
  ],
  exports: [
    ProcessCheckoutUseCase,
    CheckTransactionStatusUseCase,
    GetMyTransactionsUseCase,
  ],
})
export class CheckoutModule {}
