import { ChangeEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapResponse } from '../../api/statistics';
import AsyncState from '../AsyncState';
import { useApiResource } from '../../hooks/useApiResource';
import { formatDate, formatNumber } from '../../utils';
import WorldMap from './WorldMap';
import { makeMapMarkers, MapMetric, markerColor, METRIC_LABELS } from './map-utils';

interface WorldMapPanelProps {
  expanded?: boolean;
}

export default function WorldMapPanel({ expanded = false }: WorldMapPanelProps): JSX.Element {
  const [metric, setMetric] = useState<MapMetric>('totalCases');
  const result = useApiResource<MapResponse>('/map');
  const countries = result.data?.items;
  const markers = useMemo(() => makeMapMarkers(countries || [], metric), [countries, metric]);
  const isAvailable = result.data && markers.length > 0;

  const changeMetric = (event: ChangeEvent<HTMLSelectElement>) => {
    setMetric(event.target.value as MapMetric);
  };

  return (
    <section className="surface-panel map-panel" aria-labelledby="world-map-title">
      <div className="panel-heading map-panel__heading">
        <div>
          <p className="eyebrow eyebrow--muted">GLOBAL COVERAGE</p>
          <h2 id="world-map-title">COVID-19 world map</h2>
        </div>
        <div className="map-panel__actions">
          <label className="field map-metric-select">
            <span>Map indicator</span>
            <select aria-label="Map indicator" value={metric} onChange={changeMetric}>
              {(Object.keys(METRIC_LABELS) as MapMetric[]).map((key) => (
                <option key={key} value={key}>{METRIC_LABELS[key]}</option>
              ))}
            </select>
          </label>
          {!expanded && <Link className="action-link" to="/map">Open full map <span aria-hidden="true">→</span></Link>}
        </div>
      </div>
      {result.loading && <AsyncState message="Loading map statistics…" />}
      {result.error && <AsyncState error={result.error} retry={result.retry} />}
      {result.data && !isAvailable && <AsyncState message="No geographical data are available for this indicator." />}
      {isAvailable && (
        <>
          <WorldMap markers={markers} metric={metric} large={expanded} />
          <div className="map-panel__footer">
            <span className="map-legend"><span className="map-legend__dot" style={{ backgroundColor: markerColor(metric) }} aria-hidden="true" /> Circle size reflects {METRIC_LABELS[metric].toLowerCase()}.</span>
            <span>{formatNumber(markers.length)} locations · Observation: {formatDate(result.data?.date)}</span>
          </div>
          <p className="map-panel__note">Select a circle to view reported figures and open the country page. Use the zoom controls to explore the map.</p>
        </>
      )}
    </section>
  );
}
