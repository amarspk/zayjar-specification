import { Test, TestingModule } from '@nestjs/testing';
import { AssetService } from './asset.service';
import { BadRequestException } from '@nestjs/common';

describe('AssetService Unit Tests - TSK-2.9 Image Storage', () => {
  let service: AssetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetService],
    }).compile();

    service = module.get<AssetService>(AssetService);
    jest.clearAllMocks();
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  it('should generate presigned URL for valid image upload', async () => {
    const tenantId = 'tenant-123';
    const userId = 'user-123';
    const dto = {
      contentType: 'image/jpeg',
      fileSize: 1024 * 1024, // 1MB
      fileName: 'product-photo.jpg',
      folder: 'products',
    };

    const result = await service.createPresignedUrl(dto, tenantId, userId);

    expect(result.presignedUrl).toBeDefined();
    expect(result.presignedUrl).toContain('https://');
    expect(result.key).toContain(`tenants/${tenantId}/products/`);
    expect(result.key).toContain('.jpg');
    expect(result.expiresIn).toBe(300); // 5 minutes
    expect(result.publicUrl).toContain('amazonaws.com');
    expect(result.publicUrl).toContain('zayjar-assets-production');
    expect(result.contentType).toBe(dto.contentType);
  });

  it('should reject invalid MIME type', async () => {
    const tenantId = 'tenant-123';
    const userId = 'user-123';
    const dto = {
      contentType: 'application/pdf',
      fileSize: 1024,
      fileName: 'document.pdf',
    };

    await expect(service.createPresignedUrl(dto, tenantId, userId)).rejects.toThrow(BadRequestException);
  });

  it('should reject file size exceeding limit for product photos (5MB)', async () => {
    const tenantId = 'tenant-123';
    const userId = 'user-123';
    const dto = {
      contentType: 'image/jpeg',
      fileSize: 6 * 1024 * 1024, // 6MB > 5MB
      fileName: 'large.jpg',
      folder: 'products',
    };

    await expect(service.createPresignedUrl(dto, tenantId, userId)).rejects.toThrow(BadRequestException);
  });

  it('should enforce 2MB limit for logos', async () => {
    const tenantId = 'tenant-123';
    const userId = 'user-123';
    const dto = {
      contentType: 'image/png',
      fileSize: 3 * 1024 * 1024, // 3MB > 2MB for logos
      fileName: 'logo.png',
      folder: 'branding/logo',
    };

    await expect(service.createPresignedUrl(dto, tenantId, userId)).rejects.toThrow(BadRequestException);
  });

  it('should enforce tenant isolation via key path', async () => {
    const tenantId = 'real-tenant-from-jwt';
    const evilTenantId = 'evil-tenant';
    const userId = 'user-1';
    const dto = {
      contentType: 'image/webp',
      fileSize: 1024,
      fileName: 'test.webp',
      folder: 'products',
    };

    const result = await service.createPresignedUrl(dto, tenantId, userId);

    expect(result.key).toContain(`tenants/${tenantId}/`);
    expect(result.key).not.toContain(evilTenantId);
  });

  it('should return mock URL when AWS credentials not configured', async () => {
    const tenantId = 'tenant-123';
    const userId = 'user-123';
    const dto = {
      contentType: 'image/png',
      fileSize: 512 * 1024,
      fileName: 'test.png',
    };

    // Ensure no AWS creds
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;

    const result = await service.createPresignedUrl(dto, tenantId, userId);

    expect(result.presignedUrl).toContain('mock-signature');
    expect(result.presignedUrl).toContain('X-Amz-Expires');
  });
});
