/**
 * Capa GeoJSON del mapa: colorea cada departamento según su nivel de alerta.
 * Incluye tooltip al hover y manejo de clic.
 */
import React, { useCallback } from 'react';
import { GeoJSON, Tooltip } from 'react-leaflet';
import type { Layer, LeafletMouseEvent, PathOptions } from 'leaflet';
import type { Feature, GeoJsonObject } from 'geojson';
import { useAppStore } from '../../store/useAppStore';
import type { MapDeptData } from '../../types';
import { getAlertLabel } from '../../utils/alertLevel';

interface Props {
  geojson: GeoJsonObject;
}

// Propiedades del GeoJSON de departamentos peruanos
interface DeptFeatureProps {
  DEPARTAMEN?: string;
  NOMBDEP?: string;
  FIRST_IDDP?: string | number;
  ubigeo?: string;
}

// Mapa de nombre → ubigeo (fallback para GeoJSONs sin ubigeo directo)
const DEPT_NAME_TO_UBIGEO: Record<string, string> = {
  'AMAZONAS': '01', 'ANCASH': '02', 'APURIMAC': '03', 'AREQUIPA': '04',
  'AYACUCHO': '05', 'CAJAMARCA': '06', 'CALLAO': '07', 'CUSCO': '08',
  'HUANCAVELICA': '09', 'HUANUCO': '10', 'ICA': '11', 'JUNIN': '12',
  'LA LIBERTAD': '13', 'LAMBAYEQUE': '14', 'LIMA': '15', 'LORETO': '16',
  'MADRE DE DIOS': '17', 'MOQUEGUA': '18', 'PASCO': '19', 'PIURA': '20',
  'PUNO': '21', 'SAN MARTIN': '22', 'TACNA': '23', 'TUMBES': '24', 'UCAYALI': '25',
};

function normalizeDeptoName(name: string): string {
  return name.toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function featureToUbigeo(props: DeptFeatureProps): string | null {
  if (props.ubigeo) return String(props.ubigeo).padStart(2, '0');
  if (props.FIRST_IDDP) return String(props.FIRST_IDDP).padStart(2, '0');

  const name = props.DEPARTAMEN ?? props.NOMBDEP ?? '';
  if (name) {
    const normalized = normalizeDeptoName(name);
    return DEPT_NAME_TO_UBIGEO[normalized] ?? null;
  }
  return null;
}

export const DepartmentLayer: React.FC<Props> = ({ geojson }) => {
  const { mapData, selectedUbigeo, setSelectedUbigeo, mapDataLoading } = useAppStore();

  // Construir mapa ubigeo → datos para acceso rápido
  const dataByUbigeo = React.useMemo(() => {
    const map = new Map<string, MapDeptData>();
    mapData.forEach(d => map.set(d.ubigeo, d));
    return map;
  }, [mapData]);

  const styleFeature = useCallback((feature: Feature | undefined): PathOptions => {
    if (!feature) return {};
    const props = feature.properties as DeptFeatureProps;
    const ubigeo = featureToUbigeo(props);
    const data = ubigeo ? dataByUbigeo.get(ubigeo) : undefined;

    const fillColor = data?.color ?? '#94a3b8';
    const isSelected = ubigeo === selectedUbigeo;
    const hasData = data && data.casos > 0;

    return {
      fillColor,
      weight: isSelected ? 3 : 1.5,
      opacity: 1,
      color: isSelected ? '#1d4ed8' : 'rgba(255,255,255,0.7)',
      dashArray: undefined,
      fillOpacity: mapDataLoading ? 0.3 : (hasData ? 0.8 : 0.35),
    };
  }, [dataByUbigeo, selectedUbigeo, mapDataLoading]);

  const onEachFeature = useCallback((feature: Feature, layer: Layer) => {
    const props = feature.properties as DeptFeatureProps;
    const ubigeo = featureToUbigeo(props);
    const deptName = props.DEPARTAMEN ?? props.NOMBDEP ?? 'Departamento';
    const data = ubigeo ? dataByUbigeo.get(ubigeo) : undefined;

    // Accesibilidad: título ARIA en cada polígono
    if ('getElement' in layer) {
      const el = (layer as { getElement?: () => Element | null }).getElement?.();
      if (el) {
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `${deptName}: ${data ? data.casos.toLocaleString('es-PE') + ' casos, nivel ' + getAlertLabel(data.nivel_alerta) : 'sin datos'}`);
        el.setAttribute('tabindex', '0');
      }
    }

    layer.on({
      click: () => {
        if (ubigeo) setSelectedUbigeo(ubigeo);
      },
      mouseover: (e: LeafletMouseEvent) => {
        const l = e.target as { setStyle: (s: PathOptions) => void; bringToFront: () => void };
        l.setStyle({
          weight: 3,
          fillOpacity: 0.95,
          color: '#1d4ed8',
        });
        l.bringToFront();
      },
      mouseout: (e: LeafletMouseEvent) => {
        const l = e.target as { setStyle: (s: PathOptions) => void };
        l.setStyle(styleFeature(feature));
      },
      keydown: (e: { originalEvent: KeyboardEvent }) => {
        if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
          if (ubigeo) setSelectedUbigeo(ubigeo);
        }
      },
    });

    // Tooltip con diseño mejorado
    const enfPrincipal = data?.enfermedad_principal ?? 'Sin datos';
    const casos = data ? data.casos.toLocaleString('es-PE') : '–';
    const nivelLabel = data ? getAlertLabel(data.nivel_alerta) : 'Sin datos';
    const origen = data?.origen === 'official' ? '🔵' : '🟡';
    const nivelColor = data?.color ?? '#94a3b8';

    layer.bindTooltip(
      `<div style="font-weight:700;font-size:14px;color:white;margin-bottom:2px;">${origen} ${deptName}</div>
       <div style="font-size:12px;color:rgba(255,255,255,0.9);margin-bottom:4px;">
         <span style="font-weight:600;font-size:16px;color:${nivelColor};">${casos}</span> casos · ${enfPrincipal}
       </div>
       <div style="font-size:11px;color:rgba(255,255,255,0.7);">
         Nivel: ${nivelLabel} · ${data?.tasa_100k.toFixed(1) ?? '0'} /100k
       </div>`,
      { sticky: true, direction: 'auto', className: 'leaflet-tooltip-epi', opacity: 1 }
    );
  }, [dataByUbigeo, setSelectedUbigeo, styleFeature]);

  return (
    <GeoJSON
      key={JSON.stringify(mapData.map(d => d.nivel_alerta + d.ubigeo))} // Re-render cuando cambian datos
      data={geojson}
      style={styleFeature}
      onEachFeature={onEachFeature}
    />
  );
};
