import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { parseOwidCsv } from '../owid-parser';
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

describe('DatasetStoreService', () => {
  let directory: string;
  let previousPath: string | undefined;

  beforeEach(async () => {
    previousPath = process.env.COVID_DATA_CACHE_FILE;
    directory = await fs.mkdtemp(join(tmpdir(), 'covid-statistics-'));
    process.env.COVID_DATA_CACHE_FILE = join(directory, 'data', 'dataset.json');
  });

  afterEach(async () => {
    if (previousPath === undefined) delete process.env.COVID_DATA_CACHE_FILE;
    else process.env.COVID_DATA_CACHE_FILE = previousPath;
    await fs.rmdir(join(directory, 'data'), { recursive: true }).catch(() => undefined);
    await fs.rmdir(directory, { recursive: true }).catch(() => undefined);
  });

  it('loads an atomically persisted dataset', async () => {
    const store = new DatasetStoreService();
    expect(await store.load()).toBeNull();

    await store.save(dataset);
    expect(await store.load()).toEqual(dataset);
    expect(await fs.readdir(join(directory, 'data'))).toEqual(['dataset.json']);
  });

  it('rejects invalid or incomplete snapshots', async () => {
    const store = new DatasetStoreService();
    await fs.mkdir(join(directory, 'data'));
    await fs.writeFile(join(directory, 'data', 'dataset.json'), '{"version":1,"dataset":{}}');
    await expect(store.load()).rejects.toThrow('unexpected format');
  });
});
