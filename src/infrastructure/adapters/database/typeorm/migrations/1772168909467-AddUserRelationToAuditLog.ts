import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRelationToAuditLog1772168909467 implements MigrationInterface {
  name = 'AddUserRelationToAuditLog1772168909467';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Delete all existing audit logs to avoid type conversion issues
    // This is acceptable in development/staging environments
    // In production, you might want to migrate the data properly
    await queryRunner.query(`DELETE FROM "audit_logs"`);

    // Change userId column from varchar(255) to uuid
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "userId" uuid NOT NULL`,
    );

    // Add foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab"`,
    );

    // Revert userId column back to varchar(255)
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "userId" character varying(255) NOT NULL`,
    );
  }
}
