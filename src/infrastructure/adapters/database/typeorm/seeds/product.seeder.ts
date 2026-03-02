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
        imageUrl:
          'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500',
      },
      {
        name: 'iPhone 15 Pro',
        description: 'Latest Apple iPhone with A17 Pro chip, 256GB storage',
        price: 6000000.99,
        stock: 25,
        imageUrl:
          'https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=500',
      },
      {
        name: 'Samsung Galaxy S24',
        description:
          'Flagship Android phone with 128GB storage and 5G connectivity',
        price: 2000.99,
        stock: 15,
        imageUrl:
          'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500',
      },
      {
        name: 'Sony WH-1000XM5 Headphones',
        description: 'Premium noise-canceling wireless headphones',
        price: 5000000.99,
        stock: 30,
        imageUrl:
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500',
      },
      {
        name: 'iPad Pro 12.9"',
        description: 'Powerful tablet with M2 chip, 256GB storage, WiFi',
        price: 1000000.99,
        stock: 20,
        imageUrl:
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500',
      },
      {
        name: 'MacBook Pro 14"',
        description:
          'Professional laptop with M3 Pro chip, 18GB RAM, 512GB SSD',
        price: 1000000.99,
        stock: 8,
        imageUrl:
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
      },
      {
        name: 'Apple Watch Series 9',
        description:
          'Smartwatch with GPS, health monitoring, and fitness tracking',
        price: 2000000.99,
        stock: 40,
        imageUrl:
          'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=500',
      },
      {
        name: 'Samsung 55" 4K Smart TV',
        description: 'Crystal UHD 4K TV with Tizen OS and HDR support',
        price: 3000000.99,
        stock: 12,
        imageUrl:
          'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500',
      },
      {
        name: 'Nintendo Switch OLED',
        description: 'Gaming console with vibrant OLED screen and 64GB storage',
        price: 2000.99,
        stock: 18,
        imageUrl:
          'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500',
      },
      {
        name: 'Logitech MX Master 3S',
        description: 'Ergonomic wireless mouse for professionals',
        price: 4000000.99,
        stock: 50,
        imageUrl:
          'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500',
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
