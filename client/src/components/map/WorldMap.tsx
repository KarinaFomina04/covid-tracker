import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import { useHistory } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { formatDate, formatNumber } from '../../utils';
import { MapMarker, MapMetric, markerColor, markerRadius, METRIC_LABELS } from './map-utils';

interface WorldMapProps {
  markers: MapMarker[];
  metric: MapMetric;
  large?: boolean;
}

function popupContent(marker: MapMarker, metric: MapMetric, openCountry: (code: string) => void): HTMLElement {
  const content = document.createElement('div');
  content.className = 'map-popup';

  const country = document.createElement('strong');
  country.className = 'map-popup__name';
  country.textContent = marker.name;
  content.appendChild(country);

  const value = document.createElement('span');
  value.className = 'map-popup__value';
  value.textContent = `${METRIC_LABELS[metric]}: ${formatNumber(marker[metric], metric.endsWith('Million') ? 1 : 0)}`;
  content.appendChild(value);

  const date = document.createElement('span');
  date.className = 'map-popup__date';
  date.textContent = `Report date: ${formatDate(marker.date)}`;
  content.appendChild(date);

  const link = document.createElement('a');
  link.href = `/countries/${marker.code}`;
  link.textContent = 'Country statistics →';
  link.addEventListener('click', (event: MouseEvent) => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      openCountry(marker.code);
    }
  });
  content.appendChild(link);
  return content;
}

export default function WorldMap({ markers, metric, large = false }: WorldMapProps): JSX.Element {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const history = useHistory();

  useEffect(() => {
    if (!element.current) return undefined;

    const instance = L.map(element.current, {
      center: [19, 10],
      zoom: 2,
      minZoom: 2,
      maxZoom: 7,
      worldCopyJump: true,
      preferCanvas: true,
      scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 7,
    }).addTo(instance);

    markerLayer.current = L.layerGroup().addTo(instance);
    map.current = instance;

    return () => {
      instance.remove();
      map.current = null;
      markerLayer.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = markerLayer.current;
    if (!layer) return;

    layer.clearLayers();
    const maximum = Math.max(1, ...markers.map((marker) => marker[metric] || 0));
    const color = markerColor(metric);

    markers.forEach((marker) => {
      const value = marker[metric];
      if (value === null) return;

      const circle = L.circleMarker([marker.latitude, marker.longitude], {
        radius: markerRadius(value, maximum),
        color,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.55,
      });
      circle.bindPopup(popupContent(marker, metric, (code) => history.push(`/countries/${code}`)));
      circle.bindTooltip(marker.name, { direction: 'top', offset: L.point(0, -6) });
      circle.addTo(layer);
    });
  }, [history, markers, metric]);

  return (
    <div
      ref={element}
      className={`world-map ${large ? 'world-map--large' : ''}`}
      role="region"
      aria-label={`COVID-19 world map showing ${METRIC_LABELS[metric].toLowerCase()}`}
    />
  );
}
