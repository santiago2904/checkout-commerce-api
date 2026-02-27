/**
 * Audit Actions Constants
 * Centralized definition of all audit actions grouped by category
 */

/**
 * Authentication & Authorization actions
 */
export const AUTH_AUDIT_ACTIONS = {
  USER_REGISTER: 'USER_REGISTER',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_COMPLETE: 'PASSWORD_RESET_COMPLETE',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
} as const;

/**
 * User management actions
 */
export const USER_AUDIT_ACTIONS = {
  USER_UPDATE_PROFILE: 'USER_UPDATE_PROFILE',
  USER_CHANGE_PASSWORD: 'USER_CHANGE_PASSWORD',
  USER_DELETE: 'USER_DELETE',
  USER_VIEW_PROFILE: 'USER_VIEW_PROFILE',
} as const;

/**
 * Product management actions
 */
export const PRODUCT_AUDIT_ACTIONS = {
  PRODUCT_CREATE: 'PRODUCT_CREATE',
  PRODUCT_UPDATE: 'PRODUCT_UPDATE',
  PRODUCT_DELETE: 'PRODUCT_DELETE',
  PRODUCT_VIEW: 'PRODUCT_VIEW',
  PRODUCT_LIST: 'PRODUCT_LIST',
} as const;

/**
 * Checkout & Transaction actions
 */
export const CHECKOUT_AUDIT_ACTIONS = {
  CHECKOUT_START: 'CHECKOUT_START',
  CHECKOUT_STATUS_CHECK: 'CHECKOUT_STATUS_CHECK',
  CHECKOUT_COMPLETE: 'CHECKOUT_COMPLETE',
  CHECKOUT_FAILED: 'CHECKOUT_FAILED',
  PAYMENT_PROCESS: 'PAYMENT_PROCESS',
  PAYMENT_WEBHOOK: 'PAYMENT_WEBHOOK',
} as const;

/**
 * Admin actions
 */
export const ADMIN_AUDIT_ACTIONS = {
  ADMIN_USER_LIST: 'ADMIN_USER_LIST',
  ADMIN_USER_UPDATE: 'ADMIN_USER_UPDATE',
  ADMIN_USER_DELETE: 'ADMIN_USER_DELETE',
  ADMIN_PRODUCT_MANAGE: 'ADMIN_PRODUCT_MANAGE',
  ADMIN_TRANSACTION_VIEW: 'ADMIN_TRANSACTION_VIEW',
  ADMIN_AUDIT_LOG_VIEW: 'ADMIN_AUDIT_LOG_VIEW',
} as const;

/**
 * All audit actions combined
 */
export const AUDIT_ACTIONS = {
  ...AUTH_AUDIT_ACTIONS,
  ...USER_AUDIT_ACTIONS,
  ...PRODUCT_AUDIT_ACTIONS,
  ...CHECKOUT_AUDIT_ACTIONS,
  ...ADMIN_AUDIT_ACTIONS,
} as const;

/**
 * Type for all possible audit actions
 */
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/**
 * Category configuration type
 */
interface CategoryConfig {
  actions: readonly string[];
  includeEmail?: boolean;
  includeUserId?: boolean;
  includeTransactionData?: boolean;
  includeTargetUserId?: boolean;
}

/**
 * Audit action categories configuration
 * Maps categories to their actions and metadata extraction rules
 */
export const AUDIT_CATEGORIES: Record<string, CategoryConfig> = {
  AUTH: {
    actions: Object.values(AUTH_AUDIT_ACTIONS) as AuditAction[],
    includeEmail: true, // Include email in metadata for auth actions
    includeUserId: true,
  },
  USER: {
    actions: Object.values(USER_AUDIT_ACTIONS) as AuditAction[],
    includeEmail: false,
    includeUserId: true,
  },
  PRODUCT: {
    actions: Object.values(PRODUCT_AUDIT_ACTIONS) as AuditAction[],
    includeEmail: false,
    includeUserId: false,
  },
  CHECKOUT: {
    actions: Object.values(CHECKOUT_AUDIT_ACTIONS) as AuditAction[],
    includeEmail: false,
    includeUserId: true,
    includeTransactionData: true, // Include transaction details
  },
  ADMIN: {
    actions: Object.values(ADMIN_AUDIT_ACTIONS) as AuditAction[],
    includeEmail: false,
    includeUserId: true,
    includeTargetUserId: true, // Include target user for admin actions
  },
};

/**
 * Helper function to get category for an action
 */
export function getActionCategory(
  action: string,
): keyof typeof AUDIT_CATEGORIES | null {
  for (const [category, config] of Object.entries(AUDIT_CATEGORIES)) {
    if (config.actions.includes(action)) {
      return category;
    }
  }
  return null;
}

/**
 * Helper function to check if action belongs to a category
 */
export function isActionInCategory(
  action: string,
  categoryKey: keyof typeof AUDIT_CATEGORIES,
): boolean {
  return AUDIT_CATEGORIES[categoryKey].actions.includes(action);
}
