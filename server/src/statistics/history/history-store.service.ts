import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';
import { promisify } from 'util';
import { gzip, gunzip } from 'zlib';
import { HistoryDataset } from './history.types';
import { isValidDate } from './history-utils';

const compress = promisify(gzip);
const decompress = promisify(gunzip);

function isHistoryDataset(value: unknown): value is HistoryDataset {
  if (!value || typeof value !== 'object') return false;
  const dataset = value as HistoryDataset;
  if (typeof dataset.sourceUrl !== 'string' ||
      typeof dataset.fetchedAt !== 'string' ||
      Number.isNaN(Date.parse(dataset.fetchedAt)) ||
      !dataset.records || typeof dataset.records !== 'object' ||
      Array.isArray(dataset.records)) return false;

  const world = dataset.records.OWID_WRL;
  if (!Array.isArray(world) || world.length === 0) return false;
  return Object.keys(dataset.records).every((code) => {
    const observations = dataset.records[code];
    return Array.isArray(observations) && observations.every((point) =>
      point && isValidDate(point.date) &&
      ['totalCases', 'newCases', 'totalDeaths', 'newDeaths'].every((key) => {
        const value = (point as unknown as Record<string, unknown>)[key];
        return value === null || (typeof value === 'number' && Number.isFinite(value));
      }),
    );
  });
}

@Injectable()
export class HistoryStoreService {
  private readonly path = resolve(
    process.env.COVID_HISTORY_CACHE_FILE || 'data/owid-history.json.gz',
  );

  async load(): Promise<HistoryDataset | null> {
    let bytes: Buffer;
    try {
      bytes = await fs.readFile(this.path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
    const raw: unknown = JSON.parse((await decompress(bytes)).toString('utf8'));
    if (!raw || typeof raw !== 'object' || (raw as { version?: number }).version !== 1 ||
        !isHistoryDataset((raw as { dataset?: unknown }).dataset)) {
      throw new Error('Historical statistics cache has an unexpected format');
    }
    return (raw as { dataset: HistoryDataset }).dataset;
  }

  async save(dataset: HistoryDataset): Promise<void> {
    const temporary = `${this.path}.${process.pid}.tmp`;
    const bytes = await compress(Buffer.from(JSON.stringify({ version: 1, dataset })));
    await fs.mkdir(dirname(this.path), { recursive: true });
    try {
      await fs.writeFile(temporary, bytes);
      await fs.rename(temporary, this.path);
    } catch (error) {
      await fs.unlink(temporary).catch(() => undefined);
      throw error;
    }
  }
}
