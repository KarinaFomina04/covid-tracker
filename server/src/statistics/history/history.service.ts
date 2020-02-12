import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HistoryQueryDto } from './dto/history-query.dto';
import { HistorySourceService } from './history-source.service';
import { HistoryStoreService } from './history-store.service';
import { HistoryDataset, HistoryResponse } from './history.types';
import { isValidDate, selectHistory } from './history-utils';

const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000;
const RETRY_AFTER_MS = 5 * 60 * 1000;

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);
  private dataset: HistoryDataset | null = null;
  private initialLoad: Promise<void> | null = null;
  private pending: Promise<HistoryDataset> | null = null;
  private lastAttemptAt = 0;

  constructor(
    private readonly source: HistorySourceService,
    private readonly store: HistoryStoreService,
  ) {}

  async getHistory(code: string, query: HistoryQueryDto): Promise<HistoryResponse> {
    const normalized = code.toUpperCase();
    if (normalized !== 'OWID_WRL' && !/^[A-Z]{3}$/.test(normalized)) {
      throw new BadRequestException('Country code must contain three letters');
    }
    if ((query.from && !isValidDate(query.from)) || (query.to && !isValidDate(query.to))) {
      throw new BadRequestException('Dates must use the YYYY-MM-DD format');
    }
    if (query.period && (query.from || query.to)) {
      throw new BadRequestException('Period cannot be combined with from or to');
    }
    const data = await this.getDataset();
    const observations = data.records[normalized];
    if (!observations || observations.length === 0) {
      throw new NotFoundException('Historical statistics are not available for this location');
    }
    const selected = selectHistory(observations, query);
    return {
      code: normalized,
      ...selected,
      source: 'Our World in Data',
      fetchedAt: data.fetchedAt,
    };
  }

  private async getDataset(): Promise<HistoryDataset> {
    if (!this.initialLoad) {
      this.initialLoad = this.store.load()
        .then((saved) => { this.dataset = saved; })
        .catch(() => { this.logger.warn('Unable to restore historical statistics'); });
    }
    await this.initialLoad;

    if (this.dataset) {
      const age = Date.now() - Date.parse(this.dataset.fetchedAt);
      if (age >= REFRESH_AFTER_MS && Date.now() - this.lastAttemptAt >= RETRY_AFTER_MS) {
        void this.refresh().catch(() => undefined);
      }
      return this.dataset;
    }
    if (this.pending) {
      try { return await this.pending; }
      catch (error) { throw new ServiceUnavailableException('Historical statistics unavailable'); }
    }
    if (Date.now() - this.lastAttemptAt < RETRY_AFTER_MS) {
      throw new ServiceUnavailableException('Historical statistics unavailable');
    }
    try { return await this.refresh(); }
    catch (error) { throw new ServiceUnavailableException('Historical statistics unavailable'); }
  }

  private refresh(): Promise<HistoryDataset> {
    if (this.pending) return this.pending;
    this.lastAttemptAt = Date.now();
    const operation = this.source.fetchDataset().then(async (data) => {
      this.dataset = data;
      try {
        await this.store.save(data);
      } catch (error) {
        this.logger.warn('Historical statistics updated but could not be saved to disk');
      }
      this.logger.log('Historical statistics synchronized');
      return data;
    });
    this.pending = operation;
    void operation.then(
      () => { this.pending = null; },
      () => { this.pending = null; this.logger.warn('Unable to update historical statistics'); },
    );
    return operation;
  }
}
