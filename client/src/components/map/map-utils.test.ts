import { CountryStatistics } from '../../api/statistics';
import { makeMapMarkers, markerColor, markerRadius } from './map-utils';

function country(code: string, totalCases: number | null, totalDeaths: number | null): CountryStatistics {
  return {
    code,
    name: code,
    continent: 'Europe',
    date: '2020-12-30',
    population: 1000,
    totalCases,
    newCases: 1,
    totalDeaths,
    newDeaths: 0,
    casesPerMillion: totalCases,
    deathsPerMillion: totalDeaths,
  };
}

test('includes countries with coordinates and available values, sorted by the selected metric', () => {
  const countries = [country('POL', 10, 2), country('USA', 100, 1), country('ZZZ', 50, 5), country('FRA', null, 3)];
  expect(makeMapMarkers(countries, 'totalCases').map((item) => item.code)).toEqual(['USA', 'POL']);
  expect(makeMapMarkers(countries, 'totalDeaths').map((item) => item.code)).toEqual(['FRA', 'POL', 'USA']);
});

test('scales marker circles without allowing excessive radii', () => {
  expect(markerRadius(0, 100)).toBe(5);
  expect(markerRadius(100, 100)).toBe(24);
  expect(markerRadius(1000, 100)).toBe(24);
  expect(markerRadius(25, 100)).toBe(14.5);
  expect(markerRadius(1, 0)).toBe(5);
});

test('uses a distinct colour for deaths', () => {
  expect(markerColor('totalCases')).not.toBe(markerColor('totalDeaths'));
  expect(markerColor('deathsPerMillion')).toBe(markerColor('totalDeaths'));
});
