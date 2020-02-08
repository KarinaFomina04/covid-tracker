import { BadRequestException, Injectable } from '@nestjs/common';
import { HistoryService } from '../history/history.service';
import { StatisticsService } from '../statistics.service';
import { CompareQueryDto } from './dto/compare-query.dto';
import { alignedValues, comparisonDates, parseComparisonCodes } from './compare-utils';
import { CompareResponse } from './compare.types';

@Injectable()
export class CompareService {
  constructor(
    private readonly history: HistoryService,
    private readonly statistics: StatisticsService,
  ) {}

  async getComparison(query: CompareQueryDto): Promise<CompareResponse> {
    const codes = parseComparisonCodes(query.codes);
    if (query.period && (query.from || query.to)) {
      throw new BadRequestException('Period cannot be combined with from or to');
    }
    const metric = query.metric || 'totalCases';
    const scale = query.scale || 'absolute';
    const histories = await Promise.all(codes.map((code) => this.history.getHistory(code, { period: 'all' })));
    const dates = comparisonDates(histories, query);
    const profiles = await Promise.all(codes.map((code) => this.statistics.getCountry(code)));

    const countries = profiles.map((profile, index) => {
      const values = alignedValues(histories[index], dates, metric, scale, profile.population);
      let lastIndex = values.length - 1;
      while (lastIndex >= 0 && values[lastIndex] === null) lastIndex -= 1;
      return {
        code: profile.code,
        name: profile.name,
        population: profile.population,
        values,
        lastValue: lastIndex >= 0 ? values[lastIndex] : null,
        lastValueDate: lastIndex >= 0 ? dates[lastIndex] : null,
      };
    });

    return {
      from: dates[0],
      to: dates[dates.length - 1],
      lastObservation: dates[dates.length - 1],
      dates,
      metric,
      scale,
      countries,
      source: 'Our World in Data',
      fetchedAt: histories[0].fetchedAt,
    };
  }
}
