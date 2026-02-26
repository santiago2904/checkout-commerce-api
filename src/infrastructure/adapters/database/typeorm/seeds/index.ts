import 'dotenv/config';
import { DataSource } from 'typeorm';
import { RoleSeeder } from './role.seeder';
import { ProductSeeder } from './product.seeder';
import { dataSourceOptions } from '@infrastructure/config/typeorm.config';

/**
 * Main Seeder Runner
 * Executes all seeders in order
 */
async function runSeeders() {
  let connection: DataSource | null = null;

  try {
    console.log('🌱 Starting database seeding...\n');

    // Initialize database connection
    const dataSource = new DataSource(dataSourceOptions);
    connection = await dataSource.initialize();
    console.log('✓ Database connection established\n');

    // Run seeders in order
    const seeders = [
      new RoleSeeder(),
      new ProductSeeder(),
    ];

    for (const seeder of seeders) {
      await seeder.run(connection);
      console.log('');
    }

    console.log('🎉 All seeders completed successfully!');
  } catch (error) {
    console.error('❌ Error running seeders:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (connection?.isInitialized) {
      await connection.destroy();
      console.log('✓ Database connection closed');
    }
  }
}

// Execute seeders
runSeeders();
