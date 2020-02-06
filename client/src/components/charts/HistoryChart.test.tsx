import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HistoryChart from './HistoryChart';

jest.mock('chart.js', () => jest.fn().mockImplementation(() => ({ destroy: jest.fn() })));

const history = {
  code: 'POL', from: '2020-12-01', to: '2020-12-31', lastObservation: '2020-12-31',
  fetchedAt: '2020-12-31T23:00:00Z', source: 'Our World in Data',
  points: [{ date: '2020-12-31', totalCases: 100, newCases: 5, totalDeaths: 3, newDeaths: 1, newCasesAverage: 4, newDeathsAverage: 1 }],
};

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({});
  window.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => history });
});

test('loads historical observations and changes the selected period', async () => {
  render(<HistoryChart path="/countries/POL/history" title="Poland: trends" population={38000000} />);
  expect(await screen.findByRole('img', { name: /total confirmed cases/i })).toBeInTheDocument();
  expect(window.fetch).toHaveBeenCalledWith('/api/v1/countries/POL/history?period=30d', expect.any(Object));
  fireEvent.change(screen.getByLabelText('Chart period'), { target: { value: '90d' } });
  await waitFor(() => {
    expect(window.fetch).toHaveBeenCalledWith('/api/v1/countries/POL/history?period=90d', expect.any(Object));
  });
});
