import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import CountryDetailsPage from './CountryDetailsPage';

beforeEach(() => {
  window.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      code: 'POL', name: 'Poland', continent: 'Europe', date: '2020-12-10',
      population: 38000000, totalCases: 1000000, newCases: 8000,
      totalDeaths: 20000, newDeaths: 100, casesPerMillion: 26315.8, deathsPerMillion: 526.3,
    }),
  });
});

test('shows the selected country profile', async () => {
  render(
    <MemoryRouter initialEntries={['/countries/POL']}>
      <Route path="/countries/:code" component={CountryDetailsPage} />
    </MemoryRouter>,
  );
  expect(await screen.findByRole('heading', { level: 1, name: 'Poland' })).toBeInTheDocument();
  expect(screen.getByText('38,000,000')).toBeInTheDocument();
  expect(window.fetch).toHaveBeenCalledWith('/api/v1/countries/POL', expect.any(Object));
});
