import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Switch } from 'react-router-dom';
import { FavoritesProvider, useFavorites } from './context/FavoritesContext';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

const CountriesPage = lazy(() => import('./pages/CountriesPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const CountryDetailsPage = lazy(() => import('./pages/CountryDetailsPage'));
const WorldMapPage = lazy(() => import('./pages/WorldMapPage'));

function AppLayout(): JSX.Element {
  const { favoriteCodes } = useFavorites();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <header className="site-header">
          <div className="container site-header__inner">
            <Link className="brand" to="/" aria-label="COVID-19 Tracker home" onClick={closeMenu}>
              <span className="brand__mark" aria-hidden="true">+</span>
              <span>COVID-19 <strong>Tracker</strong></span>
            </Link>
            <button
              className="menu-toggle"
              type="button"
              aria-controls="primary-navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
              <span>{menuOpen ? 'Close menu' : 'Open menu'}</span>
            </button>
            <nav
              id="primary-navigation"
              className={`site-nav${menuOpen ? ' site-nav--open' : ''}`}
              aria-label="Main navigation"
            >
              <NavLink exact to="/" activeClassName="site-nav__link--active" className="site-nav__link" onClick={closeMenu}>Dashboard</NavLink>
              <NavLink to="/countries" activeClassName="site-nav__link--active" className="site-nav__link" onClick={closeMenu}>Countries</NavLink>
              <NavLink to="/favorites" activeClassName="site-nav__link--active" className="site-nav__link" onClick={closeMenu}>Favorites{favoriteCodes.length > 0 ? ` (${favoriteCodes.length})` : ''}</NavLink>
              <NavLink to="/compare" activeClassName="site-nav__link--active" className="site-nav__link" onClick={closeMenu}>Compare</NavLink>
              <NavLink to="/map" activeClassName="site-nav__link--active" className="site-nav__link" onClick={closeMenu}>World map</NavLink>
            </nav>
          </div>
        </header>

        <Suspense fallback={<main id="main-content" tabIndex={-1} className="container page-content" role="status">Loading page…</main>}>
          <Switch>
            <Route exact path="/" component={DashboardPage} />
            <Route exact path="/countries" component={CountriesPage} />
            <Route exact path="/map" component={WorldMapPage} />
            <Route exact path="/favorites" component={FavoritesPage} />
            <Route exact path="/compare" component={ComparePage} />
            <Route exact path="/countries/:code" component={CountryDetailsPage} />
            <Route component={NotFoundPage} />
          </Switch>
        </Suspense>

        <footer className="site-footer">
          <div className="container site-footer__inner">
            <span>© 2020 COVID-19 Tracker</span>
            <span>COVID-19 data from Our World in Data</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default function App(): JSX.Element {
  return <ErrorBoundary><FavoritesProvider><AppLayout /></FavoritesProvider></ErrorBoundary>;
}
