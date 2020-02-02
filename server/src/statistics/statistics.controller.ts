import { Controller, Get } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller()
export class StatisticsController {
  constructor(private readonly statistics: StatisticsService) {}

  @Get('summary')
  getSummary() {
    return this.statistics.getSummary();
  }

  @Get('meta')
  getMetadata() {
    return this.statistics.getMetadata();
  }
}
