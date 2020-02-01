import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ status: 'ok', service: 'covid-tracker-api' }),
  });
});

test('renders the application heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'COVID-19 statistics, clearly presented.',
  );
});
