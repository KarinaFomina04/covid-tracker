import { CompareService } from './compare.service';
import { HistoryService } from '../history/history.service';
import { StatisticsService } from '../statistics.service';

function observation(date: string, newCases: number | null) {
  return {
    date, totalCases: newCases, newCases,
    totalDeaths: 1, newDeaths: 0,
    newCasesAverage: newCases, newDeathsAverage: 0,
  };
}

describe('CompareService', () => {
  const getHistory = jest.fn();
  const getCountry = jest.fn();
  let service: CompareService;

  beforeEach(() => {
    jest.clearAllMocks();
    getHistory.mockImplementation((code: string) => Promise.resolve({
      code, from: '2020-12-29', to: code === 'POL' ? '2020-12-30' : '2020-12-31',
      lastObservation: '2020-12-31', fetchedAt: '2020-12-31T12:00:00Z',
      source: 'Our World in Data',
      points: [observation('2020-12-29', 100), observation('2020-12-30', code === 'POL' ? null : 200),
        ...(code === 'USA' ? [observation('2020-12-31', 300)] : [])],
    }));
    getCountry.mockImplementation((code: string) => Promise.resolve({
      code, name: code === 'POL' ? 'Poland' : 'United States', population: code === 'POL' ? 1000 : 2000,
    }));
    service = new CompareService(
      { getHistory } as unknown as HistoryService,
      { getCountry } as unknown as StatisticsService,
    );
  });

  it('returns aligned, normalized country series and last known values', async () => {
    const result = await service.getComparison({
      codes: 'POL,USA', period: '30d', metric: 'newCases', scale: 'perMillion',
    });
    expect(result.dates).toEqual(['2020-12-29', '2020-12-30']);
    expect(result.countries).toEqual([
      expect.objectContaining({ code: 'POL', values: [100000, null], lastValueDate: '2020-12-29' }),
      expect.objectContaining({ code: 'USA', values: [50000, 100000], lastValueDate: '2020-12-30' }),
    ]);
    expect(getHistory).toHaveBeenCalledTimes(2);
    expect(getCountry).toHaveBeenCalledTimes(2);
  });

  it('rejects a duplicate country before requesting data', async () => {
    await expect(service.getComparison({ codes: 'USA,usa' })).rejects.toMatchObject({ status: 400 });
    expect(getHistory).not.toHaveBeenCalled();
  });
});
