import { Module } from '@nestjs/common';
import { CountriesController } from './countries.controller';
import { OwidSourceService } from './owid-source.service';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  controllers: [StatisticsController, CountriesController],
  providers: [OwidSourceService, StatisticsService],
})
export class StatisticsModule {}
