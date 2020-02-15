import { Link } from 'react-router-dom';
import { CountryStatistics } from '../api/statistics';
import AsyncState from '../components/AsyncState';
import FavoriteButton from '../components/FavoriteButton';
import { useFavorites } from '../context/FavoritesContext';
import { useApiResource } from '../hooks/useApiResource';
import { formatDate, formatNumber } from '../utils';

interface FavoriteCountryProps {
  code: string;
}

function FavoriteCountry({ code }: FavoriteCountryProps): JSX.Element {
  const result = useApiResource<CountryStatistics>(`/countries/${code}`);
  const country = result.data;

  return (
    <article className="favorite-country" aria-label={`Favorite country ${code}`}>
      <div className="favorite-country__heading">
        <div>
          <span className="country-code" aria-hidden="true">{code.slice(0, 2)}</span>
          {country
            ? <Link className="country-name" to={`/countries/${code}`}>{country.name}</Link>
            : <strong>{code}</strong>}
        </div>
        <FavoriteButton code={code} name={country?.name || code} compact />
      </div>
      {result.loading && <AsyncState />}
      {result.error && <AsyncState error={result.error} retry={result.retry} />}
      {country && (
        <dl className="favorite-country__figures">
          <div><dt>Confirmed cases</dt><dd>{formatNumber(country.totalCases)}</dd></div>
          <div><dt>Reported deaths</dt><dd>{formatNumber(country.totalDeaths)}</dd></div>
          <div><dt>Report date</dt><dd>{formatDate(country.date)}</dd></div>
        </dl>
      )}
    </article>
  );
}

export default function FavoritesPage(): JSX.Element {
  const { favoriteCodes } = useFavorites();

  return (
    <main id="main-content" tabIndex={-1} className="container page-content">
      <div className="page-heading">
        <p className="eyebrow eyebrow--muted">MY COUNTRIES</p>
        <h1>Favorite countries</h1>
        <p>Keep track of the countries you follow most closely. Your selection is saved in this browser.</p>
      </div>
      {favoriteCodes.length === 0 ? (
        <div className="surface-panel">
          <p className="notice">No favorite countries yet. Use the star next to a country to add it here.</p>
          <Link className="primary-link" to="/countries">Browse countries</Link>
        </div>
      ) : (
        <section className="favorites-grid" aria-label="Saved countries">
          {favoriteCodes.map((code) => <FavoriteCountry code={code} key={code} />)}
        </section>
      )}
    </main>
  );
}
