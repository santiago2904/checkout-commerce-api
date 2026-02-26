import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1740600000000 implements MigrationInterface {
  name = 'InitialSchema1740600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(50) NOT NULL UNIQUE,
        "description" VARCHAR(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "roleId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "FK_users_roles" FOREIGN KEY ("roleId") 
          REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "price" DECIMAL(10,2) NOT NULL,
        "stock" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP
      )
    `);

    // Create customers table
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "firstName" VARCHAR(100) NOT NULL,
        "lastName" VARCHAR(100) NOT NULL,
        "phone" VARCHAR(20) NOT NULL,
        "address" VARCHAR(255) NOT NULL,
        "city" VARCHAR(100) NOT NULL,
        "country" VARCHAR(100) NOT NULL,
        "userId" uuid NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "FK_customers_users" FOREIGN KEY ("userId") 
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // Create deliveries table
    await queryRunner.query(`
      CREATE TABLE "deliveries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "address" VARCHAR(255) NOT NULL,
        "city" VARCHAR(100) NOT NULL,
        "trackingNumber" VARCHAR(50),
        "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        "estimatedDelivery" TIMESTAMP,
        "actualDelivery" TIMESTAMP,
        "customerId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "FK_deliveries_customers" FOREIGN KEY ("customerId") 
          REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // Create transaction status enum
    await queryRunner.query(`
      CREATE TYPE "transaction_status_enum" AS ENUM ('PENDING', 'APPROVED', 'FAILED')
    `);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "transactionNumber" VARCHAR(100) NOT NULL UNIQUE,
        "amount" DECIMAL(10,2) NOT NULL,
        "reference" VARCHAR(255),
        "status" transaction_status_enum NOT NULL DEFAULT 'PENDING',
        "customerId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "FK_transactions_customers" FOREIGN KEY ("customerId") 
          REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" VARCHAR(255) NOT NULL,
        "roleName" VARCHAR(50) NOT NULL,
        "action" VARCHAR(255) NOT NULL,
        "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "metadata" JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_roles_name" ON "roles" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_roleId" ON "users" ("roleId")`);
    await queryRunner.query(`CREATE INDEX "IDX_customers_userId" ON "customers" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_deliveries_customerId" ON "deliveries" ("customerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_customerId" ON "transactions" ("customerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_status" ON "transactions" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_userId" ON "audit_logs" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_timestamp" ON "audit_logs" ("timestamp")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_timestamp"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_status"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_customerId"`);
    await queryRunner.query(`DROP INDEX "IDX_deliveries_customerId"`);
    await queryRunner.query(`DROP INDEX "IDX_customers_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_users_roleId"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "IDX_roles_name"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "transaction_status_enum"`);
    await queryRunner.query(`DROP TABLE "deliveries"`);
    await queryRunner.query(`DROP TABLE "customers"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    
    // Drop UUID extension
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
