import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CountriesPage from './CountriesPage';

const countriesResponse = {
  items: [{
    code: 'POL', name: 'Poland', continent: 'Europe', date: '2020-12-10',
    population: 38000000, totalCases: 1000000, newCases: 8000,
    totalDeaths: 20000, newDeaths: 100, casesPerMillion: 26315.8, deathsPerMillion: 526.3,
  }],
  page: 1, limit: 12, total: 1, totalPages: 1, source: 'Our World in Data',
};

beforeEach(() => {
  window.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => countriesResponse });
});

test('shows country data and opens its details', async () => {
  render(<MemoryRouter><CountriesPage /></MemoryRouter>);
  const countryLink = await screen.findByRole('link', { name: 'Poland' });
  expect(countryLink).toHaveAttribute('href', '/countries/POL');
  expect(screen.getByText('1,000,000')).toBeInTheDocument();
});

test('updates continent filter', async () => {
  render(<MemoryRouter><CountriesPage /></MemoryRouter>);
  await screen.findByText('Poland');
  fireEvent.change(screen.getByLabelText('Continent'), { target: { value: 'Europe' } });
  expect(window.fetch).toHaveBeenCalledWith(
    expect.stringContaining('continent=Europe'),
    expect.any(Object),
  );
});
