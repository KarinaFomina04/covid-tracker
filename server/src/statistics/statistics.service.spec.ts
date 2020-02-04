import { BadRequestException, NotFoundException } from '@nestjs/common';
import { parseOwidCsv } from './owid-parser';
import { DataSyncService } from './sync/data-sync.service';
import { StatisticsService } from './statistics.service';

const csv = [
  'iso_code,continent,location,last_updated_date,total_cases,new_cases,total_deaths,new_deaths,population',
  'OWID_WRL,,World,2020-12-30,1000,20,50,1,10000',
  'USA,North America,United States,2020-12-30,600,10,30,1,1000',
  'POL,Europe,Poland,2020-12-30,200,,10,-2,500',
].join('\n');

const dataset = parseOwidCsv(csv, 'https://example.org/data.csv', '2020-12-31T10:00:00Z');
const source = {
  getDataset: jest.fn().mockResolvedValue(dataset),
} as unknown as DataSyncService;

const statistics = new StatisticsService(source);

describe('StatisticsService', () => {
  it('returns global statistics and the case fatality ratio', async () => {
    expect(await statistics.getSummary()).toMatchObject({
      code: 'OWID_WRL',
      totalCases: 1000,
      totalDeaths: 50,
      caseFatalityRatio: 5,
    });
  });

  it('filters, sorts and paginates countries', async () => {
    const result = await statistics.getCountries({
      continent: 'europe',
      sortBy: 'totalCases',
      order: 'desc',
      limit: 1,
      page: 1,
    });

    expect(result.total).toBe(1);
    expect(result.items.map((item) => item.code)).toEqual(['POL']);
  });

  it('looks up country codes without case sensitivity', async () => {
    expect((await statistics.getCountry('usa')).name).toBe('United States');
  });

  it('returns appropriate errors for invalid and unknown codes', async () => {
    await expect(statistics.getCountry('US')).rejects.toBeInstanceOf(BadRequestException);
    await expect(statistics.getCountry('CAN')).rejects.toBeInstanceOf(NotFoundException);
  });
});
