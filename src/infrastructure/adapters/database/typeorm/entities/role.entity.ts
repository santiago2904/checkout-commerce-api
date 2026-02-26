import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RoleName } from '@domain/enums';

/**
 * Role Entity
 * Represents a user role in the system (ADMIN, CUSTOMER)
 */
@Entity('roles')
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RoleName,
    unique: true,
  })
  name: RoleName;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;
}
