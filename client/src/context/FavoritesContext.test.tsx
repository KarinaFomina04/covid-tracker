import { fireEvent, render, screen } from '@testing-library/react';
import { FAVORITES_STORAGE_KEY, FavoritesProvider, useFavorites } from './FavoritesContext';

function Consumer(): JSX.Element {
  const { favoriteCodes, isFavorite, toggleFavorite } = useFavorites();

  return (
    <div>
      <span data-testid="saved-countries">{favoriteCodes.join(',')}</span>
      <span>{isFavorite('POL') ? 'Poland is saved' : 'Poland is not saved'}</span>
      <button type="button" onClick={() => toggleFavorite('POL')}>Toggle Poland</button>
      <button type="button" onClick={() => toggleFavorite('INVALID')}>Toggle invalid code</button>
    </div>
  );
}

beforeEach(() => window.localStorage.clear());

test('stores selected countries and restores them after remount', () => {
  const { unmount } = render(<FavoritesProvider><Consumer /></FavoritesProvider>);

  fireEvent.click(screen.getByRole('button', { name: 'Toggle Poland' }));
  expect(screen.getByText('Poland is saved')).toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]')).toEqual(['POL']);

  unmount();
  render(<FavoritesProvider><Consumer /></FavoritesProvider>);
  expect(screen.getByText('Poland is saved')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Toggle Poland' }));
  expect(screen.getByText('Poland is not saved')).toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]')).toEqual([]);
});

test('ignores invalid saved values and duplicate codes', () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(['POL', 'POL', 3, 'OWID_WRL', 'ITA']));
  render(<FavoritesProvider><Consumer /></FavoritesProvider>);

  expect(screen.getByTestId('saved-countries')).toHaveTextContent('POL,ITA');
  fireEvent.click(screen.getByRole('button', { name: 'Toggle invalid code' }));
  expect(screen.getByTestId('saved-countries')).toHaveTextContent('POL,ITA');
});

test('recovers from invalid local storage JSON', () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '{invalid');
  render(<FavoritesProvider><Consumer /></FavoritesProvider>);

  expect(screen.getByText('Poland is not saved')).toBeInTheDocument();
});
