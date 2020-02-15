import WorldMapPanel from '../components/map/WorldMapPanel';

export default function WorldMapPage(): JSX.Element {
  return (
    <main id="main-content" tabIndex={-1} className="container page-content">
      <header className="page-heading">
        <p className="eyebrow eyebrow--muted">GEOGRAPHICAL OVERVIEW</p>
        <h1>Global outbreak map</h1>
        <p>Explore confirmed cases and deaths across countries and territories. Reported figures are displayed at each country's geographic centre.</p>
      </header>
      <WorldMapPanel expanded />
      <p className="source-note">
        Statistics: <a href="https://ourworldindata.org/coronavirus" target="_blank" rel="noopener noreferrer">Our World in Data</a>. Map tiles: OpenStreetMap contributors. Values reflect the most recent observations available from the source.
      </p>
    </main>
  );
}
