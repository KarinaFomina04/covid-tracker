import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ComparePage from './ComparePage';

jest.mock('chart.js', () => jest.fn().mockImplementation(() => ({ destroy: jest.fn() })));

const countries = [
  { code: 'POL', name: 'Poland', population: 38000000 },
  { code: 'USA', name: 'United States', population: 330000000 },
  { code: 'ITA', name: 'Italy', population: 60000000 },
  { code: 'FRA', name: 'France', population: 67000000 },
];

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({});
  window.fetch = jest.fn().mockImplementation((url: string) => Promise.resolve({
    ok: true,
    json: async () => url.includes('/map')
      ? { items: countries, date: '2020-12-31', source: 'Our World in Data' }
      : {
          from: '2020-12-30', to: '2020-12-31', lastObservation: '2020-12-31',
          dates: ['2020-12-30', '2020-12-31'], metric: 'totalCases', scale: 'absolute',
          source: 'Our World in Data', fetchedAt: '2020-12-31T23:00:00Z',
          countries: [
            { code: 'USA', name: 'United States', population: 330000000, values: [100, 110], lastValue: 110, lastValueDate: '2020-12-31' },
            { code: 'ITA', name: 'Italy', population: 60000000, values: [20, 25], lastValue: 25, lastValueDate: '2020-12-31' },
          ],
        },
  }));
});

test('compares two countries and updates selected metric and period', async () => {
  render(<MemoryRouter><ComparePage /></MemoryRouter>);
  expect(await screen.findByRole('img', { name: 'Comparison of selected countries over time' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Comparison indicator'), { target: { value: 'newDeathsAverage' } });
  fireEvent.change(screen.getByLabelText('Comparison period'), { target: { value: '90d' } });
  await waitFor(() => {
    const fetchMock = window.fetch as jest.Mock;
    expect(fetchMock.mock.calls.some(([url]: [string]) =>
      url.includes('metric=newDeathsAverage') && url.includes('period=90d'))).toBe(true);
  });
});

test('allows adding a country without selecting duplicates', async () => {
  render(<MemoryRouter><ComparePage /></MemoryRouter>);
  await screen.findByRole('option', { name: 'Poland' });
  fireEvent.click(screen.getByRole('button', { name: 'Add country' }));
  const selectors = [1, 2, 3].map((index) => screen.getByLabelText(`Country ${index}`));
  expect(selectors).toHaveLength(3);
  expect((selectors[2] as HTMLSelectElement).value).toBe('FRA');
  fireEvent.click(screen.getByRole('button', { name: 'Remove country 3' }));
  expect(screen.queryByLabelText('Country 3')).not.toBeInTheDocument();
});

test('does not request a comparison until custom dates form a valid range', async () => {
  render(<MemoryRouter><ComparePage /></MemoryRouter>);
  await screen.findByRole('img', { name: 'Comparison of selected countries over time' });
  const fetchMock = window.fetch as jest.Mock;
  fireEvent.change(screen.getByLabelText('Comparison period'), { target: { value: 'custom' } });
  expect(screen.getByText('Choose a start date and an end date to compare countries.')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Comparison from date'), { target: { value: '2020-12-31' } });
  fireEvent.change(screen.getByLabelText('Comparison to date'), { target: { value: '2020-12-01' } });
  expect(screen.getByRole('alert')).toHaveTextContent('The start date must not be later than the end date.');
  expect(fetchMock.mock.calls.some(([url]: [string]) => url.includes('from=2020-12-31'))).toBe(false);
  fireEvent.change(screen.getByLabelText('Comparison to date'), { target: { value: '2020-12-31' } });
  await waitFor(() => expect(fetchMock.mock.calls.some(([url]: [string]) =>
    url.includes('from=2020-12-31') && url.includes('to=2020-12-31'))).toBe(true));
});
