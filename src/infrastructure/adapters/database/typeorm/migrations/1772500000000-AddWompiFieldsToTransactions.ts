import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWompiFieldsToTransactions1772500000000 implements MigrationInterface {
  name = 'AddWompiFieldsToTransactions1772500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add paymentMethod column (CARD, PSE, NEQUI, etc.)
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "paymentMethod" character varying(50)`,
    );

    // 2. Add ipAddress column (IP of device making transaction)
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "ipAddress" character varying(45)`,
    );

    // 3. Add wompiTransactionId column (Wompi's transaction ID for tracking)
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "wompiTransactionId" character varying(255)`,
    );

    // 4. Add errorCode column (HTTP error code if transaction failed)
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "errorCode" character varying(50)`,
    );

    // 5. Add errorMessage column (Descriptive error message)
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "errorMessage" text`,
    );

    // 6. Create index on wompiTransactionId for faster lookups
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transaction_wompiTransactionId" ON "transactions" ("wompiTransactionId")`,
    );

    // 7. Create index on paymentMethod for analytics
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transaction_paymentMethod" ON "transactions" ("paymentMethod")`,
    );

    // 8. Update existing records with default values if any exist
    await queryRunner.query(`
      UPDATE "transactions" 
      SET 
        "paymentMethod" = COALESCE("paymentMethod", 'CARD'),
        "ipAddress" = COALESCE("ipAddress", '0.0.0.0')
      WHERE "paymentMethod" IS NULL OR "ipAddress" IS NULL
    `);

    // 9. Make required fields NOT NULL after setting defaults
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "paymentMethod" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "ipAddress" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transaction_paymentMethod"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transaction_wompiTransactionId"`,
    );

    // 2. Drop columns
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "errorMessage"`,
    );

    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "errorCode"`,
    );

    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "wompiTransactionId"`,
    );

    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "ipAddress"`,
    );

    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "paymentMethod"`,
    );
  }
}
