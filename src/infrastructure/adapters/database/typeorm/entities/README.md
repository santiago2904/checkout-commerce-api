# BaseEntity Implementation

## Overview
`BaseEntity` is an abstract class that provides automatic timestamp management and soft delete functionality for all database entities in the application.

## Features

### 1. **Automatic Timestamps**
- `createdAt`: Automatically set when an entity is first persisted to the database
- `updatedAt`: Automatically updated whenever the entity is modified

### 2. **Soft Deletes**
- `deletedAt`: Instead of physically removing records from the database, this timestamp is set when an entity is "deleted"
- Soft-deleted entities are automatically excluded from queries by TypeORM
- Allows for data recovery and audit trails

## Usage

All domain entities should extend from `BaseEntity`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from '@infrastructure/adapters/database/typeorm/entities';

@Entity('users')
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  password: string;
}
```

## Soft Delete Operations

### Delete (Soft)
```typescript
// This will set deletedAt to current timestamp
await userRepository.softDelete(userId);
// OR
await userRepository.softRemove(user);
```

### Restore
```typescript
// Restore a soft-deleted entity
await userRepository.restore(userId);
```

### Find Including Deleted
```typescript
// Include soft-deleted entities in query
const users = await userRepository.find({
  withDeleted: true,
});
```

### Find Only Deleted
```typescript
// Find only soft-deleted entities
const deletedUsers = await userRepository
  .createQueryBuilder('user')
  .where('user.deletedAt IS NOT NULL')
  .withDeleted()
  .getMany();
```

## Benefits

1. **Audit Trail**: Maintain history of deleted records
2. **Data Recovery**: Easy restoration of accidentally deleted data
3. **Compliance**: Meet regulatory requirements for data retention
4. **Referential Integrity**: Avoid breaking foreign key constraints
5. **Consistency**: All entities follow the same pattern

## Database Schema

Each table that extends BaseEntity will have these columns:

```sql
createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
deletedAt TIMESTAMP NULL
```

## Testing

The BaseEntity includes comprehensive unit tests covering:
- Timestamp properties existence
- Automatic timestamp setting
- Soft delete functionality
- Inheritance behavior

See `base.entity.spec.ts` for test implementation.
