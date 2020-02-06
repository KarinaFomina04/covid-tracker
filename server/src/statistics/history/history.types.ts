export interface HistoryPoint {
  date: string;
  totalCases: number | null;
  newCases: number | null;
  totalDeaths: number | null;
  newDeaths: number | null;
}

export interface HistoryDataset {
  sourceUrl: string;
  fetchedAt: string;
  records: Record<string, HistoryPoint[]>;
}

export interface HistoryObservation extends HistoryPoint {
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
  points: HistoryObservation[];
}

export type HistoryPeriod = '7d' | '30d' | '90d' | 'all';
