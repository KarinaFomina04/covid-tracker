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

export interface StatisticsDataset {
  world: CountryStatistics;
  countries: CountryStatistics[];
  sourceUrl: string;
  fetchedAt: string;
}

export type CountrySortField =
  | 'name'
  | 'totalCases'
  | 'totalDeaths'
  | 'newCases'
  | 'newDeaths'
  | 'casesPerMillion'
  | 'deathsPerMillion';
