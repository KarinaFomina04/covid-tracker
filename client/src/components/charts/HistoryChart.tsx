import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js';
import { HistoryResponse } from '../../api/statistics';
import { useApiResource } from '../../hooks/useApiResource';
import { formatDate, formatNumber } from '../../utils';
import { downloadCsv, historyToCsv } from '../../utils/csv-export';
import AsyncState from '../AsyncState';
import { buildChartSeries, ChartMetric, ChartMode } from './chart-series';

interface HistoryChartProps {
  path: string;
  title: string;
  population: number | null;
}

type Period = '7d' | '30d' | '90d' | 'all';

function abbreviate(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (magnitude >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

export default function HistoryChart({ path, title, population }: HistoryChartProps): JSX.Element {
  const [period, setPeriod] = useState<Period>('30d');
  const [metric, setMetric] = useState<ChartMetric>('cases');
  const [mode, setMode] = useState<ChartMode>('total');
  const [perMillion, setPerMillion] = useState(false);
  const [average, setAverage] = useState(true);
  const canvas = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const result = useApiResource<HistoryResponse>(`${path}?period=${period}`);
  const series = useMemo(
    () => buildChartSeries(
      Array.isArray(result.data?.points) ? result.data!.points : [],
      { metric, mode, perMillion, average, population },
    ),
    [result.data, metric, mode, perMillion, average, population],
  );

  const handleExport = () => {
    if (!result.data || result.loading || !series.hasValues) return;
    const code = result.data.code.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const format = mode === 'daily' && average ? '7-day-average' : mode;
    const scale = perMillion ? 'per-million' : 'absolute';
    downloadCsv(`covid-19-${code}-${metric}-${format}-${scale}-${period}.csv`, historyToCsv(series));
  };

  useEffect(() => {
    if (!canvas.current || !series.hasValues) return;
    const context = canvas.current.getContext('2d');
    if (!context) return;

    const chart = new Chart(context, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: '',
          data: [] as number[],
          borderColor: '#148eab',
          backgroundColor: 'rgba(20, 142, 171, 0.07)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: false,
          lineTension: 0.15,
          spanGaps: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: false },
        tooltips: { intersect: false, mode: 'index' },
        hover: { intersect: false, mode: 'nearest' },
        scales: {
          xAxes: [{ gridLines: { display: false }, ticks: { maxTicksLimit: 9, maxRotation: 0 } }],
          yAxes: [{ ticks: { callback: (value: number | string) => abbreviate(Number(value)) } }],
        },
      },
    });
    chartInstance.current = chart;
    return () => {
      chart.destroy();
      chartInstance.current = null;
    };
  }, [series.hasValues]);

  useEffect(() => {
    const chart = chartInstance.current;
    if (!chart || !series.hasValues || !chart.data.datasets) return;
    chart.data.labels = series.dates;
    chart.data.datasets[0].data = series.values as number[];
    chart.data.datasets[0].label = series.label;
    chart.data.datasets[0].borderColor = metric === 'cases' ? '#148eab' : '#d66c77';
    chart.update(0);
  }, [series, metric]);

  return (
    <section className="surface-panel history-panel" aria-label={title}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow eyebrow--muted">HISTORICAL TRENDS</p>
          <h2>{title}</h2>
        </div>
        <div className="panel-heading__actions">
          <span className="history-caption">Our World in Data</span>
          <button
            type="button"
            className="export-button"
            disabled={!result.data || result.loading || !series.hasValues}
            onClick={handleExport}
          >
            Download CSV
          </button>
        </div>
      </div>
      <div className="history-controls">
        <label className="field">
          <span>Period</span>
          <select aria-label="Chart period" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
            <option value="all">All time</option>
          </select>
        </label>
        <label className="field">
          <span>Indicator</span>
          <select aria-label="Chart indicator" value={metric} onChange={(event) => setMetric(event.target.value as ChartMetric)}>
            <option value="cases">Confirmed cases</option>
            <option value="deaths">Reported deaths</option>
          </select>
        </label>
        <label className="field">
          <span>Series</span>
          <select aria-label="Chart series" value={mode} onChange={(event) => setMode(event.target.value as ChartMode)}>
            <option value="daily">New reports</option>
            <option value="total">Cumulative</option>
          </select>
        </label>
        <label className="field">
          <span>Scale</span>
          <select aria-label="Chart scale" value={perMillion ? 'perMillion' : 'absolute'}
            onChange={(event) => setPerMillion(event.target.value === 'perMillion')}>
            <option value="absolute">Absolute</option>
            <option value="perMillion">Per million</option>
          </select>
        </label>
      </div>
      {mode === 'daily' && (
        <label className="history-average">
          <input type="checkbox" checked={average} onChange={(event) => setAverage(event.target.checked)} />
          7-day moving average
        </label>
      )}
      {result.loading && <AsyncState />}
      {result.error && <AsyncState error={result.error} retry={result.retry} />}
      {result.data && !result.loading && !result.error && (
        <>
          {perMillion && (!population || population <= 0) && (
            <p className="history-warning">Population is unavailable for this location.</p>
          )}
          {!series.hasValues ? (
            <AsyncState message="No historical observations are available for the selected metric and period." />
          ) : (
            <>
              <div className="history-canvas">
                <canvas ref={canvas} role="img" aria-label={`${series.label} from ${result.data.from} to ${result.data.to}`}>
                  Historical statistics chart
                </canvas>
              </div>
              <details className="chart-data-details">
                <summary>View recent chart values as a table</summary>
                <div className="table-scroll" role="region" aria-label="Recent historical observations" tabIndex={0}>
                  <table className="data-table">
                    <caption className="sr-only">Last 30 observations for {series.label}</caption>
                    <thead><tr><th scope="col">Date</th><th scope="col" className="numeric">{series.label}</th></tr></thead>
                    <tbody>
                      {series.dates.slice(-30).map((date, index) => (
                        <tr key={date}>
                          <td>{formatDate(date)}</td>
                          <td className="numeric">{formatNumber(series.values[series.values.length - Math.min(30, series.values.length) + index], perMillion ? 2 : 1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
          <p className="history-footnote">
            Observations: {formatDate(result.data.from)} – {formatDate(result.data.to)}.
            Latest available: {formatDate(result.data.lastObservation)}. Missing observations are not treated as zero.
          </p>
        </>
      )}
    </section>
  );
}
