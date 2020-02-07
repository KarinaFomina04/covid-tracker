import { CountryStatistics } from '../../api/statistics';
import centroids from './country-centroids.json';

export type MapMetric = 'totalCases' | 'totalDeaths' | 'casesPerMillion' | 'deathsPerMillion';

export interface MapMarker extends CountryStatistics {
  latitude: number;
  longitude: number;
}

export const METRIC_LABELS: Record<MapMetric, string> = {
  totalCases: 'Confirmed cases',
  totalDeaths: 'Reported deaths',
  casesPerMillion: 'Cases per million',
  deathsPerMillion: 'Deaths per million',
};

const coordinates: Record<string, number[]> = centroids;

export function makeMapMarkers(countries: CountryStatistics[], metric: MapMetric): MapMarker[] {
  return countries
    .filter((country) => {
      const point = coordinates[country.code];
      return (
        Boolean(point) &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1]) &&
        country[metric] !== null &&
        Number.isFinite(country[metric])
      );
    })
    .map((country) => ({
      ...country,
      latitude: coordinates[country.code][0],
      longitude: coordinates[country.code][1],
    }))
    .sort((a, b) => (b[metric] || 0) - (a[metric] || 0));
}

export function markerRadius(value: number, maximum: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(maximum) || maximum <= 0) {
    return 5;
  }
  const ratio = Math.max(0, Math.min(1, value / maximum));
  return Math.round((5 + 19 * Math.sqrt(ratio)) * 10) / 10;
}

export function markerColor(metric: MapMetric): string {
  return metric === 'totalDeaths' || metric === 'deathsPerMillion' ? '#d15c69' : '#11879e';
}
