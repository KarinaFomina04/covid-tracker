import { Link } from 'react-router-dom';
import { CountryStatistics } from '../api/statistics';
import FavoriteButton from './FavoriteButton';
import { formatDate, formatNumber, formatSigned } from '../utils';

interface CountryTableProps {
  countries: CountryStatistics[];
}

export default function CountryTable({ countries }: CountryTableProps): JSX.Element {
  if (countries.length === 0) {
    return <div className="notice">No countries match the selected criteria.</div>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Country</th>
            <th scope="col" className="numeric">Total cases</th>
            <th scope="col" className="numeric">New cases</th>
            <th scope="col" className="numeric">Total deaths</th>
            <th scope="col" className="numeric">Cases / 1M</th>
            <th scope="col">Report date</th>
            <th scope="col">Favorite</th>
          </tr>
        </thead>
        <tbody>
          {countries.map((country) => (
            <tr key={country.code}>
              <td>
                <Link className="country-name" to={`/countries/${country.code}`}>
                  <span className="country-code" aria-hidden="true">{country.code.slice(0, 2)}</span>
                  {country.name}
                </Link>
              </td>
              <td className="numeric prominent-number">{formatNumber(country.totalCases)}</td>
              <td className="numeric">{formatSigned(country.newCases)}</td>
              <td className="numeric">{formatNumber(country.totalDeaths)}</td>
              <td className="numeric">{formatNumber(country.casesPerMillion, 1)}</td>
              <td className="date-cell">{formatDate(country.date)}</td>
              <td><FavoriteButton code={country.code} name={country.name} compact /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
