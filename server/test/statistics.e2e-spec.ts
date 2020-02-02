import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { parseOwidCsv } from '../src/statistics/owid-parser';
import { OwidSourceService } from '../src/statistics/owid-source.service';

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
      .overrideProvider(OwidSourceService)
      .useValue({ getDataset: jest.fn().mockResolvedValue(dataset) })
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

  it('GET /api/v1/meta reports the data observation date', () =>
    request(app.getHttpServer())
      .get('/api/v1/meta')
      .expect(200)
      .expect(({ body }) => {
        expect(body.dataDate).toBe('2020-12-30');
      }));
});
