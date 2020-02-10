import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HistoryChart from './HistoryChart';
import * as csvExport from '../../utils/csv-export';

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

test('downloads the displayed metric and period as CSV', async () => {
  const download = jest.spyOn(csvExport, 'downloadCsv').mockImplementation(() => undefined);
  try {
    render(<HistoryChart path="/countries/POL/history" title="Poland: trends" population={38000000} />);
    const button = screen.getByRole('button', { name: 'Download CSV' });
    expect(button).toBeDisabled();
    await screen.findByRole('img', { name: /total confirmed cases/i });
    fireEvent.click(button);
    expect(download).toHaveBeenCalledWith(
      'covid-19-pol-cases-total-absolute-30d.csv',
      expect.stringContaining('2020-12-31,100'),
    );
    fireEvent.change(screen.getByLabelText('Chart series'), { target: { value: 'daily' } });
    fireEvent.click(button);
    expect(download).toHaveBeenLastCalledWith(
      'covid-19-pol-cases-7-day-average-absolute-30d.csv',
      expect.stringContaining('2020-12-31,4'),
    );
  } finally {
    download.mockRestore();
  }
});
