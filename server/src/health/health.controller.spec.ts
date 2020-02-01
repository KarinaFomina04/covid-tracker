import { HealthController } from './health.controller';

describe('HealthController', () => {
  const controller = new HealthController();

  it('returns the service status', () => {
    expect(controller.getStatus()).toEqual({
      status: 'ok',
      service: 'covid-tracker-api',
    });
  });
});
