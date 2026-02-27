/**
 * Railway Oriented Programming (ROP) Result Type
 * Represents the result of an operation that can succeed or fail
 */

export class Result<T, E = Error> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  /**
   * Create a successful result
   */
  static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  /**
   * Create a failed result
   */
  static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  /**
   * Check if the result is successful
   */
  get isSuccess(): boolean {
    return this._isSuccess;
  }

  /**
   * Check if the result is a failure
   */
  get isFailure(): boolean {
    return !this._isSuccess;
  }

  /**
   * Get the value if successful, throws if failed
   */
  get value(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from a failed result');
    }
    return this._value as T;
  }

  /**
   * Get the error if failed, throws if successful
   */
  get error(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from a successful result');
    }
    return this._error as E;
  }

  /**
   * Map the value if successful
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isSuccess) {
      return Result.ok(fn(this._value as T));
    }
    return Result.fail(this._error as E);
  }

  /**
   * Chain another result-returning operation
   */
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._isSuccess) {
      return fn(this._value as T);
    }
    return Result.fail(this._error as E);
  }

  /**
   * Map the error if failed
   */
  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this._isSuccess) {
      return Result.ok(this._value as T);
    }
    return Result.fail(fn(this._error as E));
  }

  /**
   * Get value or default if failed
   */
  getOrElse(defaultValue: T): T {
    return this._isSuccess ? (this._value as T) : defaultValue;
  }

  /**
   * Execute a function based on success or failure
   */
  fold<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U {
    return this._isSuccess
      ? onSuccess(this._value as T)
      : onFailure(this._error as E);
  }
}
