import { formatNumber, formatSigned } from '../utils';

interface StatisticsCardProps {
  title: string;
  value: number | null;
  change?: number | null;
  accent?: 'blue' | 'red' | 'teal' | 'amber';
  precision?: number;
  suffix?: string;
}

export default function StatisticsCard({
  title, value, change, accent = 'blue', precision = 0, suffix = '',
}: StatisticsCardProps): JSX.Element {
  return (
    <article className={`stat-card stat-card--${accent}`}>
      <p className="stat-card__title">{title}</p>
      <strong className="stat-card__value">{formatNumber(value, precision)}{value === null ? '' : suffix}</strong>
      {change !== undefined && (
        <span className="stat-card__change">{formatSigned(change)} new reported</span>
      )}
    </article>
  );
}
