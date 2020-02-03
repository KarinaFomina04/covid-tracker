import { Link, useParams } from 'react-router-dom';
import { CountryStatistics } from '../api/statistics';
import AsyncState from '../components/AsyncState';
import StatisticsCard from '../components/StatisticsCard';
import { useApiResource } from '../hooks/useApiResource';
import { formatDate, formatNumber } from '../utils';

export default function CountryDetailsPage(): JSX.Element {
  const { code } = useParams<{ code: string }>();
  const result = useApiResource<CountryStatistics>(`/countries/${encodeURIComponent(code)}`);

  return (
    <main className="container page-content">
      <Link className="back-link" to="/countries"><span aria-hidden="true">←</span> All countries</Link>
      {result.loading && <AsyncState />}
      {result.error && <AsyncState error={result.error} retry={result.retry} />}
      {result.data && (
        <>
          <header className="country-header">
            <div>
              <p className="eyebrow eyebrow--muted">COUNTRY PROFILE / {result.data.code}</p>
              <h1>{result.data.name}</h1>
              <p>{result.data.continent || 'Continent unavailable'} · Statistics reported on {formatDate(result.data.date)}</p>
            </div>
            <span className="country-header__code">{result.data.code}</span>
          </header>

          <div className="stats-grid">
            <StatisticsCard title="Confirmed cases" value={result.data.totalCases} change={result.data.newCases} accent="blue" />
            <StatisticsCard title="Reported deaths" value={result.data.totalDeaths} change={result.data.newDeaths} accent="red" />
            <StatisticsCard title="Cases per million" value={result.data.casesPerMillion} precision={1} accent="teal" />
            <StatisticsCard title="Deaths per million" value={result.data.deathsPerMillion} precision={1} accent="amber" />
          </div>

          <section className="surface-panel country-facts" aria-labelledby="facts-title">
            <div className="panel-heading"><div><p className="eyebrow eyebrow--muted">COUNTRY INFORMATION</p><h2 id="facts-title">Key figures</h2></div></div>
            <dl>
              <div><dt>Population</dt><dd>{formatNumber(result.data.population)}</dd></div>
              <div><dt>Continent</dt><dd>{result.data.continent || 'Not available'}</dd></div>
              <div><dt>Country code</dt><dd>{result.data.code}</dd></div>
              <div><dt>Report date</dt><dd>{formatDate(result.data.date)}</dd></div>
            </dl>
          </section>
          <p className="source-note">Source: <a href="https://ourworldindata.org/coronavirus" target="_blank" rel="noopener noreferrer">Our World in Data</a>. Figures can be adjusted by the source as reporting improves.</p>
        </>
      )}
    </main>
  );
}
