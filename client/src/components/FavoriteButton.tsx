import { useFavorites } from '../context/FavoritesContext';

interface FavoriteButtonProps {
  code: string;
  name: string;
  compact?: boolean;
}

export default function FavoriteButton({ code, name, compact = false }: FavoriteButtonProps): JSX.Element {
  const { isFavorite, toggleFavorite } = useFavorites();
  const selected = isFavorite(code);

  return (
    <button
      type="button"
      className={`favorite-button${selected ? ' favorite-button--active' : ''}${compact ? ' favorite-button--compact' : ''}`}
      aria-label={`${selected ? 'Remove' : 'Add'} ${name} ${selected ? 'from' : 'to'} favorites`}
      aria-pressed={selected}
      title={selected ? 'Remove from favorites' : 'Add to favorites'}
      onClick={() => toggleFavorite(code)}
    >
      <span aria-hidden="true">{selected ? '★' : '☆'}</span>
      {!compact && <span>{selected ? 'Saved to favorites' : 'Save to favorites'}</span>}
    </button>
  );
}
