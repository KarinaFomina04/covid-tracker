import { CountryStatistics } from '../api/statistics';
import StatisticsCard from './StatisticsCard';

interface TestingPanelProps {
  country: CountryStatistics;
}

export default function TestingPanel({ country }: TestingPanelProps): JSX.Element {
  const hasTestingData = [country.totalTests, country.newTests, country.positiveRate]
    .some((value) => typeof value === 'number' && Number.isFinite(value));
  const positivity = typeof country.positiveRate === 'number'
    ? country.positiveRate * 100
    : null;

  return (
    <section className="surface-panel testing-panel" aria-labelledby="testing-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow eyebrow--muted">TESTING OVERVIEW</p>
          <h2 id="testing-title">Testing statistics</h2>
        </div>
      </div>
      {hasTestingData ? (
        <div className="stats-grid testing-grid">
          <StatisticsCard title="Total tests" value={country.totalTests ?? null} accent="blue" />
          <StatisticsCard title="New tests" value={country.newTests ?? null} accent="teal" />
          <StatisticsCard title="Tests per 1,000" value={country.testsPerThousand ?? null} precision={2} accent="amber" />
          <StatisticsCard title="Positive test rate" value={positivity} precision={1} suffix="%" accent="red" />
        </div>
      ) : (
        <p className="testing-panel__empty">Testing data is not available for this country.</p>
      )}
      <p className="testing-panel__note">
        Testing figures and definitions vary by country. The testing reporting period may
        differ from the case reporting date.
      </p>
    </section>
  );
}
