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
