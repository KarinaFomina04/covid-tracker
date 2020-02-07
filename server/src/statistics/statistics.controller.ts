import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { HistoryService } from './history/history.service';
import { HistoryQueryDto } from './history/dto/history-query.dto';

@Controller()
export class StatisticsController {
  constructor(
    private readonly statistics: StatisticsService,
    private readonly history: HistoryService,
  ) {}

  @Get('summary')
  getSummary() {
    return this.statistics.getSummary();
  }

  @Get('summary/history')
  getSummaryHistory(@Query() query: HistoryQueryDto) {
    return this.history.getHistory('OWID_WRL', query);
  }

  @Get('map')
  getMap() {
    return this.statistics.getMap();
  }

  @Get('meta')
  getMetadata() {
    return this.statistics.getMetadata();
  }
}
