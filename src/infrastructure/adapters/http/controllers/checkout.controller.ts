import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ProcessCheckoutUseCase,
  CheckTransactionStatusUseCase,
  GetMyTransactionsUseCase,
  GetMyTransactionsError,
} from '@application/use-cases/checkout';
import {
  CheckoutRequestDto,
  CheckoutResponseDto,
  TransactionStatusQueryDto,
} from '@application/dtos/checkout';
import type { MyTransactionResponse } from '@application/use-cases/checkout/get-my-transactions.use-case';
import type { Result } from '@application/utils';
import {
  CheckoutError,
  InsufficientStockError,
  ProductNotFoundError,
} from '@application/use-cases/checkout/process-checkout.use-case';
import { I18nService } from '@infrastructure/config/i18n';
import type { SupportedLanguage } from '@infrastructure/config/i18n';
import { Lang } from '@infrastructure/adapters/web/decorators/lang.decorator';
import { Audit } from '@infrastructure/adapters/web/decorators/audit.decorator';
import { AuditInterceptor } from '@infrastructure/adapters/web/interceptors/audit.interceptor';
import { AUDIT_ACTIONS } from '@infrastructure/adapters/web/constants';
import { JwtAuthGuard } from '@infrastructure/adapters/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@infrastructure/adapters/auth/guards/roles.guard';
import { Roles } from '@infrastructure/adapters/auth/decorators/roles.decorator';
import { RoleName } from '@domain/enums';
import { extractRealIp } from '@infrastructure/adapters/web/utils';
import { Public } from '@infrastructure/adapters/web/decorators/public.decorator';
import type { TransactionStatusResponse } from '@application/use-cases/checkout/check-transaction-status.use-case';

/**
 * Interface for authenticated request with user data
 * Matches the structure returned by JWT strategy's validate() method
 */
interface RequestWithUser extends Express.Request {
  user: {
    userId: string;
    email: string;
    roleId: string;
    roleName: string;
    customer?: {
      id: string;
    };
  };
  ip?: string;
}

/**
 * Checkout Controller
 * Handles checkout and payment processing
 */
@Controller('checkout')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class CheckoutController {
  private readonly logger = new Logger(CheckoutController.name);

  constructor(
    private readonly processCheckoutUseCase: ProcessCheckoutUseCase,
    private readonly checkTransactionStatusUseCase: CheckTransactionStatusUseCase,
    private readonly getMyTransactionsUseCase: GetMyTransactionsUseCase,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Process checkout and create payment transaction
   * POST /checkout
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.CUSTOMER)
  @Audit(AUDIT_ACTIONS.CHECKOUT_START)
  async checkout(
    @Body() checkoutDto: CheckoutRequestDto,
    @Request() req: RequestWithUser,
    @Lang() lang: SupportedLanguage,
  ): Promise<{
    statusCode: number;
    message: string;
    data: CheckoutResponseDto;
  }> {
    // Extract customer information from JWT token
    const customerId = req.user?.customer?.id;
    const customerEmail = req.user?.email;

    if (!customerId) {
      this.logger.error('Customer ID not found in request', { user: req.user });
      throw new BadRequestException(
        this.i18n.t('checkout.errors.customerNotFound', lang),
      );
    }

    this.logger.log(
      `Processing checkout for customer ${customerId} with ${checkoutDto.items.length} items`,
    );

    // Execute checkout use case
    const result = await this.processCheckoutUseCase.execute(
      {
        ...checkoutDto,
      },
      customerId,
      customerEmail,
      extractRealIp(req),
    );

    return result.fold(
      // Success case
      (data) => {
        this.logger.log(
          `Checkout successful for customer ${customerId}: ${data.transactionId}`,
        );
        return {
          statusCode: HttpStatus.CREATED,
          message: this.i18n.t('checkout.success', lang),
          data,
        };
      },
      // Error case
      (error) => {
        this.logger.error(
          `Checkout failed for customer ${customerId}`,
          error.stack,
        );

        if (error instanceof InsufficientStockError) {
          throw new BadRequestException(
            this.i18n.t('checkout.errors.insufficientStock', lang),
          );
        }

        if (error instanceof ProductNotFoundError) {
          throw new BadRequestException(
            this.i18n.t('checkout.errors.productNotFound', lang),
          );
        }

        // Fallback for unknown checkout errors
        if (error instanceof CheckoutError) {
          // Include error code if available for better debugging
          const errorDetails = error.code
            ? `[${error.code}] ${error.message}`
            : error.message;

          throw new BadRequestException(
            `${this.i18n.t('checkout.errors.failed', lang)}: ${errorDetails}`,
          );
        }

        // Fallback for any other errors
        throw new BadRequestException(
          this.i18n.t('checkout.errors.failed', lang),
        );
      },
    );
  }

  /**
   * Guest Checkout (no authentication required)
   * POST /checkout/guest
   *
   * Allows users to make purchases without creating an account.
   * Transactions are tracked by email and can be retrieved later if the user registers.
   */
  @Public()
  @Post('guest')
  @HttpCode(HttpStatus.CREATED)
  async guestCheckout(
    @Body() checkoutDto: CheckoutRequestDto,
    @Request() req: Express.Request,
    @Lang() lang: SupportedLanguage,
  ): Promise<{
    statusCode: number;
    message: string;
    data: CheckoutResponseDto;
  }> {
    const customerEmail = checkoutDto.customerEmail;

    this.logger.log(
      `Processing guest checkout for ${customerEmail} with ${checkoutDto.items.length} items`,
    );

    // Execute checkout use case with null customerId (guest checkout)
    const result = await this.processCheckoutUseCase.execute(
      checkoutDto,
      null, // No customerId for guest checkout
      customerEmail,
      extractRealIp(req),
    );

    return result.fold(
      // Success case
      (data) => {
        this.logger.log(
          `Guest checkout successful for ${customerEmail}: ${data.transactionId}`,
        );
        return {
          statusCode: HttpStatus.CREATED,
          message: this.i18n.t('checkout.success', lang),
          data,
        };
      },
      // Error case
      (error) => {
        this.logger.error(
          `Guest checkout failed for ${customerEmail}`,
          error.stack,
        );

        if (error instanceof InsufficientStockError) {
          throw new BadRequestException(
            this.i18n.t('checkout.errors.insufficientStock', lang),
          );
        }

        if (error instanceof ProductNotFoundError) {
          throw new BadRequestException(
            this.i18n.t('checkout.errors.productNotFound', lang),
          );
        }

        // Fallback for unknown checkout errors
        if (error instanceof CheckoutError) {
          // Include error code if available for better debugging
          const errorDetails = error.code
            ? `[${error.code}] ${error.message}`
            : error.message;

          throw new BadRequestException(
            `${this.i18n.t('checkout.errors.failed', lang)}: ${errorDetails}`,
          );
        }

        // Fallback for any other errors
        throw new BadRequestException(
          this.i18n.t('checkout.errors.failed', lang),
        );
      },
    );
  }

  /**
   * Get transaction status (for polling)
   * GET /checkout/status/:transactionId?email=customer@example.com
   *
   * Used by clients to poll transaction status until final state is reached.
   * Wompi payments are async, so clients need to poll this endpoint every 5 seconds.
   *
   * Public endpoint - accessible by both authenticated and guest users.
   * Security: Requires valid JWT status token (received from checkout response).
   * Token contains transactionId + email and expires in 24h.
   */
  @Public()
  @Get('status')
  @HttpCode(HttpStatus.OK)
  async getTransactionStatus(
    @Query() query: TransactionStatusQueryDto,
    @Lang() lang: SupportedLanguage,
  ): Promise<{
    statusCode: number;
    message: string;
    data: TransactionStatusResponse;
  }> {
    // Token is validated by DTO
    const token = query.token;

    this.logger.log(`Checking status with token`);

    const result = await this.checkTransactionStatusUseCase.execute(token);

    return result.fold(
      // Success case
      (data) => {
        return {
          statusCode: HttpStatus.OK,
          message: this.i18n.t('checkout.statusChecked', lang),
          data,
        };
      },
      // Error case
      (error) => {
        if (error.code === 'TRANSACTION_NOT_FOUND') {
          throw new NotFoundException(
            this.i18n.t('checkout.errors.transactionNotFound', lang),
          );
        }

        if (error.code === 'TOKEN_INVALID' || error.code === 'TOKEN_MISMATCH') {
          throw new UnauthorizedException(
            this.i18n.t('checkout.errors.tokenInvalid', lang),
          );
        }

        // Fallback for other errors
        throw new BadRequestException(
          `${this.i18n.t('checkout.errors.failedStatusCheck', lang)}: ${error.message}`,
        );
      },
    );
  }

  /**
   * Get all transactions for authenticated customer
   * GET /checkout/my-transactions
   *
   * Enables app resilience by allowing users to recover transaction progress
   * after page refresh. Returns all transactions ordered by newest first.
   */
  @Get('me/transactions')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.CUSTOMER)
  @Audit(AUDIT_ACTIONS.CHECKOUT_MY_TRANSACTIONS_VIEW)
  async getMyTransactions(
    @Request() req: RequestWithUser,
    @Lang() lang: SupportedLanguage,
  ): Promise<{
    statusCode: number;
    message: string;
    data: MyTransactionResponse[];
  }> {
    const customerId = req.user?.customer?.id;

    if (!customerId) {
      this.logger.error('Customer ID not found in request', { user: req.user });
      throw new BadRequestException(
        this.i18n.t('checkout.errors.customerNotFound', lang),
      );
    }

    this.logger.log(`Fetching transactions for customer ${customerId}`);

    const result: Result<MyTransactionResponse[], GetMyTransactionsError> =
      await this.getMyTransactionsUseCase.execute(customerId);

    return result.fold(
      // Success case
      (data) => {
        this.logger.log(
          `Retrieved ${data.length} transactions for customer ${customerId}`,
        );
        return {
          statusCode: HttpStatus.OK,
          message: this.i18n.t('checkout.transactionsRetrieved', lang),
          data,
        };
      },
      // Error case
      (error) => {
        this.logger.error(
          `Failed to fetch transactions for customer ${customerId}`,
          error.stack,
        );

        throw new BadRequestException(
          `${this.i18n.t('checkout.errors.failedToGetTransactions', lang)}: ${error.message}`,
        );
      },
    );
  }
}
