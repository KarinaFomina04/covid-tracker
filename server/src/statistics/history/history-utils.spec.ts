import { parseHistoryRow, selectHistory, withMovingAverages } from './history-utils';
import { HistoryPoint } from './history.types';

function point(day: number, cases: number | null): HistoryPoint {
  return {
    date: `2020-12-${String(day).padStart(2, '0')}`,
    totalCases: day * 10,
    newCases: cases,
    totalDeaths: day,
    newDeaths: 1,
  };
}

describe('Historical statistics calculations', () => {
  it('preserves missing values and negative source corrections', () => {
    expect(parseHistoryRow({ date: '2020-12-02', new_cases: '-4', total_cases: '' }))
      .toMatchObject({ newCases: -4, totalCases: null });
    expect(parseHistoryRow({ date: '2020-02-30' })).toBeNull();
  });

  it('calculates seven-day averages only for complete consecutive observations', () => {
    const series = Array.from({ length: 8 }, (_, index) => point(index + 1, index + 1));
    const result = withMovingAverages(series);
    expect(result[5].newCasesAverage).toBeNull();
    expect(result[6].newCasesAverage).toBe(4);
    expect(result[7].newCasesAverage).toBe(5);
    series[2].newCases = null;
    expect(withMovingAverages(series)[7].newCasesAverage).toBeNull();
    series[2].newCases = 3;
    series[2].date = '2020-11-30';
    expect(withMovingAverages(series)[6].newCasesAverage).toBeNull();
  });

  it('anchors period selection to the latest observation, not system time', () => {
    const series = Array.from({ length: 31 }, (_, index) => point(index + 1, 2));
    const selected = selectHistory(series, { period: '7d' });
    expect(selected.from).toBe('2020-12-25');
    expect(selected.to).toBe('2020-12-31');
    expect(selected.points).toHaveLength(7);
  });

  it('reuses prepared observations for different ranges of one dataset', () => {
    const series = Array.from({ length: 31 }, (_, index) => point(index + 1, 3));
    const full = selectHistory(series, { period: 'all' });
    const lastWeek = selectHistory(series, { period: '7d' });
    expect(lastWeek.points.map((item) => item.date)).toEqual(full.points.slice(-7).map((item) => item.date));
    expect(lastWeek.points[0]).toBe(full.points[24]);
    expect(lastWeek.points[0].newCasesAverage).toBe(3);
  });

  it('selects an inclusive range without introducing missing dates', () => {
    const series = [point(1, 1), point(3, 2), point(5, 3), point(8, 4)];
    expect(selectHistory(series, { from: '2020-12-02', to: '2020-12-05' })
      .points.map((item) => item.date)).toEqual(['2020-12-03', '2020-12-05']);
    expect(selectHistory(series, { from: '2020-12-06', to: '2020-12-07' }).points).toEqual([]);
  });

  it('rejects invalid or inverted ranges', () => {
    const series = [point(1, 5), point(2, 3)];
    expect(() => selectHistory(series, { from: '2020-02-30' })).toThrow();
    expect(() => selectHistory(series, { from: '2020-12-03', to: '2020-12-01' })).toThrow();
    expect(() => selectHistory(series, { period: '7d', from: '2020-12-01' })).toThrow();
  });
});
