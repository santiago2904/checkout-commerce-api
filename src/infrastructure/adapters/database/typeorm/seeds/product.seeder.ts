import { DataSource } from 'typeorm';
import { Product } from '../entities/product.entity';

/**
 * Product Seeder
 * Seeds initial products for testing and demo purposes
 */
export class ProductSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const productRepository = dataSource.getRepository(Product);

    console.log('Seeding products...');

    // Check if products already exist
    const existingProducts = await productRepository.count();
    if (existingProducts > 0) {
      console.log('Products already seeded. Skipping...');
      return;
    }

    // Create sample products
    const products = [
      {
        name: 'Laptop Dell XPS 13',
        description:
          'High-performance laptop with Intel Core i7, 16GB RAM, 512GB SSD',
        price: 2000.99,
        stock: 10,
      },
      {
        name: 'iPhone 15 Pro',
        description: 'Latest Apple iPhone with A17 Pro chip, 256GB storage',
        price: 6000000.99,
        stock: 25,
      },
      {
        name: 'Samsung Galaxy S24',
        description:
          'Flagship Android phone with 128GB storage and 5G connectivity',
        price: 2000.99,
        stock: 15,
      },
      {
        name: 'Sony WH-1000XM5 Headphones',
        description: 'Premium noise-canceling wireless headphones',
        price: 5000000.99,
        stock: 30,
      },
      {
        name: 'iPad Pro 12.9"',
        description: 'Powerful tablet with M2 chip, 256GB storage, WiFi',
        price: 1000000.99,
        stock: 20,
      },
      {
        name: 'MacBook Pro 14"',
        description:
          'Professional laptop with M3 Pro chip, 18GB RAM, 512GB SSD',
        price: 1000000.99,
        stock: 8,
      },
      {
        name: 'Apple Watch Series 9',
        description:
          'Smartwatch with GPS, health monitoring, and fitness tracking',
        price: 2000000.99,
        stock: 40,
      },
      {
        name: 'Samsung 55" 4K Smart TV',
        description: 'Crystal UHD 4K TV with Tizen OS and HDR support',
        price: 3000000.99,
        stock: 12,
      },
      {
        name: 'Nintendo Switch OLED',
        description: 'Gaming console with vibrant OLED screen and 64GB storage',
        price: 2000.99,
        stock: 18,
      },
      {
        name: 'Logitech MX Master 3S',
        description: 'Ergonomic wireless mouse for professionals',
        price: 4000000.99,
        stock: 50,
      },
    ];

    for (const productData of products) {
      const product = productRepository.create(productData);
      await productRepository.save(product);
      console.log(`✓ Created product: ${productData.name}`);
    }

    console.log('✓ Product seeding completed');
  }
}
