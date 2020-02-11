import { render, screen } from '@testing-library/react';
import { CountryStatistics } from '../api/statistics';
import TestingPanel from './TestingPanel';

const country: CountryStatistics = {
  code: 'POL', name: 'Poland', continent: 'Europe', date: '2020-12-30',
  population: 38000000, totalCases: 100, newCases: 10,
  totalDeaths: 5, newDeaths: 1, casesPerMillion: 2.6, deathsPerMillion: 0.13,
  totalTests: 4000000, newTests: 20000, testsPerThousand: 105.26, positiveRate: 0.075,
};

test('displays testing figures and converts the rate into a percentage', () => {
  render(<TestingPanel country={country} />);
  expect(screen.getByRole('heading', { name: 'Testing statistics' })).toBeInTheDocument();
  expect(screen.getByText('4,000,000')).toBeInTheDocument();
  expect(screen.getByText('20,000')).toBeInTheDocument();
  expect(screen.getByText('105.26')).toBeInTheDocument();
  expect(screen.getByText('7.5%')).toBeInTheDocument();
});

test('shows a clear explanation when testing was not reported', () => {
  render(<TestingPanel country={{ ...country, totalTests: null, newTests: null, positiveRate: null, testsPerThousand: null }} />);
  expect(screen.getByText('Testing data is not available for this country.')).toBeInTheDocument();
});

test('handles missing optional fields from saved snapshots', () => {
  const { totalTests, newTests, testsPerThousand, positiveRate, ...previous } = country;
  render(<TestingPanel country={previous} />);
  expect(screen.getByText('Testing data is not available for this country.')).toBeInTheDocument();
});
