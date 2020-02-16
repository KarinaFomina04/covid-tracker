import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CountriesPage from './CountriesPage';
import { FavoritesProvider } from '../context/FavoritesContext';
import * as csvExport from '../utils/csv-export';
import { clearResourceCache } from '../api/resource-cache';

const countriesResponse = {
  items: [{
    code: 'POL', name: 'Poland', continent: 'Europe', date: '2020-12-10',
    population: 38000000, totalCases: 1000000, newCases: 8000,
    totalDeaths: 20000, newDeaths: 100, casesPerMillion: 26315.8, deathsPerMillion: 526.3,
  }],
  page: 1, limit: 12, total: 1, totalPages: 1, source: 'Our World in Data',
};

beforeEach(() => {
  clearResourceCache();
  window.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => countriesResponse });
});

test('shows country data and opens its details', async () => {
  render(<MemoryRouter><FavoritesProvider><CountriesPage /></FavoritesProvider></MemoryRouter>);
  const countryLink = await screen.findByRole('link', { name: 'Poland' });
  expect(countryLink).toHaveAttribute('href', '/countries/POL');
  expect(screen.getByText('1,000,000')).toBeInTheDocument();
});

test('updates continent filter', async () => {
  render(<MemoryRouter><FavoritesProvider><CountriesPage /></FavoritesProvider></MemoryRouter>);
  await screen.findByText('Poland');
  fireEvent.change(screen.getByLabelText('Continent'), { target: { value: 'Europe' } });
  expect(window.fetch).toHaveBeenCalledWith(
    expect.stringContaining('continent=Europe'),
    expect.any(Object),
  );
});

test('adds a country to favorites from the table', async () => {
  window.localStorage.clear();
  render(<MemoryRouter><FavoritesProvider><CountriesPage /></FavoritesProvider></MemoryRouter>);
  await screen.findByText('Poland');

  fireEvent.click(screen.getByRole('button', { name: 'Add Poland to favorites' }));
  expect(screen.getByRole('button', { name: 'Remove Poland from favorites' })).toHaveAttribute('aria-pressed', 'true');
  expect(JSON.parse(window.localStorage.getItem('covid-tracker:favorites') || '[]')).toEqual(['POL']);
});

test('downloads the current filtered table page as CSV', async () => {
  const download = jest.spyOn(csvExport, 'downloadCsv').mockImplementation(() => undefined);
  try {
    render(<MemoryRouter><FavoritesProvider><CountriesPage /></FavoritesProvider></MemoryRouter>);
    const button = screen.getByRole('button', { name: 'Export current page CSV' });
    expect(button).toBeDisabled();
    await screen.findByText('Poland');
    fireEvent.click(button);
    expect(download).toHaveBeenCalledWith(
      'covid-19-countries-page-1.csv',
      expect.stringContaining('Poland,POL,Europe,2020-12-10'),
    );
  } finally {
    download.mockRestore();
  }
});

test('offers a keyboard-scrollable labelled statistics table', async () => {
  render(<MemoryRouter><FavoritesProvider><CountriesPage /></FavoritesProvider></MemoryRouter>);
  const region = await screen.findByRole('region', { name: 'Country statistics table' });
  expect(region).toHaveAttribute('tabindex', '0');
  expect(screen.getByRole('table', { name: /covid-19 statistics by country/i })).toBeInTheDocument();
});

test('returns to the last available page when the result count shrinks', async () => {
  (window.fetch as jest.Mock).mockImplementation((url: string) => {
    const params = new URL(url, 'http://localhost').searchParams;
    const requestedPage = Number(params.get('page'));
    return Promise.resolve({
      ok: true,
      json: async () => requestedPage === 2
        ? { ...countriesResponse, page: 2, total: 1, totalPages: 1, items: [] }
        : { ...countriesResponse, total: 13, totalPages: 2 },
    });
  });
  render(<MemoryRouter><FavoritesProvider><CountriesPage /></FavoritesProvider></MemoryRouter>);
  expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect((window.fetch as jest.Mock).mock.calls.some(([url]: [string]) =>
    url.includes('page=2'))).toBe(true));
  await waitFor(() => expect(screen.getByText('Page 1 of 2')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
});
