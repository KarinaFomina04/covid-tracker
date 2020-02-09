import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FAVORITES_STORAGE_KEY, FavoritesProvider } from '../context/FavoritesContext';
import FavoritesPage from './FavoritesPage';

const poland = {
  code: 'POL', name: 'Poland', continent: 'Europe', date: '2020-12-10',
  population: 38000000, totalCases: 1000000, newCases: 8000,
  totalDeaths: 20000, newDeaths: 100, casesPerMillion: 26315.8, deathsPerMillion: 526.3,
};

beforeEach(() => {
  window.localStorage.clear();
  window.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => poland });
});

test('shows an empty state and links to the country directory', () => {
  render(<MemoryRouter><FavoritesProvider><FavoritesPage /></FavoritesProvider></MemoryRouter>);

  expect(screen.getByText(/No favorite countries yet/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Browse countries' })).toHaveAttribute('href', '/countries');
});

test('loads the selected country and allows removing it', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(['POL']));
  render(<MemoryRouter><FavoritesProvider><FavoritesPage /></FavoritesProvider></MemoryRouter>);

  expect(await screen.findByRole('link', { name: 'Poland' })).toHaveAttribute('href', '/countries/POL');
  expect(screen.getByText('1,000,000')).toBeInTheDocument();
  expect(window.fetch).toHaveBeenCalledWith('/api/v1/countries/POL', expect.any(Object));

  fireEvent.click(screen.getByRole('button', { name: 'Remove Poland from favorites' }));
  expect(screen.getByText(/No favorite countries yet/)).toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]')).toEqual([]);
});
