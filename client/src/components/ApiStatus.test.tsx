import { render, screen } from '@testing-library/react';
import ApiStatus from './ApiStatus';

beforeEach(() => {
  window.fetch = jest.fn();
});

test('shows connected when the health endpoint succeeds', async () => {
  (window.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ status: 'ok', service: 'api' }) });
  render(<ApiStatus />);
  expect(await screen.findByText('API connected')).toBeInTheDocument();
  expect(window.fetch).toHaveBeenCalledWith('/api/v1/health', expect.objectContaining({ signal: expect.any(Object) }));
});

test('shows unavailable for an HTTP error', async () => {
  (window.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 });
  render(<ApiStatus />);
  expect(await screen.findByText('API unavailable')).toBeInTheDocument();
});

test('cancels the health request when unmounted', () => {
  (window.fetch as jest.Mock).mockImplementation((_url: string, options: RequestInit) =>
    new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }));
  const view = render(<ApiStatus />);
  const signal = (window.fetch as jest.Mock).mock.calls[0][1].signal as AbortSignal;
  expect(signal.aborted).toBe(false);
  view.unmount();
  expect(signal.aborted).toBe(true);
});
