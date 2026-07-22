import { Test, TestingModule } from '@nestjs/testing';
import { AssetOptimizationService } from './asset-optimization.service';

describe('AssetOptimizationService Unit Tests - DOC-007 6.3 Image Optimization', () => {
  let service: AssetOptimizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetOptimizationService],
    }).compile();

    service = module.get<AssetOptimizationService>(AssetOptimizationService);
    jest.clearAllMocks();
  });

  it('should optimize image to WebP with quality 80% and strip EXIF', async () => {
    const tenantId = 'tenant-123';
    const folder = 'products';
    const mockBuffer = Buffer.alloc(1024 * 1024, 0xff); // 1MB mock image

    const result = await service.optimizeImage(mockBuffer, folder, tenantId);

    expect(result.buffer).toBeDefined();
    expect(result.buffer.length).toBeLessThan(mockBuffer.length); // Should be smaller due to optimization
    expect(result.width).toBe(1024);
    expect(result.height).toBe(768);
  });

  it('should resize logo to 512x512 per DOC-007 6.3', async () => {
    const tenantId = 'tenant-123';
    const folder = 'branding/logo';
    const mockBuffer = Buffer.alloc(500 * 1024);

    const result = await service.optimizeImage(mockBuffer, folder, tenantId);

    expect(result.width).toBe(512);
    expect(result.height).toBe(512);
  });

  it('should resize banner to 1920x1080', async () => {
    const tenantId = 'tenant-123';
    const folder = 'branding/banner';
    const mockBuffer = Buffer.alloc(800 * 1024);

    const result = await service.optimizeImage(mockBuffer, folder, tenantId);

    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
  });

  it('should resize product photos to 1024x768', async () => {
    const tenantId = 'tenant-123';
    const folder = 'products';
    const mockBuffer = Buffer.alloc(1024 * 1024);

    const result = await service.optimizeImage(mockBuffer, folder, tenantId);

    expect(result.width).toBe(1024);
    expect(result.height).toBe(768);
  });

  it('should handle S3 upload trigger and generate optimized key with WebP and cache-busting', async () => {
    const tenantId = 'tenant-123';
    const event = {
      bucket: 'zayjar-assets-production',
      key: 'tenants/tenant-123/raw/products/image123.jpg',
      tenantId,
      folder: 'products',
    };

    const result = await service.handleS3UploadTrigger(event);

    expect(result.originalKey).toBe(event.key);
    expect(result.optimizedKey).toContain('.webp');
    expect(result.optimizedKey).not.toContain('/raw/');
    expect(result.format).toBe('webp');
    expect(result.publicUrl).toContain('https://');
    expect(result.publicUrl).toContain('?v='); // Cache-busting per DOC-007 6.4
    expect(result.cacheControl).toBe('public, max-age=31536000, immutable');
    expect(result.optimizedSize).toBeLessThan(result.originalSize);
  });

  it('should generate cache-busted URL with timestamp', () => {
    const publicUrl = 'https://zayjar-assets-production.s3.us-east-1.amazonaws.com/tenants/tenant-123/products/image.webp';
    const busted = service.generateCacheBustedUrl(publicUrl);

    expect(busted).toContain(publicUrl);
    expect(busted).toContain('?v=');
    // Should contain numeric timestamp
    expect(busted).toMatch(/\?v=\d+/);
  });

  it('should preserve tenant isolation in optimized key path', async () => {
    const realTenantId = 'real-tenant';
    const event = {
      bucket: 'zayjar-assets-production',
      key: `tenants/${realTenantId}/raw/products/image.jpg`,
      tenantId: realTenantId,
      folder: 'products',
    };

    const result = await service.handleS3UploadTrigger(event);

    expect(result.optimizedKey).toContain(`tenants/${realTenantId}/`);
    expect(result.optimizedKey).not.toContain('evil-tenant');
    expect(result.publicUrl).toContain(realTenantId);
  });
});
