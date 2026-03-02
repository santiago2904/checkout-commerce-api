import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageUrlToProducts1772400000000 implements MigrationInterface {
  name = 'AddImageUrlToProducts1772400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add imageUrl column to products table
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "imageUrl" character varying(500)`,
    );

    console.log('✓ Added imageUrl column to products table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop imageUrl column from products table
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "imageUrl"`,
    );

    console.log('✓ Removed imageUrl column from products table');
  }
}
