export type CompareMetric =
  | 'totalCases'
  | 'newCases'
  | 'newCasesAverage'
  | 'totalDeaths'
  | 'newDeaths'
  | 'newDeathsAverage';

export type CompareScale = 'absolute' | 'perMillion';

export interface CompareCountrySeries {
  code: string;
  name: string;
  population: number | null;
  values: Array<number | null>;
  lastValue: number | null;
  lastValueDate: string | null;
}

export interface CompareResponse {
  from: string;
  to: string;
  lastObservation: string;
  dates: string[];
  metric: CompareMetric;
  scale: CompareScale;
  countries: CompareCountrySeries[];
  source: string;
  fetchedAt: string;
}
