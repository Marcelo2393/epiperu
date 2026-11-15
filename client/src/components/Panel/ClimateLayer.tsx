/**
 * Panel de datos climáticos (temperatura y precipitación).
 * Usa Open-Meteo via backend.
 */
import React from 'react';
import type { WeatherData } from '../../types';

interface Props {
  weather: WeatherData | null;
  loading?: boolean;
}

export const ClimateLayer: React.FC<Props> = ({ weather, loading }) => {
  if (loading) {
    return (
      <div className="h-16 bg-slate-100 dark:bg-slate-700 animate-pulse rounded-lg" />
    );
  }

  if (!weather) {
    return (
      <div className="text-xs text-slate-500 dark:text-slate-400 italic">
        Datos climáticos no disponibles para este período.
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-2 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800 text-sm"
      role="region"
      aria-label="Datos climáticos del departamento"
    >
      <div className="text-center">
        <div className="text-xl mb-0.5" aria-hidden="true">🌡️</div>
        <div className="font-bold text-sky-700 dark:text-sky-300">
          {weather.tempMean.toFixed(1)}°C
        </div>
        <div className="text-xs text-slate-500">Temp. media</div>
        <div className="text-xs text-slate-400">
          {weather.tempMin.toFixed(1)}° – {weather.tempMax.toFixed(1)}°C
        </div>
      </div>
      <div className="text-center">
        <div className="text-xl mb-0.5" aria-hidden="true">🌧️</div>
        <div className="font-bold text-sky-700 dark:text-sky-300">
          {weather.precipitationTotal.toFixed(0)} mm
        </div>
        <div className="text-xs text-slate-500">Precipitación</div>
        <div className="text-xs text-slate-400">Total del mes</div>
      </div>
      <div className="col-span-2 text-xs text-sky-600 dark:text-sky-400 text-center border-t border-sky-200 dark:border-sky-800 pt-1.5 mt-1">
        Fuente: <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Open-Meteo</a>
        {' '}· Alta temperatura y lluvia correlacionan con mayor riesgo de dengue/malaria
      </div>
    </div>
  );
};
