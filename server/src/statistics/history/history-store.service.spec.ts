import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { HistoryStoreService } from './history-store.service';
import { HistoryDataset } from './history.types';

const dataset: HistoryDataset = {
  sourceUrl: 'https://example.org/history.csv', fetchedAt: '2020-12-31T10:00:00Z',
  records: {
    OWID_WRL: [{ date: '2020-12-30', totalCases: 100, newCases: 5, totalDeaths: 10, newDeaths: 1 }],
    POL: [{ date: '2020-12-30', totalCases: 20, newCases: 2, totalDeaths: 1, newDeaths: 0 }],
  },
};

describe('HistoryStoreService', () => {
  let directory: string;
  let previous: string | undefined;

  beforeEach(async () => {
    previous = process.env.COVID_HISTORY_CACHE_FILE;
    directory = await fs.mkdtemp(join(tmpdir(), 'covid-history-'));
    process.env.COVID_HISTORY_CACHE_FILE = join(directory, 'data', 'history.json.gz');
  });

  afterEach(async () => {
    if (previous === undefined) delete process.env.COVID_HISTORY_CACHE_FILE;
    else process.env.COVID_HISTORY_CACHE_FILE = previous;
    await fs.rmdir(join(directory, 'data'), { recursive: true }).catch(() => undefined);
    await fs.rmdir(directory, { recursive: true }).catch(() => undefined);
  });

  it('persists a compressed snapshot and restores it after restart', async () => {
    const store = new HistoryStoreService();
    expect(await store.load()).toBeNull();
    await store.save(dataset);
    expect(await store.load()).toEqual(dataset);
    expect(await fs.readdir(join(directory, 'data'))).toEqual(['history.json.gz']);
  });

  it('rejects corrupted data', async () => {
    const store = new HistoryStoreService();
    await fs.mkdir(join(directory, 'data'));
    await fs.writeFile(join(directory, 'data', 'history.json.gz'), 'invalid data');
    await expect(store.load()).rejects.toThrow();
  });
});
