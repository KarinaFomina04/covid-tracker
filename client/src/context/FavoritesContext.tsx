import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const FAVORITES_STORAGE_KEY = 'covid-tracker:favorites';

interface FavoritesContextValue {
  favoriteCodes: string[];
  isFavorite: (code: string) => boolean;
  toggleFavorite: (code: string) => void;
  removeFavorite: (code: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

function normalizeFavoriteCodes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(new Set(
    value.filter((code): code is string => typeof code === 'string' && /^[A-Z]{3}$/.test(code)),
  ));
}

function readFavorites(): string[] {
  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? normalizeFavoriteCodes(JSON.parse(stored)) : [];
  } catch (_error) {
    return [];
  }
}

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps): JSX.Element {
  const [favoriteCodes, setFavoriteCodes] = useState<string[]>(readFavorites);

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteCodes));
    } catch (_error) {
      // The selected countries remain available during this browser session.
    }
  }, [favoriteCodes]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage &&
          (event.key === FAVORITES_STORAGE_KEY || event.key === null)) {
        setFavoriteCodes(readFavorites());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isFavorite = useCallback(
    (code: string) => favoriteCodes.includes(code),
    [favoriteCodes],
  );

  const toggleFavorite = useCallback((code: string) => {
    if (!/^[A-Z]{3}$/.test(code)) return;

    setFavoriteCodes((current) => current.includes(code)
      ? current.filter((item) => item !== code)
      : [...current, code]);
  }, []);

  const removeFavorite = useCallback((code: string) => {
    setFavoriteCodes((current) => current.filter((item) => item !== code));
  }, []);

  const value = useMemo(() => ({ favoriteCodes, isFavorite, toggleFavorite, removeFavorite }), [
    favoriteCodes, isFavorite, toggleFavorite, removeFavorite,
  ]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
