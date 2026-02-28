/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmAuditLogRepository } from './audit-log.repository';
import { AuditLog } from '../entities';

describe('TypeOrmAuditLogRepository', () => {
  let repository: TypeOrmAuditLogRepository;
  let mockRepository: jest.Mocked<Repository<AuditLog>>;

  const mockAuditLog = {
    id: 'audit-123',
    userId: 'user-123',
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: 'user-123',
    details: 'User logged in successfully',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    timestamp: new Date(),
  } as AuditLog;

  beforeEach(async () => {
    const mockRepositoryMethods = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmAuditLogRepository,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepositoryMethods,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmAuditLogRepository>(
      TypeOrmAuditLogRepository,
    );
    mockRepository = module.get(getRepositoryToken(AuditLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new audit log entry', async () => {
      const auditLogData: Partial<AuditLog> = {
        userId: 'user-123',
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: 'user-123',
        details: 'User logged in successfully',
        ipAddress: '192.168.1.1',
      };

      mockRepository.create.mockReturnValue(mockAuditLog);
      mockRepository.save.mockResolvedValue(mockAuditLog);

      const result = await repository.create(auditLogData);

      expect(mockRepository.create).toHaveBeenCalledWith(auditLogData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockAuditLog);
      expect(result).toEqual(mockAuditLog);
    });

    it('should create audit log with all fields', async () => {
      const fullData: Partial<AuditLog> = {
        userId: 'user-456',
        action: 'CHECKOUT_START',
        entityType: 'Transaction',
        entityId: 'transaction-123',
        details: JSON.stringify({ amount: 100000 }),
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/90.0',
      };

      mockRepository.create.mockReturnValue(mockAuditLog);
      mockRepository.save.mockResolvedValue(mockAuditLog);

      await repository.create(fullData);

      expect(mockRepository.create).toHaveBeenCalledWith(fullData);
    });
  });

  describe('findByUserId', () => {
    it('should find all audit logs by user id', async () => {
      const auditLogs = [
        mockAuditLog,
        { ...mockAuditLog, id: 'audit-456', action: 'USER_LOGOUT' },
      ];
      mockRepository.find.mockResolvedValue(auditLogs);

      const result = await repository.findByUserId('user-123');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(auditLogs);
    });

    it('should return empty array if no audit logs found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findByUserId('user-123');

      expect(result).toEqual([]);
    });

    it('should order results by timestamp descending', async () => {
      const auditLogs = [
        { ...mockAuditLog, timestamp: new Date('2024-01-02') },
        { ...mockAuditLog, timestamp: new Date('2024-01-01') },
      ];
      mockRepository.find.mockResolvedValue(auditLogs);

      await repository.findByUserId('user-123');

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { timestamp: 'DESC' },
        }),
      );
    });
  });

  describe('findByAction', () => {
    it('should find all audit logs by action', async () => {
      const auditLogs = [
        mockAuditLog,
        { ...mockAuditLog, id: 'audit-789', userId: 'user-456' },
      ];
      mockRepository.find.mockResolvedValue(auditLogs);

      const result = await repository.findByAction('USER_LOGIN');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { action: 'USER_LOGIN' },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(auditLogs);
    });

    it('should return empty array if no audit logs found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findByAction('UNKNOWN_ACTION');

      expect(result).toEqual([]);
    });

    it('should order results by timestamp descending', async () => {
      mockRepository.find.mockResolvedValue([mockAuditLog]);

      await repository.findByAction('USER_LOGIN');

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { timestamp: 'DESC' },
        }),
      );
    });
  });

  describe('findRecent', () => {
    it('should find recent audit logs with limit', async () => {
      const auditLogs = [
        mockAuditLog,
        { ...mockAuditLog, id: 'audit-456' },
        { ...mockAuditLog, id: 'audit-789' },
      ];
      mockRepository.find.mockResolvedValue(auditLogs);

      const result = await repository.findRecent(10);

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        take: 10,
      });
      expect(result).toEqual(auditLogs);
    });

    it('should find recent audit logs with limit of 1', async () => {
      mockRepository.find.mockResolvedValue([mockAuditLog]);

      const result = await repository.findRecent(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        take: 1,
      });
      expect(result).toHaveLength(1);
    });

    it('should find recent audit logs with larger limit', async () => {
      const auditLogs = Array(100)
        .fill(null)
        .map((_, i) => ({ ...mockAuditLog, id: `audit-${i}` }));
      mockRepository.find.mockResolvedValue(auditLogs);

      await repository.findRecent(100);

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        take: 100,
      });
    });

    it('should order results by timestamp descending', async () => {
      mockRepository.find.mockResolvedValue([mockAuditLog]);

      await repository.findRecent(5);

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { timestamp: 'DESC' },
        }),
      );
    });

    it('should return empty array if no audit logs found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findRecent(10);

      expect(result).toEqual([]);
    });
  });
});
