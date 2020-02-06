import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js';
import { HistoryResponse } from '../../api/statistics';
import { useApiResource } from '../../hooks/useApiResource';
import { formatDate } from '../../utils';
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
  const result = useApiResource<HistoryResponse>(`${path}?period=${period}`);
  const series = useMemo(
    () => buildChartSeries(
      Array.isArray(result.data?.points) ? result.data!.points : [],
      { metric, mode, perMillion, average, population },
    ),
    [result.data, metric, mode, perMillion, average, population],
  );

  useEffect(() => {
    if (!canvas.current || !series.hasValues) return;
    const context = canvas.current.getContext('2d');
    if (!context) return;

    const chart = new Chart(context, {
      type: 'line',
      data: {
        labels: series.dates,
        datasets: [{
          label: series.label,
          data: series.values as number[],
          borderColor: metric === 'cases' ? '#148eab' : '#d66c77',
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
    return () => chart.destroy();
  }, [series, metric]);

  return (
    <section className="surface-panel history-panel" aria-label={title}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow eyebrow--muted">HISTORICAL TRENDS</p>
          <h2>{title}</h2>
        </div>
        <span className="history-caption">Our World in Data</span>
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
            <div className="history-canvas">
              <canvas ref={canvas} role="img" aria-label={`${series.label} from ${result.data.from} to ${result.data.to}`}>
                Historical statistics chart
              </canvas>
            </div>
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
