import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ComparisonMetric,
  ComparisonResponse,
  ComparisonScale,
  MapResponse,
} from '../api/statistics';
import AsyncState from '../components/AsyncState';
import ComparisonChart from '../components/compare/ComparisonChart';
import { useApiResource } from '../hooks/useApiResource';

const MAX_COUNTRIES = 4;
type Period = '7d' | '30d' | '90d' | 'all' | 'custom';

export default function ComparePage(): JSX.Element {
  const [codes, setCodes] = useState(['USA', 'ITA']);
  const [metric, setMetric] = useState<ComparisonMetric>('totalCases');
  const [scale, setScale] = useState<ComparisonScale>('absolute');
  const [period, setPeriod] = useState<Period>('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const countries = useApiResource<MapResponse>('/map');
  const options = useMemo(() =>
    (countries.data?.items || []).slice().sort((a, b) => a.name.localeCompare(b.name)),
  [countries.data]);

  const params = new URLSearchParams({ codes: codes.join(','), metric, scale });
  if (period !== 'custom') params.set('period', period);
  if (period === 'custom' && from) params.set('from', from);
  if (period === 'custom' && to) params.set('to', to);
  const result = useApiResource<ComparisonResponse>(`/compare?${params.toString()}`);

  const updateCountry = (index: number, code: string) => {
    if (codes.some((item, position) => position !== index && item === code)) return;
    setCodes((current) => current.map((item, position) => position === index ? code : item));
  };
  const addCountry = () => {
    const available = options.find((item) => !codes.includes(item.code));
    if (available && codes.length < MAX_COUNTRIES) setCodes((current) => [...current, available.code]);
  };
  const removeCountry = (index: number) => {
    if (codes.length > 2) setCodes((current) => current.filter((_, position) => position !== index));
  };

  return (
    <main id="main-content" tabIndex={-1} className="container page-content">
      <header className="page-heading">
        <p className="eyebrow eyebrow--muted">ANALYTICS</p>
        <h1>Compare countries</h1>
        <p>Follow the same statistic across two to four countries, using a shared reporting period and scale.</p>
      </header>

      <section className="surface-panel comparison-filters" aria-label="Comparison settings">
        <div className="panel-heading">
          <div><p className="eyebrow eyebrow--muted">COUNTRY SELECTION</p><h2>Choose countries</h2></div>
          <span className="history-caption">Up to four countries</span>
        </div>
        {countries.error && <AsyncState error={countries.error} retry={countries.retry} />}
        {countries.loading && <p className="history-footnote">Loading the country directory…</p>}
        <div className="comparison-country-list">
          {codes.map((code, index) => (
            <div className="comparison-country-field" key={index}>
              <label className="field">
                <span>Country {index + 1}</span>
                <select aria-label={`Country ${index + 1}`} value={code} onChange={(event) => updateCountry(index, event.target.value)}>
                  {!options.some((country) => country.code === code) && <option value={code}>{code}</option>}
                  {options.map((country) => (
                    <option key={country.code} value={country.code} disabled={codes.includes(country.code) && country.code !== code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </label>
              {codes.length > 2 && (
                <button className="comparison-remove" type="button" aria-label={`Remove country ${index + 1}`} onClick={() => removeCountry(index)}>Remove</button>
              )}
            </div>
          ))}
        </div>
        <button className="comparison-add" type="button" aria-label="Add country" onClick={addCountry} disabled={codes.length >= MAX_COUNTRIES || !options.some((item) => !codes.includes(item.code))}>+ Add country</button>
        <div className="comparison-options">
          <label className="field">
            <span>Indicator</span>
            <select aria-label="Comparison indicator" value={metric} onChange={(event) => setMetric(event.target.value as ComparisonMetric)}>
              <option value="totalCases">Total confirmed cases</option>
              <option value="newCases">Daily new cases</option>
              <option value="newCasesAverage">New cases (7-day average)</option>
              <option value="totalDeaths">Total deaths</option>
              <option value="newDeaths">Daily new deaths</option>
              <option value="newDeathsAverage">New deaths (7-day average)</option>
            </select>
          </label>
          <label className="field">
            <span>Scale</span>
            <select aria-label="Comparison scale" value={scale} onChange={(event) => setScale(event.target.value as ComparisonScale)}>
              <option value="absolute">Absolute</option>
              <option value="perMillion">Per million</option>
            </select>
          </label>
          <label className="field">
            <span>Period</span>
            <select aria-label="Comparison period" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
              <option value="all">All available</option>
              <option value="custom">Custom dates</option>
            </select>
          </label>
        </div>
        {period === 'custom' && (
          <div className="comparison-date-range">
            <label className="field"><span>From</span><input aria-label="Comparison from date" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
            <label className="field"><span>To</span><input aria-label="Comparison to date" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
          </div>
        )}
      </section>

      {result.loading && <AsyncState />}
      {result.error && <AsyncState error={result.error} retry={result.retry} />}
      {result.data && <ComparisonChart data={result.data} />}
      <p className="source-note">Source: <a href="https://ourworldindata.org/coronavirus" target="_blank" rel="noopener noreferrer">Our World in Data</a>. See <Link to="/countries">all countries</Link> for detailed figures. Periods are based on the latest shared observation, not the current date.</p>
    </main>
  );
}
