import { useEffect, useRef } from 'react';
import Chart from 'chart.js';
import { ComparisonResponse } from '../../api/statistics';
import { formatDate, formatNumber } from '../../utils';
import AsyncState from '../AsyncState';

const SERIES_COLORS = ['#1785a4', '#da6b75', '#6b69aa', '#cf974b'];

function compactNumber(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (magnitude >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export default function ComparisonChart({ data }: { data: ComparisonResponse }): JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hasValues = data.countries.some((country) => country.values.some((value) => value !== null));

  useEffect(() => {
    if (!canvas.current || !hasValues) return;
    const context = canvas.current.getContext('2d');
    if (!context) return;
    const chart = new Chart(context, {
      type: 'line',
      data: {
        labels: data.dates,
        datasets: data.countries.map((country, index) => ({
          label: country.name,
          data: country.values as number[],
          borderColor: SERIES_COLORS[index],
          backgroundColor: SERIES_COLORS[index],
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: false,
          lineTension: 0.1,
          spanGaps: false,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: true, position: 'bottom' },
        tooltips: { mode: 'index', intersect: false },
        hover: { mode: 'nearest', intersect: false },
        scales: {
          xAxes: [{ gridLines: { display: false }, ticks: { maxTicksLimit: 9, maxRotation: 0 } }],
          yAxes: [{ ticks: { callback: (value: number | string) => compactNumber(Number(value)) } }],
        },
      },
    });
    return () => chart.destroy();
  }, [data, hasValues]);

  return (
    <section className="surface-panel comparison-result" aria-label="Country comparison results">
      <div className="panel-heading">
        <div>
          <p className="eyebrow eyebrow--muted">COMPARISON RESULTS</p>
          <h2>Historical trends</h2>
        </div>
        <span className="history-caption">{formatDate(data.from)} – {formatDate(data.to)}</span>
      </div>
      {hasValues ? (
        <div className="comparison-canvas">
          <canvas ref={canvas} role="img" aria-label="Comparison of selected countries over time">
            Historical comparison of selected countries
          </canvas>
        </div>
      ) : <AsyncState message="No comparable values are available for this indicator and period." />}
      <div className="table-scroll">
        <table className="data-table comparison-table">
          <thead><tr><th>Country</th><th className="numeric">Latest available value</th><th>Observation date</th></tr></thead>
          <tbody>
            {data.countries.map((country, index) => (
              <tr key={country.code}>
                <td><span className="comparison-key" style={{ backgroundColor: SERIES_COLORS[index] }} aria-hidden="true" />{country.name}</td>
                <td className="numeric prominent-number">{formatNumber(country.lastValue, data.scale === 'perMillion' ? 2 : 0)}</td>
                <td>{formatDate(country.lastValueDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="history-footnote">Values are aligned by reporting date. Empty observations are shown as gaps. The latest available value for each country can have a different observation date.</p>
    </section>
  );
}
