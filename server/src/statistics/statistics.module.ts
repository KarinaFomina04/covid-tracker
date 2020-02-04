import { Module } from '@nestjs/common';
import { CountriesController } from './countries.controller';
import { OwidSourceService } from './owid-source.service';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { DataSyncService } from './sync/data-sync.service';
import { DatasetStoreService } from './sync/dataset-store.service';
import { SyncController } from './sync/sync.controller';

@Module({
  controllers: [StatisticsController, CountriesController, SyncController],
  providers: [OwidSourceService, DatasetStoreService, DataSyncService, StatisticsService],
})
export class StatisticsModule {}
