export interface CountryStatistics {
  code: string;
  name: string;
  continent: string | null;
  date: string;
  population: number | null;
  totalCases: number | null;
  newCases: number | null;
  totalDeaths: number | null;
  newDeaths: number | null;
  casesPerMillion: number | null;
  deathsPerMillion: number | null;
  totalTests?: number | null;
  newTests?: number | null;
  testsPerThousand?: number | null;
  positiveRate?: number | null;
}

export interface GlobalStatistics extends CountryStatistics {
  caseFatalityRatio: number | null;
  source: string;
}

export interface CountriesResponse {
  items: CountryStatistics[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  source: string;
}

export interface DatasetMetadata {
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  dataDate: string;
  countriesCount: number;
}

export type CountrySort =
  | 'name'
  | 'totalCases'
  | 'totalDeaths'
  | 'newCases'
  | 'newDeaths'
  | 'casesPerMillion'
  | 'deathsPerMillion';

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { signal });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('The requested country could not be found.');
    }
    if (response.status === 503) {
      throw new Error('Statistics are currently unavailable. Please try again later.');
    }
    throw new Error('Unable to load statistics. Please try again.');
  }

  return (await response.json()) as T;
}

export interface HistoryPoint {
  date: string;
  totalCases: number | null;
  newCases: number | null;
  totalDeaths: number | null;
  newDeaths: number | null;
  newCasesAverage: number | null;
  newDeathsAverage: number | null;
}

export interface HistoryResponse {
  code: string;
  from: string;
  to: string;
  lastObservation: string;
  source: string;
  fetchedAt: string;
  points: HistoryPoint[];
}

export interface MapResponse {
  date: string;
  source: string;
  items: CountryStatistics[];
}

export type ComparisonMetric =
  | 'totalCases'
  | 'newCases'
  | 'newCasesAverage'
  | 'totalDeaths'
  | 'newDeaths'
  | 'newDeathsAverage';
export type ComparisonScale = 'absolute' | 'perMillion';

export interface ComparisonCountry {
  code: string;
  name: string;
  population: number | null;
  values: Array<number | null>;
  lastValue: number | null;
  lastValueDate: string | null;
}

export interface ComparisonResponse {
  from: string;
  to: string;
  lastObservation: string;
  dates: string[];
  metric: ComparisonMetric;
  scale: ComparisonScale;
  countries: ComparisonCountry[];
  source: string;
  fetchedAt: string;
}
