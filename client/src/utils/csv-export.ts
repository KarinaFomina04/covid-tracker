import type { CountryStatistics } from '../api/statistics';
import type { ChartSeries } from '../components/charts/chart-series';

type CsvValue = string | number | null | undefined;

function escapeCell(value: CsvValue): string {
  const text = value === null || value === undefined ? '' : String(value);
  // Keep text beginning with spreadsheet operators from being evaluated as a formula.
  const safeText = typeof value === 'string' && /^[\x00-\x20]*[=+\-@]/.test(text)
    ? `'${text}`
    : text;
  return /[",\r\n]/.test(safeText) ? `"${safeText.replace(/"/g, '""')}"` : safeText;
}

export function serializeCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','));
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function countriesToCsv(countries: CountryStatistics[]): string {
  return serializeCsv(
    [
      'Country', 'ISO code', 'Continent', 'Observation date', 'Population',
      'Total cases', 'New cases', 'Total deaths', 'New deaths',
      'Cases per million', 'Deaths per million',
    ],
    countries.map((country) => [
      country.name, country.code, country.continent, country.date, country.population,
      country.totalCases, country.newCases, country.totalDeaths, country.newDeaths,
      country.casesPerMillion, country.deathsPerMillion,
    ]),
  );
}

export function historyToCsv(series: ChartSeries): string {
  return serializeCsv(
    ['Date', series.label],
    series.dates.map((date, index) => [date, series.values[index]]),
  );
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
