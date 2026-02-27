/**
 * Base Product Error
 */
export class ProductError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ProductError';
  }
}

/**
 * Product not found error
 */
export class ProductNotFoundError extends ProductError {
  constructor(productId?: string) {
    super(
      productId
        ? `Product with id ${productId} not found`
        : 'Product not found',
      'PRODUCT_NOT_FOUND',
    );
    this.name = 'ProductNotFoundError';
  }
}

/**
 * Insufficient stock error
 */
export class InsufficientStockError extends ProductError {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`,
      'INSUFFICIENT_STOCK',
    );
    this.name = 'InsufficientStockError';
  }
}

/**
 * Products fetch error
 */
export class ProductsFetchError extends ProductError {
  constructor() {
    super('Failed to fetch products', 'PRODUCTS_FETCH_ERROR');
    this.name = 'ProductsFetchError';
  }
}
