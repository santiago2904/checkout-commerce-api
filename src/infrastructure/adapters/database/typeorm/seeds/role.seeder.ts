import { DataSource } from 'typeorm';
import { Role } from '../entities/role.entity';
import { RoleName } from '@domain/enums';

/**
 * Role Seeder
 * Seeds initial roles: ADMIN and CUSTOMER
 */
export class RoleSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const roleRepository = dataSource.getRepository(Role);

    console.log('Seeding roles...');

    // Check if roles already exist
    const existingRoles = await roleRepository.count();
    if (existingRoles > 0) {
      console.log('Roles already seeded. Skipping...');
      return;
    }

    // Create roles
    const roles = [
      {
        name: RoleName.ADMIN,
        description: 'Administrator with full access to the system',
      },
      {
        name: RoleName.CUSTOMER,
        description: 'Customer with access to checkout and purchase history',
      },
    ];

    for (const roleData of roles) {
      const role = roleRepository.create(roleData);
      await roleRepository.save(role);
      console.log(`✓ Created role: ${roleData.name}`);
    }

    console.log('✓ Role seeding completed');
  }
}
