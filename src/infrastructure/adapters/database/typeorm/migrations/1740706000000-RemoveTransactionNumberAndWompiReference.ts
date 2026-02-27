import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTransactionNumberAndWompiReference1740706000000 implements MigrationInterface {
  name = 'RemoveTransactionNumberAndWompiReference1740706000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop unique constraint on transactionNumber
    // PostgreSQL auto-generates constraint name as: {table}_{column}_key
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_transactionNumber_key"`,
    );

    // 2. Drop transactionNumber column (if constraint doesn't exist, column can still be dropped)
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "transactionNumber"`,
    );

    // 3. Drop wompiReference column (was added via synchronize, may not exist in all databases)
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "wompiReference"`,
    );

    // 4. Ensure reference column is NOT NULL and UNIQUE (if not already)
    // First update any NULL values to a temporary value
    await queryRunner.query(
      `UPDATE "transactions" SET "reference" = 'REF-MIGRATION-' || "id" WHERE "reference" IS NULL`,
    );

    // Set column to NOT NULL
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "reference" SET NOT NULL`,
    );

    // Add unique constraint on reference
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "UQ_transaction_reference" UNIQUE ("reference")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Remove unique constraint on reference (if it exists)
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "UQ_transaction_reference"`,
    );

    // 2. Make reference nullable again
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "reference" DROP NOT NULL`,
    );

    // 3. Re-add wompiReference column
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "wompiReference" character varying(255)`,
    );

    // 4. Re-add transactionNumber column with safe default
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "transactionNumber" character varying(100) NOT NULL DEFAULT 'TXN-ROLLBACK-' || gen_random_uuid()::text`,
    );

    // 5. Add unique constraint on transactionNumber (PostgreSQL auto-generates this name)
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transactionNumber_key" UNIQUE ("transactionNumber")`,
    );

    // 6. Remove default value (was only for rollback safety)
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "transactionNumber" DROP DEFAULT`,
    );
  }
}
