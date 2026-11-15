/**
 * Capa GeoJSON de provincias: se muestra al hacer zoom in.
 * Colorea las provincias según el departamento al que pertenecen.
 */
import React, { useCallback } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { Layer, LeafletMouseEvent, PathOptions } from 'leaflet';
import type { Feature, GeoJsonObject } from 'geojson';
import { useAppStore } from '../../store/useAppStore';
import type { MapDeptData } from '../../types';

interface Props {
  geojson: GeoJsonObject;
}

interface ProvFeatureProps {
  NOMBPROV?: string;
  FIRST_IDPR?: string;
  FIRST_NOMB?: string;
}

const DEPT_NAME_TO_UBIGEO: Record<string, string> = {
  'AMAZONAS': '01', 'ANCASH': '02', 'APURIMAC': '03', 'AREQUIPA': '04',
  'AYACUCHO': '05', 'CAJAMARCA': '06', 'CALLAO': '07', 'CUSCO': '08',
  'HUANCAVELICA': '09', 'HUANUCO': '10', 'ICA': '11', 'JUNIN': '12',
  'LA LIBERTAD': '13', 'LAMBAYEQUE': '14', 'LIMA': '15', 'LORETO': '16',
  'MADRE DE DIOS': '17', 'MOQUEGUA': '18', 'PASCO': '19', 'PIURA': '20',
  'PUNO': '21', 'SAN MARTIN': '22', 'TACNA': '23', 'TUMBES': '24', 'UCAYALI': '25',
};

function normalizeName(name: string): string {
  return name.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// Paleta de colores vibrantes para los 25 departamentos
const DEPT_COLORS: Record<string, string> = {
  '01': '#3b82f6', '02': '#8b5cf6', '03': '#ec4899', '04': '#f43f5e',
  '05': '#f97316', '06': '#eab308', '07': '#22c55e', '08': '#14b8a6',
  '09': '#06b6d4', '10': '#3b82f6', '11': '#6366f1', '12': '#a855f7',
  '13': '#d946ef', '14': '#f43f5e', '15': '#ef4444', '16': '#f97316',
  '17': '#facc15', '18': '#84cc16', '19': '#22c55e', '20': '#10b981',
  '21': '#06b6d4', '22': '#0ea5e9', '23': '#6366f1', '24': '#8b5cf6', '25': '#a855f7',
};

export const ProvinceLayer: React.FC<Props> = ({ geojson }) => {
  const { mapData, setSelectedUbigeo, selectedUbigeo } = useAppStore();

  const dataByUbigeo = React.useMemo(() => {
    const map = new Map<string, MapDeptData>();
    mapData.forEach(d => map.set(d.ubigeo, d));
    return map;
  }, [mapData]);

  const styleFeature = useCallback((feature: Feature | undefined): PathOptions => {
    if (!feature) return {};
    const props = feature.properties as ProvFeatureProps;
    const deptName = props.FIRST_NOMB ? normalizeName(props.FIRST_NOMB) : '';
    const ubigeo = DEPT_NAME_TO_UBIGEO[deptName] ?? props.FIRST_IDPR?.substring(0, 2) ?? '';
    const data = ubigeo ? dataByUbigeo.get(ubigeo) : undefined;

    const isSelected = ubigeo === selectedUbigeo;
    const baseColor = DEPT_COLORS[ubigeo] ?? '#94a3b8';
    const alertColor = data?.color ?? baseColor;

    return {
      fillColor: alertColor,
      weight: isSelected ? 2.5 : 0.8,
      opacity: 1,
      color: isSelected ? '#1d4ed8' : 'rgba(255,255,255,0.5)',
      fillOpacity: 0.45,
    };
  }, [dataByUbigeo, selectedUbigeo]);

  const onEachFeature = useCallback((feature: Feature, layer: Layer) => {
    const props = feature.properties as ProvFeatureProps;
    const provName = props.NOMBPROV ?? 'Provincia';
    const deptName = props.FIRST_NOMB ?? '';
    const deptNormalized = normalizeName(deptName);
    const ubigeo = DEPT_NAME_TO_UBIGEO[deptNormalized] ?? props.FIRST_IDPR?.substring(0, 2) ?? '';
    const data = ubigeo ? dataByUbigeo.get(ubigeo) : undefined;

    layer.on({
      click: () => {
        if (ubigeo) setSelectedUbigeo(ubigeo);
      },
      mouseover: (e: LeafletMouseEvent) => {
        const l = e.target as { setStyle: (s: PathOptions) => void; bringToFront: () => void };
        l.setStyle({ weight: 2, fillOpacity: 0.65 });
        l.bringToFront();
      },
      mouseout: (e: LeafletMouseEvent) => {
        const l = e.target as { setStyle: (s: PathOptions) => void };
        l.setStyle(styleFeature(feature));
      },
    });

    const nivel = data ? data.casos.toLocaleString('es-PE') + ' casos · ' + (data.enfermedad_principal ?? 'sin datos') : 'sin datos';
    layer.bindTooltip(
      `<div style="font-weight:600;font-size:13px;">📍 ${provName}</div>
       <div style="font-size:11px;color:#94a3b8;">Departamento: ${deptName}</div>
       <div style="font-size:11px;margin-top:2px;">${nivel}</div>`,
      { sticky: true, direction: 'top', className: 'leaflet-tooltip-prov' }
    );
  }, [dataByUbigeo, setSelectedUbigeo, styleFeature]);

  return (
    <GeoJSON
      key={`prov-${JSON.stringify(mapData.map(d => d.ubigeo))}`}
      data={geojson}
      style={styleFeature}
      onEachFeature={onEachFeature}
    />
  );
};
