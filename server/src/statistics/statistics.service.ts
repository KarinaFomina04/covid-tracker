import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CountriesQueryDto } from './dto/countries-query.dto';
import { DataSyncService } from './sync/data-sync.service';
import { CountryStatistics, CountrySortField } from './statistics.types';

@Injectable()
export class StatisticsService {
  constructor(private readonly source: DataSyncService) {}

  async getSummary() {
    const data = await this.source.getDataset();
    const { totalCases, totalDeaths } = data.world;

    return {
      ...data.world,
      caseFatalityRatio:
        totalCases !== null && totalCases > 0 && totalDeaths !== null
          ? Math.round((totalDeaths / totalCases) * 10000) / 100
          : null,
      source: 'Our World in Data',
    };
  }

  async getCountries(query: CountriesQueryDto) {
    const data = await this.source.getDataset();
    const search = (query.search || '').trim().toLowerCase();
    const continent = (query.continent || '').trim().toLowerCase();
    const sortBy: CountrySortField = query.sortBy || 'totalCases';
    const order = query.order || 'desc';
    const page = query.page || 1;
    const limit = query.limit || 20;

    const records = data.countries.filter(
      (country) =>
        country.name.toLowerCase().includes(search) &&
        (!continent || (country.continent || '').toLowerCase() === continent),
    );

    records.sort((left, right) => {
      const leftValue = left[sortBy];
      const rightValue = right[sortBy];

      // Missing values always appear after countries with available statistics.
      if (leftValue === null) return rightValue === null ? 0 : 1;
      if (rightValue === null) return -1;

      const comparison =
        typeof leftValue === 'string' && typeof rightValue === 'string'
          ? leftValue.localeCompare(rightValue)
          : (leftValue as number) - (rightValue as number);
      return order === 'asc' ? comparison : -comparison;
    });

    const total = records.length;
    return {
      items: records.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      source: 'Our World in Data',
    };
  }

  async getMap() {
    const data = await this.source.getDataset();
    return {
      date: data.world.date,
      source: 'Our World in Data',
      items: data.countries,
    };
  }

  async getCountry(code: string): Promise<CountryStatistics> {
    const normalizedCode = code.toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalizedCode)) {
      throw new BadRequestException('Country code must contain three letters');
    }

    const data = await this.source.getDataset();
    const country = data.countries.find((item) => item.code === normalizedCode);
    if (!country) {
      throw new NotFoundException('Country not found');
    }

    return country;
  }

  async getMetadata() {
    const data = await this.source.getDataset();
    return {
      source: 'Our World in Data',
      sourceUrl: data.sourceUrl,
      fetchedAt: data.fetchedAt,
      dataDate: data.world.date,
      countriesCount: data.countries.length,
    };
  }
}
