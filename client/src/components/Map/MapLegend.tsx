/**
 * Leyenda del mapa coropleta.
 * Usa tanto color como texto/patrón para cumplir requisitos de accesibilidad.
 */
import React from 'react';
import type { AlertLevel } from '../../types';

const LEGEND_ITEMS: Array<{ level: AlertLevel; label: string; color: string; icon: string; description: string }> = [
  { level: 'success',  label: 'Éxito',          color: '#22c55e', icon: '✅', description: 'Por debajo del percentil 25 histórico' },
  { level: 'safety',   label: 'Seguridad',       color: '#eab308', icon: '🟡', description: 'Entre P25 y media geométrica' },
  { level: 'alert',    label: 'Alerta',          color: '#f97316', icon: '⚠️', description: 'Entre media geométrica y P75' },
  { level: 'outbreak', label: 'Brote/Epidemia',  color: '#ef4444', icon: '🚨', description: 'Por encima del percentil 75 histórico' },
  { level: 'no_data',  label: 'Sin datos',       color: '#94a3b8', icon: '❓', description: 'Sin datos o insuficientes' },
];

export const MapLegend: React.FC = () => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div
      className="absolute bottom-6 left-3 z-[800] bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-sm"
      role="region"
      aria-label="Leyenda del mapa epidemiológico"
    >
      <button
        className="flex items-center gap-2 px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 w-full"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-controls="legend-content"
      >
        <span>📊 Nivel de Alerta</span>
        <span className="ml-auto text-xs opacity-60">{expanded ? '▲' : '▼'}</span>
      </button>

      <div id="legend-content" className={expanded ? 'block' : 'hidden'}>
        <ul className="px-3 pb-3 space-y-1.5">
          {LEGEND_ITEMS.map(item => (
            <li key={item.level} className="flex items-center gap-2">
              {/* Bloque de color + patrón */}
              <span
                className="w-5 h-5 rounded flex-shrink-0 border border-white/30"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              {/* Icono accesible */}
              <span aria-hidden="true" className="text-base leading-none">{item.icon}</span>
              {/* Etiqueta */}
              <span className="text-slate-700 dark:text-slate-200 font-medium">{item.label}</span>
              {/* Descripción visible al expandir */}
              {expanded && (
                <span className="text-slate-500 dark:text-slate-400 text-xs">— {item.description}</span>
              )}
            </li>
          ))}
        </ul>

        <div className="px-3 pb-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-1.5">
          Canal endémico CDC Perú · 5 años históricos
        </div>
      </div>
    </div>
  );
};
