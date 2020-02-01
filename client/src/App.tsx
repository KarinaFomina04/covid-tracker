import ApiStatus from './components/ApiStatus';
import './App.css';

const sections = [
  {
    number: '01',
    title: 'Global overview',
    text: 'Worldwide confirmed cases, deaths, and daily reported changes.',
  },
  {
    number: '02',
    title: 'Country statistics',
    text: 'Country-level data with clear dates and comparable indicators.',
  },
  {
    number: '03',
    title: 'Historical trends',
    text: 'Explore how reported figures change over time.',
  },
];

export default function App(): JSX.Element {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container site-header__inner">
          <a className="brand" href="/" aria-label="COVID-19 Tracker home">
            <span className="brand__mark" aria-hidden="true">+</span>
            <span>COVID-19 <strong>Tracker</strong></span>
          </a>
          <a className="header-link" href="#about">About the project</a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero__content">
            <p className="eyebrow">CORONAVIRUS MONITORING</p>
            <h1>COVID-19 statistics, clearly presented.</h1>
            <p className="hero__description">
              A single place to follow the global impact of COVID-19 and explore public health data
              across countries and time.
            </p>
            <ApiStatus />
          </div>
        </section>

        <section className="container overview" aria-labelledby="overview-title">
          <div className="section-heading">
            <p className="eyebrow eyebrow--muted">DATA EXPLORER</p>
            <h2 id="overview-title">Explore the outbreak</h2>
          </div>
          <div className="feature-grid">
            {sections.map(({ number, title, text }) => (
              <article className="feature-card" key={number}>
                <span className="feature-card__number">{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="container info-panel" id="about" aria-labelledby="about-title">
          <div>
            <p className="eyebrow eyebrow--muted">ABOUT THE DATA</p>
            <h2 id="about-title">Transparency matters</h2>
          </div>
          <p>
            Epidemiological figures are subject to reporting delays and revisions. Every published
            observation should be interpreted together with its reporting date and source.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <span>© 2020 COVID-19 Tracker</span>
          <span>Public health data dashboard</span>
        </div>
      </footer>
    </div>
  );
}
