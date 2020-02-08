import { BadRequestException } from '@nestjs/common';
import { HistoryResponse } from '../history/history.types';
import { isValidDate } from '../history/history-utils';
import { CompareMetric, CompareScale } from './compare.types';

export function parseComparisonCodes(value: string): string[] {
  if (typeof value !== 'string') {
    throw new BadRequestException('Provide between two and four country codes');
  }
  const codes = value.split(',').map((code) => code.trim().toUpperCase());
  if (codes.length < 2 || codes.length > 4 ||
      codes.some((code) => !/^[A-Z]{3}$/.test(code)) ||
      new Set(codes).size !== codes.length) {
    throw new BadRequestException('Provide two to four distinct three-letter country codes');
  }
  return codes;
}

function shiftDays(value: string, offset: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function comparisonDates(
  histories: HistoryResponse[],
  options: { period?: string; from?: string; to?: string },
): string[] {
  if (options.period && (options.from || options.to)) {
    throw new BadRequestException('Period cannot be combined with from or to');
  }
  if ((options.from && !isValidDate(options.from)) ||
      (options.to && !isValidDate(options.to))) {
    throw new BadRequestException('Dates must use the YYYY-MM-DD format');
  }
  if (!histories.length || histories.some((history) => history.points.length === 0)) {
    throw new BadRequestException('No comparable historical observations are available');
  }

  const earliest = histories.reduce(
    (date, history) => history.points[0].date > date ? history.points[0].date : date,
    histories[0].points[0].date,
  );
  const latest = histories.reduce(
    (date, history) => history.points[history.points.length - 1].date < date
      ? history.points[history.points.length - 1].date : date,
    histories[0].points[histories[0].points.length - 1].date,
  );
  if (earliest > latest) {
    throw new BadRequestException('Countries do not share a reporting period');
  }

  const span: Record<string, number> = { '7d': 6, '30d': 29, '90d': 89 };
  const requestedStart = options.period && options.period !== 'all'
    ? shiftDays(latest, -span[options.period])
    : options.from || earliest;
  const start = requestedStart > earliest ? requestedStart : earliest;
  const end = options.to && options.to < latest ? options.to : latest;
  if (start > end) {
    throw new BadRequestException('Selected dates do not overlap available observations');
  }
  const dates: string[] = [];
  for (let date = start; date <= end; date = shiftDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

export function alignedValues(
  history: HistoryResponse,
  dates: string[],
  metric: CompareMetric,
  scale: CompareScale,
  population: number | null,
): Array<number | null> {
  const observations = new Map(history.points.map((point) => [point.date, point]));
  return dates.map((date) => {
    const value = observations.get(date)?.[metric] ?? null;
    if (value === null) return null;
    if (scale === 'absolute') return value;
    if (population === null || population <= 0) return null;
    return Math.round((value / population) * 1000000 * 100) / 100;
  });
}
