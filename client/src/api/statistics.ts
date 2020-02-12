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

export class ApiRequestError extends Error {
  constructor(message: string, public readonly status: number | null = null) {
    super(message);
    this.name = 'ApiRequestError';
    Object.setPrototypeOf(this, ApiRequestError.prototype);
  }
}

const REQUEST_TIMEOUT_MS = 20000;
const HISTORY_TIMEOUT_MS = 180000;

function messageForStatus(status: number): string {
  if (status === 400) return 'The request contains invalid parameters.';
  if (status === 404) return 'The requested statistics could not be found.';
  if (status === 429) return 'Too many requests. Please try again later.';
  if (status === 503) return 'Statistics are currently unavailable. Please try again later.';
  return 'Unable to load statistics. Please try again.';
}

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  let timedOut = false;
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, path.includes('/history') || path.startsWith('/compare')
    ? HISTORY_TIMEOUT_MS
    : REQUEST_TIMEOUT_MS);

  if (signal) {
    signal.addEventListener('abort', abort);
    if (signal.aborted) controller.abort();
  }

  try {
    const response = await fetch(`/api/v1${path}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new ApiRequestError(messageForStatus(response.status), response.status);
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      if (signal?.aborted || timedOut) throw error;
      throw new ApiRequestError('The server returned an invalid response.', response.status);
    }
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    if (signal?.aborted) throw error;
    if (timedOut) {
      throw new ApiRequestError('The request timed out. Please try again.');
    }
    throw new ApiRequestError('Unable to connect to the server. Please check your connection.');
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
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
