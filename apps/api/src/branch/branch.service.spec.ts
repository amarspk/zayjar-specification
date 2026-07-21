import { Test, TestingModule } from '@nestjs/testing';
import { BranchService } from './branch.service';
import { dbTenantContext, TenantBranchRepository, TenantTableRepository } from '@zayjar/db';

describe('BranchService Unit Tests', () => {
  let service: BranchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BranchService],
    }).compile();

    service = module.get<BranchService>(BranchService);
  });

  it('should successfully create branches and tables with secure QR tokens', async () => {
    const branchId = 'branch-uuid-1234';
    const tenantId = 'tenant-uuid-1111';

    // Mock Branch repository lookup
    const branchFindSpy = jest.spyOn(TenantBranchRepository.prototype, 'findById')
      .mockResolvedValue({ id: branchId, tenantId } as any);

    // Mock Table repository creation
    const tableCreateSpy = jest.spyOn(TenantTableRepository.prototype, 'create')
      .mockImplementation((data) => Promise.resolve(data as any));

    const dto = {
      branchId,
      number: 'Table-04',
      seatingCapacity: 4,
    };

    await dbTenantContext.run({ tenantId }, async () => {
      const result = await service.createTable(dto);

      expect(result.branchId).toBe(branchId);
      expect(result.number).toBe('Table-04');
      expect(result.qrCodeToken).toBeDefined();
      expect(result.qrCodeToken.length).toBe(64); // 64 Chars hex from HMAC-SHA256
      
      expect(branchFindSpy).toHaveBeenCalledWith(branchId);
      expect(tableCreateSpy).toHaveBeenCalled();
    });
  });
});
