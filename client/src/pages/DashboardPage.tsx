import { Link } from 'react-router-dom';
import { CountriesResponse, DatasetMetadata, GlobalStatistics } from '../api/statistics';
import ApiStatus from '../components/ApiStatus';
import AsyncState from '../components/AsyncState';
import CountryTable from '../components/CountryTable';
import StatisticsCard from '../components/StatisticsCard';
import { useApiResource } from '../hooks/useApiResource';
import { formatDate, formatNumber } from '../utils';

export default function DashboardPage(): JSX.Element {
  const summary = useApiResource<GlobalStatistics>('/summary');
  const countries = useApiResource<CountriesResponse>('/countries?sortBy=totalCases&limit=6');
  const metadata = useApiResource<DatasetMetadata>('/meta');
  const leading = countries.data?.items.filter((country) => country.totalCases !== null) || [];
  const maxCases = Math.max(0, ...leading.map((country) => country.totalCases || 0));

  return (
    <>
      <section className="dashboard-intro">
        <div className="container dashboard-intro__inner">
          <div>
            <p className="eyebrow">GLOBAL HEALTH OVERVIEW</p>
            <h1>COVID-19 Dashboard</h1>
            <p className="dashboard-intro__description">Worldwide reported cases and deaths, with a closer look at the countries behind the numbers.</p>
            <div className="overview-meta">
              <span>Reporting date: <strong>{formatDate(summary.data?.date)}</strong></span>
              <ApiStatus />
            </div>
          </div>
          <div className="intro-aside" aria-hidden="true">
            <span className="intro-aside__symbol">+</span>
            <span>GLOBAL DATA</span>
            <strong>COVID-19</strong>
            <small>Statistics and country insights</small>
          </div>
        </div>
      </section>

      <main className="container page-content">
        <div className="section-header">
          <div>
            <p className="eyebrow eyebrow--muted">AT A GLANCE</p>
            <h2>Worldwide statistics</h2>
          </div>
          <span className="subtle-label">Confirmed reported figures</span>
        </div>

        {summary.loading && <AsyncState />}
        {summary.error && <AsyncState error={summary.error} retry={summary.retry} />}
        {summary.data && (
          <div className="stats-grid">
            <StatisticsCard title="Total confirmed cases" value={summary.data.totalCases} change={summary.data.newCases} accent="blue" />
            <StatisticsCard title="Total deaths" value={summary.data.totalDeaths} change={summary.data.newDeaths} accent="red" />
            <StatisticsCard title="Cases per million" value={summary.data.casesPerMillion} precision={1} accent="teal" />
            <StatisticsCard title="Case fatality ratio" value={summary.data.caseFatalityRatio} precision={2} suffix="%" accent="amber" />
          </div>
        )}

        <div className="dashboard-columns">
          <section className="surface-panel" aria-labelledby="ranking-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow eyebrow--muted">COUNTRY COMPARISON</p>
                <h2 id="ranking-title">Most reported cases</h2>
              </div>
              <Link className="action-link" to="/countries">View countries <span aria-hidden="true">→</span></Link>
            </div>
            {countries.loading && <AsyncState />}
            {countries.error && <AsyncState error={countries.error} retry={countries.retry} />}
            {countries.data && leading.length === 0 && <AsyncState message="No reported figures are available." />}
            {leading.length > 0 && (
              <div className="ranking-list">
                {leading.map((country, index) => (
                  <div className="ranking-item" key={country.code}>
                    <div className="ranking-item__heading">
                      <span className="ranking-number">{String(index + 1).padStart(2, '0')}</span>
                      <Link to={`/countries/${country.code}`}>{country.name}</Link>
                      <strong>{formatNumber(country.totalCases)}</strong>
                    </div>
                    <div className="ranking-track"><div className="ranking-track__fill" style={{ width: `${maxCases > 0 ? ((country.totalCases || 0) / maxCases) * 100 : 0}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="surface-panel insight-panel">
            <p className="eyebrow eyebrow--muted">DATA COVERAGE</p>
            <h2>Explore the numbers</h2>
            <p>Compare reported totals across countries and review the date of each available observation.</p>
            <div className="insight-divider" />
            <div className="insight-stat"><strong>{metadata.data ? formatNumber(metadata.data.countriesCount) : '—'}</strong><span>countries and territories</span></div>
            <div className="insight-stat"><strong>{formatDate(metadata.data?.dataDate)}</strong><span>latest global observation</span></div>
            <Link className="primary-link" to="/countries">Browse all countries <span aria-hidden="true">→</span></Link>
          </aside>
        </div>

        <section className="surface-panel country-preview" aria-labelledby="country-preview-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow eyebrow--muted">LATEST REPORTS</p>
              <h2 id="country-preview-title">Country statistics</h2>
            </div>
            <Link className="action-link" to="/countries">All countries <span aria-hidden="true">→</span></Link>
          </div>
          {countries.loading && <AsyncState />}
          {countries.error && <AsyncState error={countries.error} retry={countries.retry} />}
          {countries.data && <CountryTable countries={countries.data.items} />}
        </section>

        <p className="source-note">Source: <a href="https://ourworldindata.org/coronavirus" target="_blank" rel="noopener noreferrer">Our World in Data</a>. Reporting figures may be revised; dates refer to the original observations, not the time the page was opened.</p>
      </main>
    </>
  );
}
