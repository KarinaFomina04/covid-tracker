import { HistoryService } from './history.service';
import { HistorySourceService } from './history-source.service';
import { HistoryStoreService } from './history-store.service';
import { HistoryDataset } from './history.types';

const cached: HistoryDataset = {
  sourceUrl: 'https://example.org/historical.csv',
  fetchedAt: new Date().toISOString(),
  records: {
    OWID_WRL: [{ date: '2020-12-30', totalCases: 100, newCases: 10, totalDeaths: 5, newDeaths: 1 }],
    POL: [{ date: '2020-12-30', totalCases: 50, newCases: 3, totalDeaths: 1, newDeaths: 0 }],
  },
};

describe('HistoryService', () => {
  const fetchDataset = jest.fn();
  const load = jest.fn();
  const save = jest.fn();
  let service: HistoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    load.mockResolvedValue(null);
    save.mockResolvedValue(undefined);
    fetchDataset.mockResolvedValue(cached);
    service = new HistoryService(
      { fetchDataset } as unknown as HistorySourceService,
      { load, save } as unknown as HistoryStoreService,
    );
  });

  it('downloads a dataset once and returns country observations', async () => {
    const world = await service.getHistory('OWID_WRL', { period: 'all' });
    const country = await service.getHistory('pol', { period: 'all' });
    expect(world.points[0].totalCases).toBe(100);
    expect(country.code).toBe('POL');
    expect(fetchDataset).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(cached);
  });

  it('serves new history when persisting the cache fails', async () => {
    save.mockRejectedValueOnce(new Error('Disk is read-only'));
    const result = await service.getHistory('POL', { period: 'all' });
    expect(result.points).toHaveLength(1);
    expect(fetchDataset).toHaveBeenCalledTimes(1);
    expect((await service.getHistory('OWID_WRL', {})).points).toHaveLength(1);
  });

  it('restores a cached dataset without a new download', async () => {
    load.mockResolvedValue(cached);
    expect((await service.getHistory('POL', {})).points).toHaveLength(1);
    expect(fetchDataset).not.toHaveBeenCalled();
  });

  it('returns 404 when the location has no historical records', async () => {
    await expect(service.getHistory('USA', {})).rejects.toMatchObject({ status: 404 });
  });

  it('returns 503 when neither the cache nor the source is available', async () => {
    fetchDataset.mockRejectedValue(new Error('Connection failed'));
    await expect(service.getHistory('POL', {})).rejects.toMatchObject({ status: 503 });
  });
});
