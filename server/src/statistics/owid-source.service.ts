import { Injectable } from '@nestjs/common';
import axios = require('axios');
import { parseOwidCsv } from './owid-parser';
import { StatisticsDataset } from './statistics.types';

const DEFAULT_SOURCE_URL =
  'https://covid.ourworldindata.org/data/latest/owid-covid-latest.csv';

@Injectable()
export class OwidSourceService {
  readonly sourceUrl = process.env.COVID_DATA_URL || DEFAULT_SOURCE_URL;

  async fetchDataset(): Promise<StatisticsDataset> {
    const response = await axios.get<string>(this.sourceUrl, {
      timeout: 15000,
      responseType: 'text',
      maxContentLength: 2 * 1024 * 1024,
    });

    return parseOwidCsv(response.data, this.sourceUrl, new Date().toISOString());
  }
}
