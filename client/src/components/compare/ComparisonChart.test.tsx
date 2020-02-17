import { render, screen } from '@testing-library/react';
import ComparisonChart from './ComparisonChart';
import { ComparisonResponse } from '../../api/statistics';

jest.mock('chart.js', () => jest.fn().mockImplementation(() => ({ destroy: jest.fn() })));

const response = {
  from: '2020-12-01', to: '2020-12-02', lastObservation: '2020-12-02',
  dates: ['2020-12-01', '2020-12-02'],
  metric: 'newCases', scale: 'absolute',
  source: 'Our World in Data', fetchedAt: '2020-12-03T00:00:00Z',
  countries: [
    { code: 'POL', name: 'Poland', population: 38000000, values: [null, 12], lastValue: 12, lastValueDate: '2020-12-02' },
    { code: 'USA', name: 'United States', population: 330000000, values: [null, null], lastValue: null, lastValueDate: null },
  ],
} as ComparisonResponse;

describe('ComparisonChart', () => {
  it('renders accessible country observations, including missing data', () => {
    render(<ComparisonChart data={response} />);
    expect(screen.getByRole('region', { name: 'Country comparison results' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Latest available values for selected countries' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Poland' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'United States' })).toBeInTheDocument();
    expect(screen.getByText(/Empty observations are shown as gaps/)).toBeInTheDocument();
  });

  it('shows a non-graphical empty state if all observations are missing', () => {
    render(<ComparisonChart data={{ ...response, countries: response.countries.map((country) => ({
      ...country, values: [null, null], lastValue: null, lastValueDate: null,
    })) }} />);
    expect(screen.getByText('No comparable values are available for this indicator and period.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
