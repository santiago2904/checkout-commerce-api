import { AuditLog } from './audit-log.entity';

describe('AuditLog Entity', () => {
  describe('instantiation', () => {
    it('should create an AuditLog instance', () => {
      const auditLog = new AuditLog();
      expect(auditLog).toBeInstanceOf(AuditLog);
    });

    it('should have id property', () => {
      const auditLog = new AuditLog();
      auditLog.id = 'test-id';
      expect(auditLog.id).toBe('test-id');
    });

    it('should have userId property', () => {
      const auditLog = new AuditLog();
      auditLog.userId = 'user-123';
      expect(auditLog.userId).toBe('user-123');
    });

    it('should have roleName property', () => {
      const auditLog = new AuditLog();
      auditLog.roleName = 'ADMIN';
      expect(auditLog.roleName).toBe('ADMIN');
    });

    it('should have action property', () => {
      const auditLog = new AuditLog();
      auditLog.action = 'CREATE_USER';
      expect(auditLog.action).toBe('CREATE_USER');
    });

    it('should have timestamp property', () => {
      const auditLog = new AuditLog();
      const date = new Date();
      auditLog.timestamp = date;
      expect(auditLog.timestamp).toBe(date);
    });

    it('should have metadata property', () => {
      const auditLog = new AuditLog();
      const metadata = { ip: '127.0.0.1', userAgent: 'Mozilla' };
      auditLog.metadata = metadata;
      expect(auditLog.metadata).toEqual(metadata);
    });
  });

  describe('inheritance', () => {
    it('should have createdAt from BaseEntity', () => {
      const auditLog = new AuditLog();
      expect(auditLog).toHaveProperty('createdAt');
    });

    it('should have updatedAt from BaseEntity', () => {
      const auditLog = new AuditLog();
      expect(auditLog).toHaveProperty('updatedAt');
    });

    it('should have deletedAt from BaseEntity', () => {
      const auditLog = new AuditLog();
      expect(auditLog).toHaveProperty('deletedAt');
    });
  });

  describe('audit functionality', () => {
    it('should store audit log with all required fields', () => {
      const auditLog = new AuditLog();
      auditLog.userId = 'user-123';
      auditLog.roleName = 'ADMIN';
      auditLog.action = 'DELETE_PRODUCT';
      auditLog.timestamp = new Date();
      
      expect(auditLog.userId).toBe('user-123');
      expect(auditLog.roleName).toBe('ADMIN');
      expect(auditLog.action).toBe('DELETE_PRODUCT');
      expect(auditLog.timestamp).toBeInstanceOf(Date);
    });

    it('should store optional metadata', () => {
      const auditLog = new AuditLog();
      const metadata = { productId: 'prod-123', reason: 'Out of stock' };
      auditLog.metadata = metadata;
      
      expect(auditLog.metadata).toEqual(metadata);
    });
  });
});
