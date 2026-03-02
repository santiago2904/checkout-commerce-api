// Production seeder runner
// This file is executed in production to run database seeders
// It imports the compiled seeders from the dist directory

require('dotenv/config');
const { DataSource } = require('typeorm');

const runSeeders = async () => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'checkout_commerce',
    entities: [
      __dirname +
        '/infrastructure/adapters/database/typeorm/entities/*.entity.js',
    ],
    synchronize: false,
    logging: false,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  let connection: any = null;

  try {
    console.log('🌱 Starting database seeding...');
    connection = await dataSource.initialize();
    console.log('✓ Database connection established\n');

    // Import compiled seeders from dist directory
    const {
      RoleSeeder,
    } = require('./infrastructure/adapters/database/typeorm/seeds/role.seeder');
    const {
      ProductSeeder,
    } = require('./infrastructure/adapters/database/typeorm/seeds/product.seeder');

    const seeders = [new RoleSeeder(), new ProductSeeder()];

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
    if (connection && connection.isInitialized) {
      await connection.destroy();
      console.log('✓ Database connection closed');
    }
  }
};

runSeeders();
