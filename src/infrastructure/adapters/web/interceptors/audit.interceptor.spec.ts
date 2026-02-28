/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { IAuditLogRepository } from '@application/ports/out';
import { AUDIT_KEY } from '@infrastructure/adapters/web/decorators/audit.decorator';
import { AUDIT_ACTIONS } from '@infrastructure/adapters/web/constants/audit-actions.constants';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let reflector: Reflector;
  let auditLogRepository: jest.Mocked<IAuditLogRepository>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;

  const mockUser = {
    userId: 'user-123',
    email: 'test@example.com',
    roleId: 'role-123',
    roleName: 'CUSTOMER',
    customer: {
      id: 'customer-123',
    },
  };

  const mockRequest = {
    user: mockUser,
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'Jest Test Agent',
    },
    method: 'POST',
    url: '/api/auth/login',
    body: {
      email: 'test@example.com',
      password: 'password123',
    },
  };

  beforeEach(() => {
    // Mock Reflector
    reflector = {
      get: jest.fn(),
    } as any;

    // Mock IAuditLogRepository
    auditLogRepository = {
      create: jest.fn().mockResolvedValue({}),
      findByUserId: jest.fn(),
      findByAction: jest.fn(),
      findRecent: jest.fn(),
    };

    // Create interceptor instance
    interceptor = new AuditInterceptor(reflector, auditLogRepository);

    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as any;

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(
        of({
          statusCode: 200,
          message: 'Success',
          data: { user: mockUser },
        }),
      ),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should NOT audit when @Audit decorator is not present', (done) => {
      // Arrange: No @Audit decorator
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: () => {
          expect(reflector.get).toHaveBeenCalledWith(
            AUDIT_KEY,
            mockExecutionContext.getHandler(),
          );
          expect(auditLogRepository.create).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should audit when @Audit decorator is present', (done) => {
      // Arrange
      const action = AUDIT_ACTIONS.USER_LOGIN;
      jest.spyOn(reflector, 'get').mockReturnValue(action);

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: () => {
          // Give async audit time to execute
          setTimeout(() => {
            expect(reflector.get).toHaveBeenCalledWith(
              AUDIT_KEY,
              mockExecutionContext.getHandler(),
            );
            expect(auditLogRepository.create).toHaveBeenCalledWith(
              expect.objectContaining({
                userId: mockUser.userId,
                roleName: mockUser.roleName,
                action,
                metadata: expect.objectContaining({
                  ip: mockRequest.ip,
                  userAgent: mockRequest.headers['user-agent'],
                  method: mockRequest.method,
                  url: mockRequest.url,
                }),
              }),
            );
            done();
          }, 100);
        },
      });
    });

    it('should extract userId from request.user for authenticated endpoints', (done) => {
      // Arrange
      const action = AUDIT_ACTIONS.CHECKOUT_START;
      jest.spyOn(reflector, 'get').mockReturnValue(action);

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: () => {
          setTimeout(() => {
            expect(auditLogRepository.create).toHaveBeenCalledWith(
              expect.objectContaining({
                userId: 'user-123',
                roleName: 'CUSTOMER',
                action,
              }),
            );
            done();
          }, 100);
        },
      });
    });

    it('should extract userId from response for public endpoints (register)', (done) => {
      // Arrange: Public endpoint (no user in request)
      const action = AUDIT_ACTIONS.USER_REGISTER;
      jest.spyOn(reflector, 'get').mockReturnValue(action);

      const mockRequestNoUser = { ...mockRequest, user: undefined };
      const mockContextNoUser = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequestNoUser),
        }),
      };

      const responseWithUser = {
        statusCode: 201,
        message: 'User registered',
        data: {
          user: {
            id: 'new-user-123',
            email: 'newuser@example.com',
            roleName: 'CUSTOMER',
          },
          customer: { id: 'customer-123' },
          accessToken: 'jwt-token',
        },
      };

      mockCallHandler.handle.mockReturnValue(of(responseWithUser));

      // Act
      const result$ = interceptor.intercept(
        mockContextNoUser as any,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: () => {
          setTimeout(() => {
            expect(auditLogRepository.create).toHaveBeenCalledWith(
              expect.objectContaining({
                userId: 'new-user-123',
                roleName: 'CUSTOMER',
                action,
                metadata: expect.objectContaining({
                  email: mockRequestNoUser.body.email,
                }),
              }),
            );
            done();
          }, 100);
        },
      });
    });

    it('should use "anonymous" userId when no user is available', (done) => {
      // Arrange: No user in request or response
      const action = 'SOME_PUBLIC_ACTION';
      jest.spyOn(reflector, 'get').mockReturnValue(action);

      const mockRequestNoUser = { ...mockRequest, user: undefined };
      const mockContextNoUser = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequestNoUser),
        }),
      };

      const responseWithoutUser = {
        statusCode: 200,
        message: 'Success',
        data: {},
      };

      mockCallHandler.handle.mockReturnValue(of(responseWithoutUser));

      // Act
      const result$ = interceptor.intercept(
        mockContextNoUser as any,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: () => {
          setTimeout(() => {
            expect(auditLogRepository.create).toHaveBeenCalledWith(
              expect.objectContaining({
                userId: 'anonymous',
                roleName: 'UNKNOWN',
                action,
              }),
            );
            done();
          }, 100);
        },
      });
    });

    it('should audit even when handler throws error', (done) => {
      // Arrange
      const action = AUDIT_ACTIONS.USER_LOGIN;
      jest.spyOn(reflector, 'get').mockReturnValue(action);

      const error = new Error('Invalid credentials');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        error: () => {
          setTimeout(() => {
            expect(auditLogRepository.create).toHaveBeenCalledWith(
              expect.objectContaining({
                userId: mockUser.userId,
                roleName: mockUser.roleName,
                action,
                metadata: expect.objectContaining({
                  error: {
                    message: error.message,
                    name: error.name,
                  },
                }),
              }),
            );
            done();
          }, 100);
        },
      });
    });

    it('should not throw error if audit fails', (done) => {
      // Arrange
      const action = AUDIT_ACTIONS.USER_LOGIN;
      jest.spyOn(reflector, 'get').mockReturnValue(action);

      // Mock repository to throw error
      auditLogRepository.create.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert: Should still return the response, not throw
      result$.subscribe({
        next: (response) => {
          expect(response).toEqual({
            statusCode: 200,
            message: 'Success',
            data: { user: mockUser },
          });
          done();
        },
      });
    });

    it('should include email in metadata for AUTH actions', (done) => {
      // Arrange
      const action = AUDIT_ACTIONS.USER_REGISTER;
      jest.spyOn(reflector, 'get').mockReturnValue(action);

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: () => {
          setTimeout(() => {
            expect(auditLogRepository.create).toHaveBeenCalledWith(
              expect.objectContaining({
                metadata: expect.objectContaining({
                  email: mockRequest.body.email,
                }),
              }),
            );
            done();
          }, 100);
        },
      });
    });

    it('should include transaction data for CHECKOUT actions', (done) => {
      // Arrange
      const action = AUDIT_ACTIONS.CHECKOUT_COMPLETE;
      jest.spyOn(reflector, 'get').mockReturnValue(action);

      const checkoutResponse = {
        statusCode: 200,
        message: 'Checkout completed',
        data: {
          transactionId: 'txn-123',
          amount: 100.5,
          status: 'PENDING',
        },
      };

      mockCallHandler.handle.mockReturnValue(of(checkoutResponse));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: () => {
          setTimeout(() => {
            expect(auditLogRepository.create).toHaveBeenCalledWith(
              expect.objectContaining({
                metadata: expect.objectContaining({
                  transactionId: 'txn-123',
                  amount: 100.5,
                  status: 'PENDING',
                }),
              }),
            );
            done();
          }, 100);
        },
      });
    });
  });
});
