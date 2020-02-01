import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getStatus(): { status: string; service: string } {
    return {
      status: 'ok',
      service: 'covid-tracker-api',
    };
  }
}
