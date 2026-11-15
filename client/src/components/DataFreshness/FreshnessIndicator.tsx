/**
 * Indicador de frescura de datos.
 * Muestra última actualización, semana epidemiológica y estado de la fuente.
 */
import React, { useEffect, useState } from 'react';
import { getFreshness } from '../../services/api';
import type { DataFreshness as FreshnessData } from '../../types';

export const FreshnessIndicator: React.FC = () => {
  const [data, setData] = useState<FreshnessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = () => {
      getFreshness()
        .then(setData)
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    fetch();
    // Actualizar cada 5 minutos
    const interval = setInterval(fetch, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-md" />
    );
  }

  const freshnessLabels: Record<string, { label: string; color: string }> = {
    al_dia:       { label: 'Al día', color: 'text-green-600 dark:text-green-400' },
    retrasada:    { label: 'Retrasada', color: 'text-amber-600 dark:text-amber-400' },
    fuera_de_linea:{ label: 'Fuera de línea', color: 'text-red-600 dark:text-red-400' },
    pendiente:    { label: 'Pendiente', color: 'text-slate-500 dark:text-slate-400' },
  };

  const ultimaFmt = data.ultima_actualizacion
    ? new Date(data.ultima_actualizacion).toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : 'Nunca';

  // Determinar estado general
  const hasAlDia = data.fuentes.some(f => f.freshness === 'al_dia');
  const hasError = data.fuentes.some(f => f.freshness === 'fuera_de_linea');
  const estadoGeneral = hasAlDia
    ? freshnessLabels.al_dia
    : hasError
      ? freshnessLabels.fuera_de_linea
      : freshnessLabels.retrasada;

  return (
    <div
      className="flex items-center gap-2 text-xs"
      role="status"
      aria-label={`Frescura de datos: última actualización ${ultimaFmt}, semana epidemiológica ${data.semana_epidemiologica.semana}, estado ${estadoGeneral.label}`}
      title="Indicador de frescura de datos"
    >
      {/* Estado general */}
      <span className={`flex items-center gap-1 font-medium ${estadoGeneral.color}`}>
        <span className="w-2 h-2 rounded-full" style={{
          backgroundColor: estadoGeneral === freshnessLabels.al_dia ? '#22c55e' : estadoGeneral === freshnessLabels.retrasada ? '#eab308' : '#ef4444'
        }} aria-hidden="true" />
        {estadoGeneral.label}
      </span>

      <span className="text-slate-400 dark:text-slate-500">|</span>

      {/* Última actualización */}
      <span className="text-slate-600 dark:text-slate-400" title={`Última actualización: ${ultimaFmt}`}>
        🕒 {ultimaFmt}
      </span>

      <span className="text-slate-400 dark:text-slate-500">|</span>

      {/* Semana epidemiológica */}
      <span className="text-blue-600 dark:text-blue-400 font-medium">
        SE {data.semana_epidemiologica.semana}/{data.semana_epidemiologica.anio}
      </span>

      {/* Detalle expandido (al hover) */}
      <details className="relative group hidden md:block">
        <summary className="cursor-pointer text-slate-400 hover:text-slate-600 list-none" aria-label="Ver detalle de fuentes">
          ⚙️
        </summary>
        <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-3 z-50">
          <ul className="space-y-1.5 text-xs">
            {data.fuentes.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300 truncate flex-1" title={f.nombre}>
                  {f.nombre}
                </span>
                <span className={freshnessLabels[f.freshness]?.color ?? 'text-slate-500'} style={{ whiteSpace: 'nowrap' }}>
                  {freshnessLabels[f.freshness]?.label ?? 'Desconocido'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
};
