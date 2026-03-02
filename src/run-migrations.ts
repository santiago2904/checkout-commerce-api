// Production migration runner
// This file is executed in production to run TypeORM migrations

require('dotenv/config');
const { DataSource } = require('typeorm');

const runMigrations = async () => {
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
    migrations: [
      __dirname + '/infrastructure/adapters/database/typeorm/migrations/*.js',
    ],
    synchronize: false,
    logging: true,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();
    console.log('Running migrations...');
    // Use 'each' instead of 'all' to allow enum modifications
    // ALTER TYPE ADD VALUE cannot run inside a transaction block
    const migrations = await dataSource.runMigrations({ transaction: 'each' });

    if (migrations.length === 0) {
      console.log('No migrations to run - database is up to date');
    } else {
      console.log(`Successfully ran ${migrations.length} migrations:`);
      migrations.forEach((migration) => {
        console.log(`  - ${migration.name}`);
      });
    }

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
};

runMigrations();
