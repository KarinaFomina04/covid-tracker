import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

const world = {
  code: 'OWID_WRL',
  name: 'World',
  continent: null,
  date: '2020-12-10',
  population: 7800000000,
  totalCases: 70000000,
  newCases: 650000,
  totalDeaths: 1600000,
  newDeaths: 12000,
  casesPerMillion: 8974.36,
  deathsPerMillion: 205.13,
  caseFatalityRatio: 2.29,
  source: 'Our World in Data',
};

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  window.fetch = jest.fn().mockImplementation((path: string) => {
    let data: unknown = { status: 'ok', service: 'covid-tracker-api' };
    if (path.includes('/summary')) data = world;
    if (path.includes('/map')) {
      data = { date: '2020-12-10', source: 'Our World in Data', items: [] };
    }
    if (path.includes('/countries?')) {
      data = { items: [], total: 0, page: 1, limit: 6, totalPages: 0, source: 'Our World in Data' };
    }
    if (path.includes('/meta')) {
      data = { source: 'Our World in Data', sourceUrl: '', fetchedAt: '', dataDate: '2020-12-10', countriesCount: 200 };
    }
    return Promise.resolve({ ok: true, json: async () => data });
  });
});

test('displays the global dashboard and reported figures', async () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1, name: 'COVID-19 Dashboard' })).toBeInTheDocument();
  expect(await screen.findByText('70,000,000')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Countries' })).toHaveAttribute('href', '/countries');
});

test('provides a skip link and a collapsible navigation menu', async () => {
  render(<App />);
  expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main-content');
  expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');

  const toggle = screen.getByRole('button', { name: 'Open menu' });
  expect(toggle).toHaveAttribute('aria-controls', 'primary-navigation');
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(toggle);
  expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('navigation', { name: 'Main navigation' })).toHaveClass('site-nav--open');
  fireEvent.click(screen.getByRole('link', { name: 'Countries' }));
  expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
});
