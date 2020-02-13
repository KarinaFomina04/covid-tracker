import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useApiResource } from '../hooks/useApiResource';
import { FavoritesProvider } from '../context/FavoritesContext';
import DashboardPage from './DashboardPage';

jest.mock('../hooks/useApiResource', () => ({ useApiResource: jest.fn() }));
jest.mock('../components/ApiStatus', () => () => 'API status');
jest.mock('../components/charts/HistoryChart', () => () => 'Trend chart');
jest.mock('../components/map/WorldMapPanel', () => () => 'World map');

const useResource = useApiResource as jest.Mock;
const world = {
  code: 'OWID_WRL', name: 'World', date: '2020-12-30', population: 7800000000,
  totalCases: 1000, newCases: 20, totalDeaths: 50, newDeaths: 2,
  casesPerMillion: 0.13, caseFatalityRatio: 5,
};
const poland = {
  code: 'POL', name: 'Poland', continent: 'Europe', date: '2020-12-30',
  population: 38000000, totalCases: 250, newCases: 10,
  totalDeaths: 15, newDeaths: 1, casesPerMillion: 6.58, deathsPerMillion: 0.39,
};
const italy = { ...poland, code: 'ITA', name: 'Italy', totalCases: null };

function renderDashboard() {
  return render(<MemoryRouter><FavoritesProvider><DashboardPage /></FavoritesProvider></MemoryRouter>);
}

describe('DashboardPage', () => {
  beforeEach(() => {
    useResource.mockReset();
    useResource.mockImplementation((path: string) => ({
      loading: false,
      error: null,
      retry: jest.fn(),
      data: path === '/summary' ? world
        : path === '/meta'
          ? { countriesCount: 2, dataDate: '2020-12-30', fetchedAt: '2020-12-31T12:00:00Z' }
          : { items: [poland, italy], total: 2 },
    }));
  });

  it('shows worldwide totals, source coverage and links to reported countries', () => {
    renderDashboard();
    expect(screen.getByRole('heading', { name: 'COVID-19 Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText('World map')).toBeInTheDocument();
    expect(screen.getByText('Trend chart')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Poland' })[0]).toHaveAttribute('href', '/countries/POL');
    expect(screen.getByText('countries and territories').closest('.insight-stat')).toHaveTextContent('2');
    expect(useResource).toHaveBeenCalledWith('/countries?sortBy=totalCases&limit=6');
  });

  it('ignores rankings without reported cases while keeping them in the table', () => {
    renderDashboard();
    const ranking = screen.getByRole('heading', { name: 'Most reported cases' }).closest('section');
    expect(ranking).toHaveTextContent('Poland');
    expect(ranking).not.toHaveTextContent('Italy');
    expect(screen.getAllByRole('link', { name: 'Italy' })).toHaveLength(1);
  });

  it('renders a useful state when the country ranking is empty', () => {
    useResource.mockImplementation((path: string) => ({
      loading: false, error: null, retry: jest.fn(),
      data: path.startsWith('/countries') ? { items: [], total: 0 } : path === '/summary' ? world : null,
    }));
    renderDashboard();
    expect(screen.getByText('No reported figures are available.')).toBeInTheDocument();
    expect(screen.getByText('No countries match the selected criteria.')).toBeInTheDocument();
  });

  it('shows API failures without replacing the whole dashboard', () => {
    useResource.mockImplementation((path: string) => ({
      loading: false,
      error: path === '/summary' ? 'Statistics are unavailable' : null,
      retry: jest.fn(),
      data: path === '/summary' ? null : path.startsWith('/countries') ? { items: [], total: 0 } : null,
    }));
    renderDashboard();
    expect(screen.getByRole('alert')).toHaveTextContent('Statistics are unavailable');
    expect(screen.getByRole('heading', { name: 'Most reported cases' })).toBeInTheDocument();
  });
});
