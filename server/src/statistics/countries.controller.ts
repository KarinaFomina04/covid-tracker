import { Controller, Get, Param, Query } from '@nestjs/common';
import { CountriesQueryDto } from './dto/countries-query.dto';
import { StatisticsService } from './statistics.service';
import { HistoryService } from './history/history.service';
import { HistoryQueryDto } from './history/dto/history-query.dto';

@Controller('countries')
export class CountriesController {
  constructor(
    private readonly statistics: StatisticsService,
    private readonly history: HistoryService,
  ) {}

  @Get()
  getCountries(@Query() query: CountriesQueryDto) {
    return this.statistics.getCountries(query);
  }

  @Get(':code/history')
  getCountryHistory(@Param('code') code: string, @Query() query: HistoryQueryDto) {
    return this.history.getHistory(code, query);
  }

  @Get(':code')
  getCountry(@Param('code') code: string) {
    return this.statistics.getCountry(code);
  }
}
