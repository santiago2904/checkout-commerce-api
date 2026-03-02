import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeAuditLogUserIdNullable1772620000000 implements MigrationInterface {
  name = 'MakeAuditLogUserIdNullable1772620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make userId column nullable in audit_logs table
    // This allows system-generated audit logs (e.g., fulfillment process)
    // to be created without requiring a user association
    await queryRunner.query(`
      ALTER TABLE "audit_logs" 
      ALTER COLUMN "userId" DROP NOT NULL
    `);

    // Update existing 'SYSTEM' entries to NULL if any exist
    // (This handles any data that might have been created with invalid UUID values)
    await queryRunner.query(`
      UPDATE "audit_logs" 
      SET "userId" = NULL 
      WHERE "userId" NOT IN (SELECT "id" FROM "users")
        AND "roleName" = 'SYSTEM'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: We cannot safely revert this migration if there are NULL values
    // First, we would need to create a system user or assign these logs to an admin

    // Make userId NOT NULL again
    // This will fail if there are NULLs in the column
    await queryRunner.query(`
      ALTER TABLE "audit_logs" 
      ALTER COLUMN "userId" SET NOT NULL
    `);
  }
}
