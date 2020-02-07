import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { parseOwidCsv } from '../src/statistics/owid-parser';
import { DataSyncService } from '../src/statistics/sync/data-sync.service';
import { HistoryService } from '../src/statistics/history/history.service';

const csv = [
  'iso_code,continent,location,last_updated_date,total_cases,new_cases,total_deaths,new_deaths,population',
  'OWID_WRL,,World,2020-12-30,1000,20,50,1,10000',
  'USA,North America,United States,2020-12-30,600,10,30,1,1000',
  'POL,Europe,Poland,2020-12-30,200,5,10,0,500',
].join('\n');

const dataset = parseOwidCsv(csv, 'https://example.org/data.csv', '2020-12-31T10:00:00Z');

describe('COVID-19 Statistics API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DataSyncService)
      .useValue({
        getDataset: jest.fn().mockResolvedValue(dataset),
        getStatus: jest.fn().mockReturnValue({
          state: 'ready', hasData: true, fetchedAt: dataset.fetchedAt,
          dataDate: dataset.world.date,
          lastAttemptAt: dataset.fetchedAt, lastSuccessAt: dataset.fetchedAt,
        }),
      })
      .overrideProvider(HistoryService)
      .useValue({
        getHistory: jest.fn().mockImplementation((code: string, query: { period?: string }) => {
          if (code === 'GBR') return Promise.reject({ status: 404 });
          return Promise.resolve({
            code, from: '2020-12-24', to: '2020-12-30', lastObservation: '2020-12-30',
            source: 'Our World in Data', fetchedAt: dataset.fetchedAt,
            period: query.period,
            points: [{ date: '2020-12-30', totalCases: 1000, newCases: 20, totalDeaths: 50, newDeaths: 1, newCasesAverage: 15, newDeathsAverage: 1 }],
          });
        }),
      })
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/summary', () =>
    request(app.getHttpServer())
      .get('/api/v1/summary')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ code: 'OWID_WRL', totalCases: 1000 });
      }));

  it('GET /api/v1/map returns all available country observations', () =>
    request(app.getHttpServer())
      .get('/api/v1/map')
      .expect(200)
      .expect(({ body }) => {
        expect(body.date).toBe('2020-12-30');
        expect(body.items).toHaveLength(2);
        expect(body.items.map((country: { code: string }) => country.code)).toEqual(['USA', 'POL']);
      }));

  it('GET /api/v1/countries supports search and pagination', () =>
    request(app.getHttpServer())
      .get('/api/v1/countries?search=pol&limit=1')
      .expect(200)
      .expect(({ body }) => {
        expect(body.total).toBe(1);
        expect(body.items[0].code).toBe('POL');
      }));

  it('GET /api/v1/countries rejects invalid pagination', () =>
    request(app.getHttpServer()).get('/api/v1/countries?limit=101').expect(400));

  it('GET /api/v1/countries/:code', () =>
    request(app.getHttpServer())
      .get('/api/v1/countries/USA')
      .expect(200)
      .expect(({ body }) => {
        expect(body.name).toBe('United States');
      }));

  it('GET /api/v1/countries/:code returns 404 for unknown country', () =>
    request(app.getHttpServer()).get('/api/v1/countries/GBR').expect(404));

  it('GET /api/v1/summary/history returns world time series', () =>
    request(app.getHttpServer()).get('/api/v1/summary/history?period=7d').expect(200)
      .expect(({ body }) => {
        expect(body.code).toBe('OWID_WRL');
        expect(body.points).toHaveLength(1);
      }));

  it('GET /api/v1/countries/:code/history returns country time series', () =>
    request(app.getHttpServer()).get('/api/v1/countries/POL/history?period=30d').expect(200)
      .expect(({ body }) => { expect(body.code).toBe('POL'); }));

  it('GET /api/v1/countries/:code/history rejects invalid periods', () =>
    request(app.getHttpServer()).get('/api/v1/countries/POL/history?period=100d').expect(400));

  it('GET /api/v1/sync/status reports the last successful update', () =>
    request(app.getHttpServer())
      .get('/api/v1/sync/status')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ state: 'ready', hasData: true });
      }));

  it('GET /api/v1/meta reports the data observation date', () =>
    request(app.getHttpServer())
      .get('/api/v1/meta')
      .expect(200)
      .expect(({ body }) => {
        expect(body.dataDate).toBe('2020-12-30');
      }));
});
