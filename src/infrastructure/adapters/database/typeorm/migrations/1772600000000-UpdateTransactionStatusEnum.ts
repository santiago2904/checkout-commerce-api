import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTransactionStatusEnum1772600000000
  implements MigrationInterface
{
  name = 'UpdateTransactionStatusEnum1772600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL requires ALTER TYPE to add new values to an enum
    // Note: ALTER TYPE must be outside a transaction block, but TypeORM
    // handles this automatically. The UPDATE has been removed to avoid
    // "unsafe use of new value" error within the same transaction.
    
    // Add DECLINED status
    await queryRunner.query(
      `ALTER TYPE "transaction_status_enum" ADD VALUE IF NOT EXISTS 'DECLINED'`,
    );

    // Add VOIDED status
    await queryRunner.query(
      `ALTER TYPE "transaction_status_enum" ADD VALUE IF NOT EXISTS 'VOIDED'`,
    );

    // Add ERROR status
    await queryRunner.query(
      `ALTER TYPE "transaction_status_enum" ADD VALUE IF NOT EXISTS 'ERROR'`,
    );

    // Note: No UPDATE needed as FAILED status was never used in production
    // If needed, update existing FAILED records manually after migration
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // We need to recreate the enum type

    // 1. Create a temporary enum with only old values
    await queryRunner.query(
      `CREATE TYPE "transaction_status_enum_old" AS ENUM ('PENDING', 'APPROVED', 'FAILED')`,
    );

    // 2. Update existing records: map new values back to old values
    await queryRunner.query(`
      UPDATE "transactions" 
      SET "status" = CASE 
        WHEN "status" IN ('DECLINED', 'VOIDED', 'ERROR') THEN 'FAILED'::transaction_status_enum
        ELSE "status"
      END
    `);

    // 3. Alter table to use old enum temporarily
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "transaction_status_enum_old" USING "status"::text::"transaction_status_enum_old"`,
    );

    // 4. Drop new enum
    await queryRunner.query(`DROP TYPE "transaction_status_enum"`);

    // 5. Rename old enum back
    await queryRunner.query(
      `ALTER TYPE "transaction_status_enum_old" RENAME TO "transaction_status_enum"`,
    );
  }
}
