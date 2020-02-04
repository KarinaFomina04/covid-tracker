import parse = require('csv-parse/lib/sync');
import { CountryStatistics, StatisticsDataset } from './statistics.types';

interface CsvRecord {
  [key: string]: string;
}

const REQUIRED_COLUMNS = [
  'iso_code',
  'continent',
  'location',
  'last_updated_date',
  'total_cases',
  'new_cases',
  'total_deaths',
  'new_deaths',
  'population',
];

function optionalNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isObservationDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function ratioPerMillion(value: number | null, population: number | null): number | null {
  if (value === null || population === null || population <= 0) {
    return null;
  }

  return Math.round((value / population) * 1000000 * 100) / 100;
}

function toCountry(row: CsvRecord): CountryStatistics {
  const population = optionalNumber(row.population);
  const totalCases = optionalNumber(row.total_cases);
  const totalDeaths = optionalNumber(row.total_deaths);

  return {
    code: row.iso_code.trim(),
    name: row.location.trim(),
    continent: row.continent.trim() || null,
    date: row.last_updated_date.trim(),
    population,
    totalCases,
    newCases: optionalNumber(row.new_cases),
    totalDeaths,
    newDeaths: optionalNumber(row.new_deaths),
    casesPerMillion: ratioPerMillion(totalCases, population),
    deathsPerMillion: ratioPerMillion(totalDeaths, population),
  };
}

export function parseOwidCsv(
  csv: string,
  sourceUrl: string,
  fetchedAt: string,
): StatisticsDataset {
  const rows = parse(csv, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
  }) as CsvRecord[];

  if (rows.length === 0 || REQUIRED_COLUMNS.some((key) => !(key in rows[0]))) {
    throw new Error('Statistics source has an unexpected format');
  }

  const worldRecord = rows.find((row) => row.iso_code === 'OWID_WRL');
  if (!worldRecord || !isObservationDate(worldRecord.last_updated_date)) {
    throw new Error('World statistics are missing from the source');
  }

  const countries = rows
    .filter((row) =>
      /^[A-Z]{3}$/.test(row.iso_code) && row.location && isObservationDate(row.last_updated_date),
    )
    .map(toCountry);

  if (countries.length === 0) {
    throw new Error('Country statistics are missing from the source');
  }

  return {
    world: toCountry(worldRecord),
    countries,
    sourceUrl,
    fetchedAt,
  };
}
