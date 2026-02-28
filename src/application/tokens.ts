/**
 * Dependency Injection Tokens
 * Used for injecting interfaces in NestJS
 */

// Repository Tokens
export const AUDIT_LOG_REPOSITORY = 'IAuditLogRepository';
export const AUTH_REPOSITORY = 'IAuthRepository';
export const CUSTOMER_REPOSITORY = 'ICustomerRepository';
export const DELIVERY_REPOSITORY = 'IDeliveryRepository';
export const PRODUCT_REPOSITORY = 'IProductRepository';
export const TRANSACTION_REPOSITORY = 'ITransactionRepository';
export const TRANSACTION_ITEM_REPOSITORY = 'ITransactionItemRepository';

// Service Tokens
export const HASH_SERVICE = 'IHashService';
export const TOKEN_SERVICE = 'ITokenService';
export const PAYMENT_GATEWAY = 'IPaymentGateway';
