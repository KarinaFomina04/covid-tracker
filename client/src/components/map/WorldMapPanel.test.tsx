import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WorldMapPanel from './WorldMapPanel';

jest.mock('./WorldMap', () => ({
  __esModule: true,
  default: ({ markers, metric }: { markers: Array<{ code: string }>; metric: string }) => (
    <div data-testid="world-map">{`${markers.map((marker) => marker.code).join(',')}: ${metric}`}</div>
  ),
}));

beforeEach(() => {
  window.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      date: '2020-12-30',
      source: 'Our World in Data',
      items: [
        { code: 'POL', name: 'Poland', date: '2020-12-30', totalCases: 200, totalDeaths: 10, casesPerMillion: 500, deathsPerMillion: 25 },
        { code: 'USA', name: 'United States', date: '2020-12-30', totalCases: 600, totalDeaths: 30, casesPerMillion: 200, deathsPerMillion: 20 },
      ],
    }),
  });
});

test('requests all map countries and changes the visible indicator', async () => {
  render(<MemoryRouter><WorldMapPanel /></MemoryRouter>);
  expect(await screen.findByTestId('world-map')).toHaveTextContent('USA,POL: totalCases');
  expect(window.fetch).toHaveBeenCalledWith('/api/v1/map', expect.any(Object));

  fireEvent.change(screen.getByLabelText('Map indicator'), { target: { value: 'totalDeaths' } });
  expect(screen.getByTestId('world-map')).toHaveTextContent('USA,POL: totalDeaths');
  expect(screen.getByText(/2 locations/)).toBeInTheDocument();
});
