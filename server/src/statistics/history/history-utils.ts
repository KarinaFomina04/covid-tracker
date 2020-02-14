import { BadRequestException } from '@nestjs/common';
import { HistoryObservation, HistoryPeriod, HistoryPoint } from './history.types';

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function asNumber(value: string | undefined): number | null {
  if (!value || !value.trim()) return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

export function parseHistoryRow(row: Record<string, string>): HistoryPoint | null {
  if (!isValidDate(row.date || '')) return null;
  return {
    date: row.date,
    totalCases: asNumber(row.total_cases),
    newCases: asNumber(row.new_cases),
    totalDeaths: asNumber(row.total_deaths),
    newDeaths: asNumber(row.new_deaths),
  };
}

function daysBefore(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

function meanForWindow(
  points: HistoryPoint[],
  index: number,
  field: 'newCases' | 'newDeaths',
): number | null {
  if (index < 6) return null;
  const window = points.slice(index - 6, index + 1);
  let sum = 0;
  for (let offset = 0; offset < window.length; offset += 1) {
    if (window[offset].date !== daysBefore(points[index].date, 6 - offset)) return null;
    const value = window[offset][field];
    if (value === null) return null;
    sum += value;
  }
  return Math.round((sum / 7) * 100) / 100;
}

export function withMovingAverages(points: HistoryPoint[]): HistoryObservation[] {
  return points.map((point, index) => ({
    ...point,
    newCasesAverage: meanForWindow(points, index, 'newCases'),
    newDeathsAverage: meanForWindow(points, index, 'newDeaths'),
  }));
}

// The history source stores an immutable observation array for each country.
// Cache its derived seven-day averages and release them with the source array.
const preparedSeries = new WeakMap<HistoryPoint[], HistoryObservation[]>();

function preparedHistory(points: HistoryPoint[]): HistoryObservation[] {
  let prepared = preparedSeries.get(points);
  if (!prepared) {
    prepared = withMovingAverages(points);
    preparedSeries.set(points, prepared);
  }
  return prepared;
}

function firstAtOrAfter(points: HistoryObservation[], date: string): number {
  let left = 0;
  let right = points.length;
  while (left < right) {
    const middle = Math.floor((left + right) / 2);
    if (points[middle].date < date) left = middle + 1;
    else right = middle;
  }
  return left;
}

function firstAfter(points: HistoryObservation[], date: string): number {
  let left = 0;
  let right = points.length;
  while (left < right) {
    const middle = Math.floor((left + right) / 2);
    if (points[middle].date <= date) left = middle + 1;
    else right = middle;
  }
  return left;
}

export function selectHistory(
  points: HistoryPoint[],
  query: { period?: HistoryPeriod; from?: string; to?: string },
): { from: string; to: string; lastObservation: string; points: HistoryObservation[] } {
  if (!points.length) throw new BadRequestException('No historical observations are available');
  if (query.period && (query.from || query.to)) {
    throw new BadRequestException('Period cannot be combined with from or to');
  }
  if ((query.from && !isValidDate(query.from)) || (query.to && !isValidDate(query.to))) {
    throw new BadRequestException('Dates must use the YYYY-MM-DD format');
  }

  const lastObservation = points[points.length - 1].date;
  const days: { [key: string]: number } = { '7d': 6, '30d': 29, '90d': 89 };
  const first = query.period && query.period !== 'all'
    ? daysBefore(lastObservation, days[query.period])
    : points[0].date;
  const from = query.from || first;
  const to = query.to || lastObservation;
  if (from > to) throw new BadRequestException('From date must be earlier than to date');

  const prepared = preparedHistory(points);
  const observations = prepared.slice(firstAtOrAfter(prepared, from), firstAfter(prepared, to));
  return { from, to, lastObservation, points: observations };
}
