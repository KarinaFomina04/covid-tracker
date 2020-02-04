import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { OwidSourceService } from '../owid-source.service';
import { StatisticsDataset } from '../statistics.types';
import { DatasetStoreService } from './dataset-store.service';

const MINUTE_MS = 60 * 1000;

function intervalFromEnvironment(name: string, fallbackMinutes: number): number {
  const value = Number(process.env[name]);
  if (!Number.isInteger(value) || value < 1 || value > 1440) {
    return fallbackMinutes * MINUTE_MS;
  }
  return value * MINUTE_MS;
}

@Injectable()
export class DataSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DataSyncService.name);
  private readonly intervalMs = intervalFromEnvironment('COVID_SYNC_INTERVAL_MINUTES', 60);
  private readonly retryMs = intervalFromEnvironment('COVID_SYNC_RETRY_MINUTES', 5);
  private dataset: StatisticsDataset | null = null;
  private pending: Promise<StatisticsDataset> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private retryTimer: NodeJS.Timeout | null = null;
  private lastAttemptAt: string | null = null;
  private lastSuccessAt: string | null = null;
  private failed = false;
  private nextRetryAt = 0;
  private stopped = false;

  constructor(
    private readonly source: OwidSourceService,
    private readonly store: DatasetStoreService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      this.dataset = await this.store.load();
      if (this.dataset) this.lastSuccessAt = this.dataset.fetchedAt;
    } catch (error) {
      this.logger.warn('Unable to read saved statistics');
    }

    this.refreshTimer = setInterval(() => {
      void this.synchronize().catch(() => undefined);
    }, this.intervalMs);
    this.refreshTimer.unref();

    void this.synchronize().catch(() => undefined);
  }

  onModuleDestroy(): void {
    this.stopped = true;
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  async getDataset(): Promise<StatisticsDataset> {
    if (this.dataset) return this.dataset;

    if (this.pending) {
      try {
        return await this.pending;
      } catch (error) {
        throw new ServiceUnavailableException('COVID-19 statistics are temporarily unavailable');
      }
    }

    if (Date.now() < this.nextRetryAt) {
      throw new ServiceUnavailableException('COVID-19 statistics are temporarily unavailable');
    }

    try {
      return await this.synchronize();
    } catch (error) {
      throw new ServiceUnavailableException('COVID-19 statistics are temporarily unavailable');
    }
  }

  synchronize(): Promise<StatisticsDataset> {
    if (this.pending) return this.pending;

    const operation = this.refresh();
    this.pending = operation;
    void operation.then(
      () => { this.pending = null; },
      () => { this.pending = null; },
    );
    return operation;
  }

  getStatus() {
    return {
      state: this.pending
        ? 'synchronizing'
        : !this.dataset
        ? 'unavailable'
        : this.failed
        ? 'stale'
        : 'ready',
      hasData: this.dataset !== null,
      fetchedAt: this.dataset ? this.dataset.fetchedAt : null,
      dataDate: this.dataset ? this.dataset.world.date : null,
      lastAttemptAt: this.lastAttemptAt,
      lastSuccessAt: this.lastSuccessAt,
    };
  }

  private async refresh(): Promise<StatisticsDataset> {
    this.lastAttemptAt = new Date().toISOString();
    try {
      const updated = await this.source.fetchDataset();
      await this.store.save(updated);
      this.dataset = updated;
      this.lastSuccessAt = updated.fetchedAt;
      this.failed = false;
      this.nextRetryAt = 0;
      if (this.retryTimer) clearTimeout(this.retryTimer);
      this.retryTimer = null;
      this.logger.log(`Statistics updated: ${updated.countries.length} countries`);
      return updated;
    } catch (error) {
      this.failed = true;
      this.nextRetryAt = Date.now() + this.retryMs;
      this.logger.warn('Unable to synchronize COVID-19 statistics');
      if (!this.stopped && !this.retryTimer) {
        this.retryTimer = setTimeout(() => {
          this.retryTimer = null;
          void this.synchronize().catch(() => undefined);
        }, this.retryMs);
        this.retryTimer.unref();
      }
      throw error;
    }
  }
}
