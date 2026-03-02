import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuestCheckoutSupport1772316200000 implements MigrationInterface {
  name = 'AddGuestCheckoutSupport1772316200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add customerEmail column for guest checkout support
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "customerEmail" character varying(255)`,
    );

    // 2. Make customerId nullable (for guest checkout transactions)
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "customerId" DROP NOT NULL`,
    );

    // 3. Add constraint: Either customerId OR customerEmail must be present
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "CHK_transaction_customer_or_email" 
       CHECK (
         ("customerId" IS NOT NULL) OR ("customerEmail" IS NOT NULL)
       )`,
    );

    // 4. Create index on customerEmail for faster guest transaction lookups
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transaction_customerEmail" ON "transactions" ("customerEmail")`,
    );

    // 5. Update existing transactions to copy email from customer.user.email
    // This ensures existing data has customerEmail populated
    await queryRunner.query(`
      UPDATE "transactions" t
      SET "customerEmail" = u.email
      FROM "customers" c
      INNER JOIN "users" u ON c."userId" = u.id
      WHERE t."customerId" = c.id AND t."customerEmail" IS NULL
    `);

    // 6. Make delivery.customerId nullable (for guest checkout deliveries)
    await queryRunner.query(
      `ALTER TABLE "deliveries" ALTER COLUMN "customerId" DROP NOT NULL`,
    );

    // 7. Add statusToken column for secure public status checking
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "statusToken" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop statusToken column
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "statusToken"`,
    );

    // 2. For rollback safety: Update any NULL customerId in deliveries
    await queryRunner.query(`
      UPDATE "deliveries" 
      SET "customerId" = (SELECT id FROM "customers" LIMIT 1)
      WHERE "customerId" IS NULL
    `);

    // 3. Make delivery.customerId NOT NULL again
    await queryRunner.query(
      `ALTER TABLE "deliveries" ALTER COLUMN "customerId" SET NOT NULL`,
    );

    // 4. Remove index on customerEmail
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transaction_customerEmail"`,
    );

    // 5. Remove check constraint
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "CHK_transaction_customer_or_email"`,
    );

    // 6. For rollback safety: Update any NULL customerId with a placeholder
    // (In production, you'd need to handle this differently)
    await queryRunner.query(`
      UPDATE "transactions" 
      SET "customerId" = (SELECT id FROM "customers" LIMIT 1)
      WHERE "customerId" IS NULL
    `);

    // 7. Make customerId NOT NULL again
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "customerId" SET NOT NULL`,
    );

    // 8. Drop customerEmail column
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "customerEmail"`,
    );
  }
}
