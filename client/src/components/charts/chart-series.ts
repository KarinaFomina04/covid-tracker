import { HistoryPoint } from '../../api/statistics';

export type ChartMetric = 'cases' | 'deaths';
export type ChartMode = 'daily' | 'total';

export interface SeriesOptions {
  metric: ChartMetric;
  mode: ChartMode;
  perMillion: boolean;
  average: boolean;
  population: number | null;
}

export interface ChartSeries {
  dates: string[];
  values: Array<number | null>;
  label: string;
  hasValues: boolean;
}

export function buildChartSeries(points: HistoryPoint[], options: SeriesOptions): ChartSeries {
  const field = options.metric === 'cases'
    ? options.mode === 'total' ? 'totalCases' : options.average ? 'newCasesAverage' : 'newCases'
    : options.mode === 'total' ? 'totalDeaths' : options.average ? 'newDeathsAverage' : 'newDeaths';

  const values = points.map((point) => {
    const value = point[field];
    if (value === null) return null;
    if (!options.perMillion) return value;
    if (options.population === null || options.population <= 0) return null;
    return Math.round((value / options.population) * 1000000 * 100) / 100;
  });

  const label = [
    options.mode === 'total' ? 'Total' : options.average ? '7-day average' : 'Daily',
    options.metric === 'cases' ? 'confirmed cases' : 'reported deaths',
    options.perMillion ? 'per million' : '',
  ].filter(Boolean).join(' ');

  return {
    dates: points.map((point) => point.date),
    values,
    label,
    hasValues: values.some((value) => value !== null),
  };
}
