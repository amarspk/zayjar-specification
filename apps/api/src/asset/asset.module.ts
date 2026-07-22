import { Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetOptimizationService } from './asset-optimization.service';
import { AssetController } from './asset.controller';

@Module({
  controllers: [AssetController],
  providers: [AssetService, AssetOptimizationService],
  exports: [AssetService, AssetOptimizationService],
})
export class AssetModule {}
