import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [StatisticsModule],
  controllers: [HealthController],
})
export class AppModule {}
