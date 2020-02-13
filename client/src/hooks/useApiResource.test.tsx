import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getJson } from '../api/statistics';
import { useApiResource } from './useApiResource';

jest.mock('../api/statistics', () => ({ getJson: jest.fn() }));
const request = getJson as unknown as jest.Mock;

function Resource({ path }: { path: string }): JSX.Element {
  const { data, error, loading, retry } = useApiResource<{ name: string }>(path);
  return (
    <div>
      <span data-testid="result">{loading ? 'Loading' : error || data?.name || 'Empty'}</span>
      <button onClick={retry}>Reload</button>
    </div>
  );
}

describe('useApiResource', () => {
  beforeEach(() => request.mockReset());

  it('renders a loading state and then the requested data', async () => {
    let resolve!: (value: { name: string }) => void;
    request.mockReturnValue(new Promise((done) => { resolve = done; }));
    render(<Resource path="/countries/POL" />);
    expect(screen.getByTestId('result')).toHaveTextContent('Loading');
    await act(async () => { resolve({ name: 'Poland' }); });
    expect(await screen.findByText('Poland')).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith('/countries/POL', expect.any(Object));
  });

  it('exposes an error and retries without changing the resource path', async () => {
    request.mockRejectedValueOnce(new Error('Server unavailable'))
      .mockResolvedValueOnce({ name: 'Poland' });
    render(<Resource path="/countries/POL" />);
    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(await screen.findByText('Poland')).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1][0]).toBe('/countries/POL');
  });

  it('abandons the previous request when the resource path changes', async () => {
    let resolvePrevious!: (value: { name: string }) => void;
    request.mockReturnValueOnce(new Promise((done) => { resolvePrevious = done; }))
      .mockResolvedValueOnce({ name: 'Italy' });
    const view = render(<Resource path="/countries/POL" />);
    const previousSignal: AbortSignal = request.mock.calls[0][1];
    view.rerender(<Resource path="/countries/ITA" />);
    expect(previousSignal.aborted).toBe(true);
    expect(await screen.findByText('Italy')).toBeInTheDocument();
    await act(async () => { resolvePrevious({ name: 'Poland' }); });
    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('Italy'));
  });

  it('aborts pending requests when the component unmounts', () => {
    request.mockReturnValue(new Promise(() => undefined));
    const view = render(<Resource path="/summary" />);
    const signal: AbortSignal = request.mock.calls[0][1];
    expect(signal.aborted).toBe(false);
    view.unmount();
    expect(signal.aborted).toBe(true);
  });
});
