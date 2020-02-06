import { Injectable } from '@nestjs/common';
import axios = require('axios');
import parse = require('csv-parse');
import { Readable } from 'stream';
import { HistoryDataset, HistoryPoint } from './history.types';
import { parseHistoryRow } from './history-utils';

const DEFAULT_URL = 'https://covid.ourworldindata.org/data/owid-covid-data.csv';
const MAX_SOURCE_BYTES = 160 * 1024 * 1024;
const REQUIRED_COLUMNS = ['iso_code', 'date', 'total_cases', 'new_cases', 'total_deaths', 'new_deaths'];

@Injectable()
export class HistorySourceService {
  readonly sourceUrl = process.env.COVID_HISTORY_URL || DEFAULT_URL;

  async fetchDataset(): Promise<HistoryDataset> {
    const response = await axios.get<Readable>(this.sourceUrl, {
      responseType: 'stream',
      timeout: 120000,
      maxRedirects: 5,
    });
    const source = response.data;
    const size = Number(response.headers['content-length']);
    if (Number.isFinite(size) && size > MAX_SOURCE_BYTES) {
      source.destroy();
      throw new Error('Historical statistics file is too large');
    }

    const parser = parse({ columns: true, bom: true, skip_empty_lines: true });
    const records: Record<string, HistoryPoint[]> = Object.create(null);
    let receivedBytes = 0;
    let hasValidHeader = false;

    source.on('data', (chunk: Buffer) => {
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_SOURCE_BYTES) {
        source.destroy(new Error('Historical statistics file is too large'));
      }
    });
    source.on('error', (error) => parser.destroy(error));
    source.pipe(parser);

    try {
      for await (const value of parser) {
        const row = value as Record<string, string>;
        if (!hasValidHeader) {
          if (REQUIRED_COLUMNS.some((field) => !(field in row))) {
            throw new Error('Historical statistics source has an unexpected format');
          }
          hasValidHeader = true;
        }
        const code = row.iso_code;
        if (code !== 'OWID_WRL' && !(/^[A-Z]{3}$/.test(code) && row.continent)) {
          continue;
        }
        const point = parseHistoryRow(row);
        if (!point) continue;
        if (!records[code]) records[code] = [];
        records[code].push(point);
      }
    } finally {
      source.destroy();
      parser.destroy();
    }

    if (!records.OWID_WRL || !Object.keys(records).some((code) => code !== 'OWID_WRL')) {
      throw new Error('Historical statistics source has no usable observations');
    }

    for (const code of Object.keys(records)) {
      const sorted = records[code].sort((left, right) => left.date.localeCompare(right.date));
      records[code] = sorted.filter((point, index) =>
        index === sorted.length - 1 || point.date !== sorted[index + 1].date,
      );
    }

    return { records, sourceUrl: this.sourceUrl, fetchedAt: new Date().toISOString() };
  }
}
