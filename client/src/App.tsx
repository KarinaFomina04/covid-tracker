import { BrowserRouter, Link, NavLink, Route, Switch } from 'react-router-dom';
import CountriesPage from './pages/CountriesPage';
import CountryDetailsPage from './pages/CountryDetailsPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="site-header">
          <div className="container site-header__inner">
            <Link className="brand" to="/" aria-label="COVID-19 Tracker home">
              <span className="brand__mark" aria-hidden="true">+</span>
              <span>COVID-19 <strong>Tracker</strong></span>
            </Link>
            <nav className="site-nav" aria-label="Main navigation">
              <NavLink exact to="/" activeClassName="site-nav__link--active" className="site-nav__link">Dashboard</NavLink>
              <NavLink to="/countries" activeClassName="site-nav__link--active" className="site-nav__link">Countries</NavLink>
            </nav>
          </div>
        </header>

        <Switch>
          <Route exact path="/" component={DashboardPage} />
          <Route exact path="/countries" component={CountriesPage} />
          <Route exact path="/countries/:code" component={CountryDetailsPage} />
          <Route component={NotFoundPage} />
        </Switch>

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
