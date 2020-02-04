import { Controller, Get } from '@nestjs/common';
import { DataSyncService } from './data-sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly synchronization: DataSyncService) {}

  @Get('status')
  getStatus() {
    return this.synchronization.getStatus();
  }
}
