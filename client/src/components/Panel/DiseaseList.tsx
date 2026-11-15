/**
 * Lista de enfermedades activas en el panel de detalle de un departamento.
 */
import React, { useState } from 'react';
import type { DiseaseDetail } from '../../types';
import { ALERT_ICONS } from '../../utils/alertLevel';
import { DataOriginBadge } from '../ui/Badge';

interface Props {
  enfermedades: DiseaseDetail[];
  onSelectDisease?: (codigo: string) => void;
  selectedDisease?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  vectorial:      '🦟',
  respiratoria:   '🫁',
  digestiva:      '🦠',
  zoonotica:      '🐀',
  inmunoprevenible: '💉',
};

export const DiseaseList: React.FC<Props> = ({ enfermedades, onSelectDisease, selectedDisease }) => {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  if (enfermedades.length === 0) {
    return (
      <div className="text-center text-slate-500 dark:text-slate-400 py-4 text-sm">
        Sin enfermedades activas en este período
      </div>
    );
  }

  return (
    <ol className="space-y-2" aria-label="Lista de enfermedades activas">
      {enfermedades.map((e, idx) => {
        const isFirst = idx === 0;
        const isExpanded = expandedCode === e.enfermedad;
        const isSelected = selectedDisease === e.enfermedad;

        return (
          <li
            key={e.enfermedad}
            className={`border rounded-lg transition-all ${
              isFirst
                ? 'border-2 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700'
            } ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
          >
            {/* Cabecera */}
            <button
              className="w-full text-left px-3 py-2.5 flex items-start gap-2"
              onClick={() => {
                setExpandedCode(isExpanded ? null : e.enfermedad);
                onSelectDisease?.(e.enfermedad);
              }}
              aria-expanded={isExpanded}
              aria-label={`${e.nombre}: ${e.casos_mes.toLocaleString('es-PE')} casos, nivel ${e.nivel_alerta_label}`}
            >
              {/* Nivel de alerta (icono + color, no solo color) */}
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                style={{ backgroundColor: e.nivel_alerta_color, color: 'white' }}
                aria-label={`Nivel: ${e.nivel_alerta_label}`}
                title={`Nivel: ${e.nivel_alerta_label}`}
              >
                {ALERT_ICONS[e.nivel_alerta]}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {CATEGORY_ICONS[e.categoria] ?? '🦠'} {e.nombre}
                  </span>
                  {isFirst && (
                    <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                      Predominante
                    </span>
                  )}
                  <DataOriginBadge origen={e.origen as 'official' | 'demo'} />
                </div>

                {/* Estadísticas clave */}
                <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                  <Stat
                    label="Casos/mes"
                    value={e.casos_mes.toLocaleString('es-PE')}
                    aria="casos del mes"
                  />
                  <Stat
                    label="Acumulado"
                    value={e.acumulado_anio.toLocaleString('es-PE')}
                    aria="acumulado del año"
                  />
                  <Stat
                    label="Tasa/100k"
                    value={e.tasa_100k.toFixed(1)}
                    aria="tasa por cien mil habitantes"
                  />
                </div>

                {/* Variación interanual */}
                {e.variacion_pct !== null && (
                  <div className="mt-1 text-xs">
                    <span className={e.variacion_pct > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-green-600 dark:text-green-400 font-medium'}>
                      {e.variacion_pct > 0 ? '▲' : '▼'} {Math.abs(e.variacion_pct)}%
                    </span>
                    <span className="text-slate-500 dark:text-slate-400"> vs. mismo mes año anterior</span>
                  </div>
                )}
              </div>
            </button>

            {/* Detalle expandido */}
            {isExpanded && (
              <div className="px-3 pb-3 border-t border-slate-100 dark:border-slate-700 mt-0.5 pt-2 space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {e.descripcion}
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-2 text-xs">
                  <p className="font-semibold text-green-800 dark:text-green-300 mb-0.5">💡 Prevención:</p>
                  <p className="text-green-700 dark:text-green-400">{e.prevencion}</p>
                </div>
                {e.fuente_url && (
                  <a
                    href={e.fuente_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    aria-label={`Fuente oficial para ${e.nombre}`}
                  >
                    🔗 Fuente oficial — CDC Perú/MINSA
                  </a>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
};

// Componente auxiliar para estadísticas
const Stat: React.FC<{ label: string; value: string; aria: string }> = ({ label, value, aria }) => (
  <div className="bg-white dark:bg-slate-700/50 rounded p-1.5 text-center border border-slate-100 dark:border-slate-600">
    <div className="text-sm font-bold text-slate-800 dark:text-slate-100" aria-label={`${value} ${aria}`}>
      {value}
    </div>
    <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
  </div>
);
