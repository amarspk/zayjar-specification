import { CacheService } from './cache.service';

describe('CacheService Unit Tests', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  it('should gracefully fallback to fetchFn if Redis is offline', async () => {
    const fetchFn = jest.fn().mockResolvedValue('fresh-db-data');
    
    // Act
    const result = await cacheService.get('test-key', fetchFn, 3600);

    // Assert
    expect(result).toBe('fresh-db-data');
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(cacheService.isCacheActive()).toBe(false);
  });
});
