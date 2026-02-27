/**
 * Dependency Injection Tokens
 * Used for injecting interfaces in NestJS
 */

// Repository Tokens
export const AUDIT_LOG_REPOSITORY = 'IAuditLogRepository';
export const AUTH_REPOSITORY = 'IAuthRepository';
export const CUSTOMER_REPOSITORY = 'ICustomerRepository';
export const PRODUCT_REPOSITORY = 'IProductRepository';

// Service Tokens
export const HASH_SERVICE = 'IHashService';
export const TOKEN_SERVICE = 'ITokenService';
