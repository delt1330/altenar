import React from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export type MapMarker = {
  name: string;
  coordinates: [number, number];
  active: boolean;
  label?: string;
  year?: string;
};

type WorldMapProps = {
  center: [number, number];
  zoom: number;
  highlight: string[];
  markers: MapMarker[];
  onCountryClick?: (country: string) => void;
  onMarkerClick?: (name: string) => void;
};

function markerBadgeText(m: MapMarker, hovered: boolean) {
  if (m.active && m.label) {
    return m.year ? `${m.label} · ${m.year}` : m.label;
  }
  if (hovered) return m.name;
  return null;
}

export default function WorldMap({ center, zoom, highlight, markers, onCountryClick, onMarkerClick }: WorldMapProps) {
  const [hoveredName, setHoveredName] = React.useState<string | null>(null);

  return (
    <ComposableMap
      projection="geoEqualEarth"
      projectionConfig={{ scale: 165 }}
      width={820}
      height={420}
      style={{ width: '100%', height: 'auto' }}
    >
      <ZoomableGroup center={center} zoom={zoom} minZoom={1} maxZoom={5} filterZoomEvent={() => false}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies
              .filter((geo) => geo.properties.name !== 'Antarctica')
              .map((geo) => {
              const isActive = highlight.includes(geo.properties.name as string);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => onCountryClick?.(geo.properties.name as string)}
                  style={{
                    default: {
                      fill: isActive ? 'var(--map-land-active)' : 'var(--map-land)',
                      stroke: isActive ? 'var(--map-line-active)' : 'var(--map-line)',
                      strokeWidth: 0.5,
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'fill 0.5s var(--ease), stroke 0.5s var(--ease)',
                    },
                    hover: {
                      fill: isActive ? 'var(--map-land-active)' : 'var(--map-land)',
                      stroke: isActive ? 'var(--map-line-active)' : 'var(--map-line)',
                      strokeWidth: 0.5,
                      outline: 'none',
                    },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>
        {markers.map((m) => {
          const badge = markerBadgeText(m, hoveredName === m.name);
          const badgeWidth = Math.max(72, Math.min(160, (badge?.length ?? 0) * 6.2 + 20));
          // ZoomableGroup scales markers with the map — counteract so labels stay
          // as large on All territories as they read on regional zooms (~2.6×).
          const badgeScale = Math.max(1, 2.6 / zoom);
          return (
            <Marker key={m.name} coordinates={m.coordinates}>
              {badge && (
                <g
                  className="map-badge"
                  transform={`translate(0 ${-24 * badgeScale}) scale(${badgeScale})`}
                >
                  <rect x={-badgeWidth / 2} y={-18} width={badgeWidth} height={22} rx={0} />
                  <text textAnchor="middle" y={-3}>{badge}</text>
                </g>
              )}
              <g
                className="map-marker-hit"
                role="button"
                tabIndex={0}
                aria-label={`Выбрать ${m.name}`}
                onClick={() => onMarkerClick?.(m.name)}
                onMouseEnter={() => setHoveredName(m.name)}
                onMouseLeave={() => setHoveredName((current) => (current === m.name ? null : current))}
                onFocus={() => setHoveredName(m.name)}
                onBlur={() => setHoveredName((current) => (current === m.name ? null : current))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onMarkerClick?.(m.name);
                  }
                }}
              >
                {/* Invisible pad: larger than the visible square so All territories is easy to hit. */}
                <circle className="map-marker-hit__pad" r={22} />
                <rect
                  className={m.active ? 'map-dot is-active' : 'map-dot'}
                  x={m.active ? -3 : -2.5}
                  y={m.active ? -3 : -2.5}
                  width={m.active ? 6 : 5}
                  height={m.active ? 6 : 5}
                />
              </g>
            </Marker>
          );
        })}
      </ZoomableGroup>
    </ComposableMap>
  );
}
