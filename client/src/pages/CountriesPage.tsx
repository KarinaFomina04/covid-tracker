import { ChangeEvent, useEffect, useState } from 'react';
import { CountriesResponse, CountrySort } from '../api/statistics';
import AsyncState from '../components/AsyncState';
import CountryTable from '../components/CountryTable';
import { useApiResource } from '../hooks/useApiResource';
import { countriesToCsv, downloadCsv } from '../utils/csv-export';

const continents = ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];
const PAGE_SIZE = 12;

export default function CountriesPage(): JSX.Element {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState('');
  const [sortBy, setSortBy] = useState<CountrySort>('totalCases');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const params = new URLSearchParams({
    search, continent, sortBy, order, page: String(page), limit: String(PAGE_SIZE),
  });
  const response = useApiResource<CountriesResponse>(`/countries?${params.toString()}`);
  const handleContinent = (event: ChangeEvent<HTMLSelectElement>) => {
    setContinent(event.target.value);
    setPage(1);
  };
  const handleExport = () => {
    if (!response.data || response.loading) return;
    const csv = countriesToCsv(response.data.items);
    downloadCsv(`covid-19-countries-page-${response.data.page}.csv`, csv);
  };
  const handleSort = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as CountrySort;
    setSortBy(value);
    setPage(1);
  };

  return (
    <main id="main-content" tabIndex={-1} className="container page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow eyebrow--muted">COUNTRY DIRECTORY</p>
          <h1>Explore by country</h1>
          <p>Search, sort and compare the latest available COVID-19 observations for individual countries.</p>
        </div>
      </div>

      <section className="surface-panel country-directory" aria-label="Country statistics directory">
        <div className="filters-grid">
          <label className="field field--search">
            <span>Search countries</span>
            <input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Type a country name" />
          </label>
          <label className="field">
            <span>Continent</span>
            <select value={continent} onChange={handleContinent}>
              <option value="">All continents</option>
              {continents.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Sort by</span>
            <select value={sortBy} onChange={handleSort}>
              <option value="totalCases">Total cases</option>
              <option value="newCases">New cases</option>
              <option value="totalDeaths">Total deaths</option>
              <option value="newDeaths">New deaths</option>
              <option value="casesPerMillion">Cases per million</option>
              <option value="deathsPerMillion">Deaths per million</option>
              <option value="name">Country name</option>
            </select>
          </label>
          <label className="field">
            <span>Order</span>
            <select value={order} onChange={(event) => { setOrder(event.target.value as 'asc' | 'desc'); setPage(1); }}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
        </div>

        <div className="results-heading">
          <p>{response.data ? `${response.data.total} results` : 'Country statistics'}</p>
          <div className="results-heading__actions">
            <span>Figures reflect their respective reporting dates</span>
            <button
              className="export-button"
              type="button"
              disabled={!response.data || response.loading || response.data.items.length === 0}
              onClick={handleExport}
            >
              Export current page CSV
            </button>
          </div>
        </div>
        {response.loading && <AsyncState />}
        {response.error && <AsyncState error={response.error} retry={response.retry} />}
        {response.data && <CountryTable countries={response.data.items} />}

        {response.data && response.data.totalPages > 1 && (
          <div className="pagination" aria-label="Pagination">
            <span>Page {response.data.page} of {response.data.totalPages}</span>
            <div>
              <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
              <button type="button" disabled={page >= response.data.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
