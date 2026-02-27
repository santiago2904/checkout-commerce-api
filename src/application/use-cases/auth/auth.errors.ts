/**
 * Base class for authentication errors
 */
export abstract class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when user credentials are invalid
 */
export class InvalidCredentialsError extends AuthError {
  constructor(message = 'Invalid email or password') {
    super(message, 'INVALID_CREDENTIALS');
  }
}

/**
 * Thrown when user is not found
 */
export class UserNotFoundError extends AuthError {
  constructor(message = 'User not found') {
    super(message, 'USER_NOT_FOUND');
  }
}

/**
 * Thrown when email is already registered
 */
export class EmailAlreadyExistsError extends AuthError {
  constructor(email: string) {
    super(`Email ${email} is already registered`, 'EMAIL_ALREADY_EXISTS');
  }
}

/**
 * Thrown when role is not found
 */
export class RoleNotFoundError extends AuthError {
  constructor(roleName: string) {
    super(`Role ${roleName} not found`, 'ROLE_NOT_FOUND');
  }
}

/**
 * Thrown when user creation fails
 */
export class UserCreationError extends AuthError {
  constructor(message = 'Failed to create user') {
    super(message, 'USER_CREATION_ERROR');
  }
}

/**
 * Thrown when customer creation fails
 */
export class CustomerCreationError extends AuthError {
  constructor(message = 'Failed to create customer profile') {
    super(message, 'CUSTOMER_CREATION_ERROR');
  }
}
