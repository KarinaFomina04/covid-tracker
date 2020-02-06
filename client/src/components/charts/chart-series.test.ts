import { HistoryPoint } from '../../api/statistics';
import { buildChartSeries } from './chart-series';

const points: HistoryPoint[] = [
  { date: '2020-12-01', totalCases: 200, newCases: -4, totalDeaths: 10, newDeaths: 1, newCasesAverage: null, newDeathsAverage: null },
  { date: '2020-12-02', totalCases: 210, newCases: null, totalDeaths: 12, newDeaths: 2, newCasesAverage: 5, newDeathsAverage: 2 },
];

test('builds absolute series without replacing missing values with zero', () => {
  const result = buildChartSeries(points, { metric: 'cases', mode: 'daily', perMillion: false, average: false, population: null });
  expect(result.values).toEqual([-4, null]);
  expect(result.hasValues).toBe(true);
});

test('uses the smoothed series and normalizes by population', () => {
  const result = buildChartSeries(points, { metric: 'deaths', mode: 'daily', perMillion: true, average: true, population: 1000000 });
  expect(result.values).toEqual([null, 2]);
});

test('returns unavailable observations for missing population', () => {
  const result = buildChartSeries(points, { metric: 'cases', mode: 'total', perMillion: true, average: false, population: null });
  expect(result.values).toEqual([null, null]);
  expect(result.hasValues).toBe(false);
});
