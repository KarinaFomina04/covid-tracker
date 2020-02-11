import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';
import { CountryStatistics, StatisticsDataset } from '../statistics.types';

interface StoredDataset {
  version: 1;
  dataset: StatisticsDataset;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isCountry(value: unknown): value is CountryStatistics {
  if (!isRecord(value)) return false;
  const numericFields = [
    'population', 'totalCases', 'newCases', 'totalDeaths', 'newDeaths',
    'casesPerMillion', 'deathsPerMillion',
  ];
  const optionalNumericFields = ['totalTests', 'newTests', 'testsPerThousand', 'positiveRate'];
  return (
    typeof value.code === 'string' &&
    typeof value.name === 'string' &&
    typeof value.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    (value.continent === null || typeof value.continent === 'string') &&
    numericFields.every((key) => {
      const number = value[key];
      return number === null || (typeof number === 'number' && Number.isFinite(number));
    }) &&
    optionalNumericFields.every((key) => {
      const number = value[key];
      return number === undefined || number === null ||
        (typeof number === 'number' && Number.isFinite(number));
    }) &&
    (value.positiveRate === undefined || value.positiveRate === null ||
      (typeof value.positiveRate === 'number' && value.positiveRate >= 0 && value.positiveRate <= 1))
  );
}

function isStoredDataset(value: unknown): value is StoredDataset {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.dataset)) return false;
  const data = value.dataset;
  return (
    typeof data.sourceUrl === 'string' &&
    typeof data.fetchedAt === 'string' &&
    !Number.isNaN(Date.parse(data.fetchedAt)) &&
    isCountry(data.world) &&
    data.world.code === 'OWID_WRL' &&
    Array.isArray(data.countries) &&
    data.countries.length > 0 &&
    data.countries.every(isCountry)
  );
}

@Injectable()
export class DatasetStoreService {
  private readonly filePath = resolve(
    process.env.COVID_DATA_CACHE_FILE || 'data/owid-statistics.json',
  );

  async load(): Promise<StatisticsDataset | null> {
    let content: string;
    try {
      content = await fs.readFile(this.filePath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }

    const parsed: unknown = JSON.parse(content);
    if (!isStoredDataset(parsed)) {
      throw new Error('Saved statistics have an unexpected format');
    }
    return parsed.dataset;
  }

  async save(dataset: StatisticsDataset): Promise<void> {
    const temporaryFile = `${this.filePath}.${process.pid}.tmp`;
    const payload: StoredDataset = { version: 1, dataset };
    await fs.mkdir(dirname(this.filePath), { recursive: true });
    try {
      await fs.writeFile(temporaryFile, JSON.stringify(payload), 'utf8');
      await fs.rename(temporaryFile, this.filePath);
    } catch (error) {
      await fs.unlink(temporaryFile).catch(() => undefined);
      throw error;
    }
  }
}
