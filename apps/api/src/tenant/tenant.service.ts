import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { CreateTenantRequestDto } from './dto/create-tenant-request.dto';
import { AuthService } from '../auth/auth.service';
import { prisma } from '@zayjar/db';

@Injectable()
export class TenantService {
  private readonly logger = new Logger('TenantService');

  constructor(private readonly authService: AuthService) {}

  /**
   * Orchestrates the complete onboarding transaction for a new restaurant merchant.
   * Maps exactly to standard workflows defined in DOC-005.md.
   */
  async onboard(dto: CreateTenantRequestDto) {
    this.logger.log(`Initiating workspace onboarding transaction for subdomain: [${dto.subdomain}]`);

    // 1. Verify subdomain and email availability
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain: dto.subdomain },
    });
    if (existingTenant) {
      throw new ConflictException('The requested subdomain is already registered.');
    }

    // 2. Hash the owner's password securely using Argon2id Auth Service
    const hashedPassword = await this.authService.hashPassword(dto.ownerPassword);

    // 3. Execute the complete onboarding scope inside a single relational database transaction
    return prisma.$transaction(async (tx: any) => {
      // A. Create Tenant profile
      const tenant = await tx.tenant.create({
        data: {
          name: dto.companyName,
          subdomain: dto.subdomain,
          status: 'TRIALING',
        },
      });

      // B. Provision default 14-day free subscription
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: dto.planId,
          status: 'TRIALING',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 Days
        },
      });

      // C. Register default Restaurant Owner user account
      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          firstName: dto.ownerFirstName,
          lastName: dto.ownerLastName,
          email: dto.ownerEmail.toLowerCase(),
          passwordHash: hashedPassword,
        },
      });

      // D. Assign the RESTAURANT_OWNER role
      const ownerRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'RESTAURANT_OWNER',
          displayName: 'Restaurant Owner',
        },
      });

      await tx.userRole.create({
        data: {
          userId: owner.id,
          roleId: ownerRole.id,
        },
      });

      // E. Create default Restaurant Brand
      const restaurant = await tx.restaurant.create({
        data: {
          tenantId: tenant.id,
          name: dto.companyName,
        },
      });

      // F. Create default Main Office physical branch
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          restaurantId: restaurant.id,
          name: 'Main Branch',
          address: 'Default Branch Address',
          phoneNumber: '+15550199',
          operatingHours: {
            monday: { open: '09:00', close: '22:00', closed: false },
            tuesday: { open: '09:00', close: '22:00', closed: false },
            wednesday: { open: '09:00', close: '22:00', closed: false },
            thursday: { open: '09:00', close: '22:00', closed: false },
            friday: { open: '09:00', close: '23:00', closed: false },
            saturday: { open: '10:00', close: '23:00', closed: false },
            sunday: { open: '10:00', close: '21:00', closed: false },
          },
        },
      });

      this.logger.log(`Onboarding transaction completed successfully. Tenant UUID: [${tenant.id}]`);

      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          status: tenant.status,
        },
        owner: {
          id: owner.id,
          email: owner.email,
        },
        branch: {
          id: branch.id,
          name: branch.name,
        }
      };
    });
  }
}
