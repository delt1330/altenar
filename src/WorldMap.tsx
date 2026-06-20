import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export type MapMarker = {
  name: string;
  coordinates: [number, number];
  active: boolean;
};

type WorldMapProps = {
  center: [number, number];
  zoom: number;
  highlight: string[];
  markers: MapMarker[];
};

export default function WorldMap({ center, zoom, highlight, markers }: WorldMapProps) {
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
            geographies.map((geo) => {
              const isActive = highlight.includes(geo.properties.name as string);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: isActive ? 'var(--map-land-active)' : 'var(--map-land)',
                      stroke: isActive ? 'var(--map-line-active)' : 'var(--map-line)',
                      strokeWidth: 0.5,
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
        {markers.map((m) => (
          <Marker key={m.name} coordinates={m.coordinates}>
            {m.active && <circle className="map-pulse" r={9} />}
            <circle className={m.active ? 'map-dot is-active' : 'map-dot'} r={m.active ? 3.4 : 2.4} />
          </Marker>
        ))}
      </ZoomableGroup>
    </ComposableMap>
  );
}
