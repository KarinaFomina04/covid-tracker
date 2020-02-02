import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios = require('axios');
import { parseOwidCsv } from './owid-parser';
import { StatisticsDataset } from './statistics.types';

const DEFAULT_SOURCE_URL =
  'https://covid.ourworldindata.org/data/latest/owid-covid-latest.csv';
const CACHE_DURATION_MS = 60 * 60 * 1000;
const RETRY_DELAY_MS = 60 * 1000;

@Injectable()
export class OwidSourceService {
  private readonly logger = new Logger(OwidSourceService.name);
  private readonly sourceUrl = process.env.COVID_DATA_URL || DEFAULT_SOURCE_URL;
  private cache: StatisticsDataset | null = null;
  private lastFetchTime = 0;
  private nextRetryTime = 0;
  private pendingRequest: Promise<StatisticsDataset> | null = null;

  async getDataset(): Promise<StatisticsDataset> {
    const now = Date.now();

    if (this.cache && now - this.lastFetchTime < CACHE_DURATION_MS) {
      return this.cache;
    }

    if (!this.pendingRequest && now >= this.nextRetryTime) {
      this.pendingRequest = this.fetchDataset();
    }

    if (this.pendingRequest) {
      try {
        return await this.pendingRequest;
      } catch (error) {
        this.nextRetryTime = Date.now() + RETRY_DELAY_MS;
        this.logger.warn('Unable to refresh COVID-19 statistics');
      } finally {
        this.pendingRequest = null;
      }
    }

    if (this.cache) {
      return this.cache;
    }

    throw new ServiceUnavailableException('COVID-19 statistics are temporarily unavailable');
  }

  private async fetchDataset(): Promise<StatisticsDataset> {
    const response = await axios.get<string>(this.sourceUrl, {
      timeout: 15000,
      responseType: 'text',
      maxContentLength: 2 * 1024 * 1024,
    });

    const dataset = parseOwidCsv(response.data, this.sourceUrl, new Date().toISOString());
    this.cache = dataset;
    this.lastFetchTime = Date.now();
    this.nextRetryTime = 0;
    return dataset;
  }
}
