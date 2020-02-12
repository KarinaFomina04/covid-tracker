import { parseOwidCsv } from '../owid-parser';
import { OwidSourceService } from '../owid-source.service';
import { DataSyncService } from './data-sync.service';
import { DatasetStoreService } from './dataset-store.service';

const dataset = parseOwidCsv(
  [
    'iso_code,continent,location,last_updated_date,total_cases,new_cases,total_deaths,new_deaths,population',
    'OWID_WRL,,World,2020-12-30,1000,20,50,1,10000',
    'POL,Europe,Poland,2020-12-30,200,5,10,1,500',
  ].join('\n'),
  'https://example.org/data.csv',
  '2020-12-31T10:00:00.000Z',
);

describe('DataSyncService', () => {
  const fetchDataset = jest.fn();
  const load = jest.fn();
  const save = jest.fn();
  let service: DataSyncService;

  beforeEach(() => {
    jest.clearAllMocks();
    load.mockResolvedValue(null);
    save.mockResolvedValue(undefined);
    fetchDataset.mockResolvedValue(dataset);
    service = new DataSyncService(
      { fetchDataset } as unknown as OwidSourceService,
      { load, save } as unknown as DatasetStoreService,
    );
  });

  afterEach(() => service.onModuleDestroy());

  it('refreshes the dataset and makes it available to API consumers', async () => {
    await service.synchronize();
    expect(await service.getDataset()).toEqual(dataset);
    expect(save).toHaveBeenCalledWith(dataset);
    expect(service.getStatus()).toMatchObject({
      state: 'ready', hasData: true, dataDate: '2020-12-30',
    });
  });

  it('serves new observations even if writing the cache fails', async () => {
    save.mockRejectedValueOnce(new Error('Disk is read-only'));
    await expect(service.synchronize()).resolves.toEqual(dataset);
    expect(await service.getDataset()).toEqual(dataset);
    expect(service.getStatus()).toMatchObject({ state: 'ready', hasData: true });
  });

  it('shares a single download between concurrent requests', async () => {
    let complete!: (value: typeof dataset) => void;
    const request = new Promise<typeof dataset>((resolve) => { complete = resolve; });
    fetchDataset.mockReturnValue(request);
    const first = service.synchronize();
    const second = service.synchronize();
    expect(first).toBe(second);
    complete(dataset);
    await Promise.all([first, second]);
    expect(fetchDataset).toHaveBeenCalledTimes(1);
  });

  it('continues to serve previously loaded statistics after a failed refresh', async () => {
    await service.synchronize();
    fetchDataset.mockRejectedValue(new Error('Network unavailable'));
    await expect(service.synchronize()).rejects.toThrow('Network unavailable');
    expect(await service.getDataset()).toEqual(dataset);
    expect(service.getStatus()).toMatchObject({ state: 'stale', hasData: true });
  });

  it('restores the saved dataset before downloading fresh statistics', async () => {
    load.mockResolvedValue(dataset);
    fetchDataset.mockRejectedValue(new Error('Network unavailable'));
    await service.onModuleInit();
    expect(await service.getDataset()).toEqual(dataset);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('reports an unavailable dataset when the first download fails', async () => {
    fetchDataset.mockRejectedValue(new Error('Source unavailable'));
    await expect(service.getDataset()).rejects.toMatchObject({ status: 503 });
    expect(service.getStatus()).toMatchObject({ state: 'unavailable', hasData: false });
  });
});
