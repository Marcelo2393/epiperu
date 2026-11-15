/**
 * Componente principal del mapa interactivo del Perú.
 * - Vista lejana (zoom < 7): departamentos coloreados por nivel de alerta
 * - Vista cercana (zoom >= 7): provincias coloreadas por departamento
 * - Tile layer colorida (CartoDB Voyager)
 * - Animaciones suaves al hover y clic
 */
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DepartmentLayer } from './DepartmentLayer';
import { ProvinceLayer } from './ProvinceLayer';
import { MapLegend } from './MapLegend';
import { Skeleton } from '../ui/Skeleton';
import type { GeoJsonObject } from 'geojson';

// Centro y zoom del Perú
const PERU_CENTER: [number, number] = [-9.19, -75.01];
const PERU_ZOOM = 5;
const PROVINCE_ZOOM_THRESHOLD = 7; // A partir de este zoom se muestran provincias

export const PeruMap: React.FC = () => {
  const [geojsonDepts, setGeojsonDepts] = useState<GeoJsonObject | null>(null);
  const [geojsonProvs, setGeojsonProvs] = useState<GeoJsonObject | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [zoom, setZoom] = useState(PERU_ZOOM);
  const [mapReady, setMapReady] = useState(false);

  // Cargar ambos GeoJSONs al montar
  useEffect(() => {
    Promise.all([
      fetch('/data/peru-departamentos.geojson').then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      fetch('/data/peru-provincias.geojson').then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    ])
      .then(([depts, provs]) => {
        setGeojsonDepts(depts);
        setGeojsonProvs(provs);
      })
      .catch(err => {
        console.error('[PeruMap] Error cargando GeoJSON:', err);
        setGeoError(true);
      });
  }, []);

  const handleZoom = useCallback((z: number) => {
    setZoom(z);
  }, []);

  // Componente que escucha cambios de zoom
  const ZoomListener: React.FC = () => {
    const map = useMapEvents({
      zoomend: () => {
        handleZoom(map.getZoom());
      },
    });
    return null;
  };

  if (geoError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
        <div className="text-center text-slate-600 dark:text-slate-400 p-8">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="font-medium">No se pudo cargar el mapa del Perú.</p>
          <p className="text-sm mt-1">Verifica que los archivos GeoJSON estén en /public/data/</p>
        </div>
      </div>
    );
  }

  if (!geojsonDepts) {
    return (
      <div className="flex-1 bg-slate-100 dark:bg-slate-800 p-4">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }

  const showProvinces = zoom >= PROVINCE_ZOOM_THRESHOLD;

  return (
    <div className="flex-1 relative" role="application" aria-label="Mapa epidemiológico del Perú">
      <MapContainer
        center={PERU_CENTER}
        zoom={PERU_ZOOM}
        minZoom={4}
        maxZoom={14}
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        scrollWheelZoom
        zoomControl
        zoomAnimation
        fadeAnimation
        aria-label="Mapa interactivo del Perú con datos epidemiológicos por departamento"
      >
        {/* Tile layer: Esri World Imagery (satelital, colorido, sin etiquetas de texto, sin API key) */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; Esri, Maxar, Earthstar Geographics'
          maxZoom={19}
        />

        {/* Capa de departamentos (vista lejana) */}
        {!showProvinces && geojsonDepts && (
          <DepartmentLayer geojson={geojsonDepts} />
        )}

        {/* Capa de provincias (vista cercana al hacer zoom) */}
        {showProvinces && geojsonProvs && (
          <ProvinceLayer geojson={geojsonProvs} />
        )}

        {/* Listener de zoom */}
        <ZoomListener />
      </MapContainer>

      {/* Leyenda superpuesta */}
      <MapLegend />

      {/* Indicador de nivel de zoom */}
      <div className="absolute top-3 right-3 z-[800] bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        {showProvinces ? '🏙️ Vista: Provincias' : '🗺️ Vista: Departamentos'}
        <span className="text-slate-400 ml-1">· Zoom {zoom}</span>
      </div>

      {/* Estilos del tooltip de Leaflet */}
      <style>{`
        .leaflet-tooltip-epi {
          background: rgba(15, 23, 42, 0.92);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.4);
          pointer-events: none;
        }
        .leaflet-tooltip-epi::before {
          border-top-color: rgba(15, 23, 42, 0.92);
        }
        .leaflet-tooltip-prov {
          background: rgba(255, 255, 255, 0.97);
          color: #1e293b;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
          pointer-events: none;
        }
        .leaflet-tooltip-prov::before {
          border-top-color: rgba(255, 255, 255, 0.97);
        }
        .leaflet-container {
          font-family: 'Inter', system-ui, sans-serif;
        }
        .leaflet-control-zoom a {
          background-color: white !important;
          color: #1e293b !important;
          border-radius: 8px !important;
          margin-bottom: 4px !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15) !important;
        }
        .leaflet-bar {
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
};
