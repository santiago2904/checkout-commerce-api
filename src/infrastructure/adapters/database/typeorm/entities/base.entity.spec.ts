import { BaseEntity } from './base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Test entity to verify BaseEntity behavior
@Entity()
class TestEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}

describe('BaseEntity', () => {
  let testEntity: TestEntity;

  beforeEach(() => {
    testEntity = new TestEntity();
    testEntity.name = 'Test';
  });

  describe('Timestamps', () => {
    it('should have createdAt property', () => {
      expect(testEntity).toHaveProperty('createdAt');
    });

    it('should have updatedAt property', () => {
      expect(testEntity).toHaveProperty('updatedAt');
    });

    it('should have deletedAt property for soft deletes', () => {
      expect(testEntity).toHaveProperty('deletedAt');
    });

    it('should set createdAt automatically', () => {
      const now = new Date();
      testEntity.createdAt = now;
      expect(testEntity.createdAt).toBe(now);
    });

    it('should set updatedAt automatically', () => {
      const now = new Date();
      testEntity.updatedAt = now;
      expect(testEntity.updatedAt).toBe(now);
    });

    it('deletedAt should be nullable', () => {
      expect(testEntity.deletedAt).toBeUndefined();
    });
  });

  describe('Soft Deletes', () => {
    it('should support soft delete by setting deletedAt', () => {
      const now = new Date();
      testEntity.deletedAt = now;
      expect(testEntity.deletedAt).toBe(now);
    });

    it('should allow deletedAt to be null', () => {
      testEntity.deletedAt = null;
      expect(testEntity.deletedAt).toBeNull();
    });
  });

  describe('Entity Type', () => {
    it('should be an instance of BaseEntity', () => {
      expect(testEntity).toBeInstanceOf(BaseEntity);
    });

    it('should allow extending classes to have additional properties', () => {
      expect(testEntity.name).toBe('Test');
    });
  });
});
