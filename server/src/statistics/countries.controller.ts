import { Controller, Get, Param, Query } from '@nestjs/common';
import { CountriesQueryDto } from './dto/countries-query.dto';
import { StatisticsService } from './statistics.service';

@Controller('countries')
export class CountriesController {
  constructor(private readonly statistics: StatisticsService) {}

  @Get()
  getCountries(@Query() query: CountriesQueryDto) {
    return this.statistics.getCountries(query);
  }

  @Get(':code')
  getCountry(@Param('code') code: string) {
    return this.statistics.getCountry(code);
  }
}
