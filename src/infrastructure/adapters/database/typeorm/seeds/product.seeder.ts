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
        name: 'iPhone 15 Pro 256GB',
        description:
          'Apple iPhone 15 Pro con chip A17 Pro, cámara de 48MP, titanio, pantalla Super Retina XDR de 6.1"',
        price: 5499000,
        stock: 0, // Agotado
        imageUrl:
          'https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=500',
      },
      {
        name: 'MacBook Air M2 13"',
        description:
          'Laptop Apple con chip M2, 8GB RAM, 256GB SSD, pantalla Retina 13.6", diseño ultra delgado',
        price: 4299000,
        stock: 1, // Última unidad disponible
        imageUrl:
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
      },
      {
        name: 'Sony WH-1000XM5',
        description:
          'Audífonos premium con cancelación de ruido líder en la industria, 30 horas de batería, sonido Hi-Res',
        price: 1249900,
        stock: 25,
        imageUrl:
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500',
      },
      {
        name: 'Logitech MX Master 3S',
        description:
          'Mouse inalámbrico ergonómico para profesionales, sensor de 8000 DPI, scroll electromagnético MagSpeed',
        price: 379900,
        stock: 50,
        imageUrl:
          'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500',
      },
      {
        name: 'Keychron K2 V2 Mechanical',
        description:
          'Teclado mecánico inalámbrico con switches Gateron Brown, retroiluminación RGB, compatible Mac/Windows',
        price: 459000,
        stock: 35,
        imageUrl:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
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
