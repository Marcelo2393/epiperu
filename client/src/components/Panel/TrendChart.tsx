/**
 * Gráfico de tendencia epidemiológica (últimas 12 semanas/meses).
 * Incluye bandas del canal endémico superpuestas.
 */
import React, { useState } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { TrendPoint, EndemicBand } from '../../types';

interface Props {
  trendData: TrendPoint[];
  endemicBands: EndemicBand[];
  enfermedad: string;
  loading?: boolean;
}

const MONTHS_ES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-slate-900/95 text-white text-xs rounded-lg p-3 shadow-xl border border-slate-700 max-w-[200px]">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value?.toLocaleString('es-PE')}</span>
        </p>
      ))}
    </div>
  );
};

export const TrendChart: React.FC<Props> = ({ trendData, endemicBands, enfermedad, loading }) => {
  const [showEndemicChannel, setShowEndemicChannel] = useState(true);

  if (loading) {
    return <div className="h-48 bg-slate-100 dark:bg-slate-700 animate-pulse rounded-lg" />;
  }

  if (trendData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
        Sin datos de tendencia disponibles
      </div>
    );
  }

  // Combinar datos de tendencia con bandas endémicas si están disponibles
  const chartData = trendData.map((point, i) => {
    const monthIdx = i < endemicBands.length ? i : -1;
    const band = monthIdx >= 0 && endemicBands[monthIdx] ? endemicBands[monthIdx] : null;
    return {
      ...point,
      q1: band ? Math.round(band.q1) : undefined,
      gm: band ? Math.round(band.geometricMean) : undefined,
      q3: band ? Math.round(band.q3) : undefined,
    };
  });

  // Resumen accesible
  const totalCasos = trendData.reduce((s, p) => s + p.casos, 0);
  const maxCasos = Math.max(...trendData.map(p => p.casos));
  const maxPeriod = trendData.find(p => p.casos === maxCasos)?.label ?? '';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
          Tendencia — {enfermedad}
        </h4>
        {endemicBands.length > 0 && (
          <button
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            onClick={() => setShowEndemicChannel(c => !c)}
            aria-pressed={showEndemicChannel}
            title="Mostrar/ocultar el canal endémico calculado con datos históricos de los últimos 5 años"
          >
            {showEndemicChannel ? '✅' : '⬜'} Canal endémico
            <span className="text-blue-500 cursor-help" title="¿Cómo se calcula?">ℹ️</span>
          </button>
        )}
      </div>

      {/* Descripción accesible para lectores de pantalla */}
      <p className="sr-only">
        Gráfico de tendencia de {enfermedad}. Total: {totalCasos.toLocaleString('es-PE')} casos.
        Período de mayor incidencia: {maxPeriod} con {maxCasos.toLocaleString('es-PE')} casos.
      </p>

      <div role="img" aria-label={`Gráfico de tendencia de ${enfermedad}`}>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v)}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Bandas del canal endémico */}
            {showEndemicChannel && endemicBands.length > 0 && (
              <>
                <Area
                  dataKey="q3"
                  stroke="none"
                  fill="#ef4444"
                  fillOpacity={0.12}
                  name="Q3 (brote)"
                  legendType="none"
                />
                <Area
                  dataKey="gm"
                  stroke="none"
                  fill="#f97316"
                  fillOpacity={0.12}
                  name="Media geométrica"
                  legendType="none"
                />
                <Area
                  dataKey="q1"
                  stroke="none"
                  fill="#22c55e"
                  fillOpacity={0.12}
                  name="Q1 (éxito)"
                  legendType="none"
                />
                <Line
                  dataKey="gm"
                  stroke="#f97316"
                  strokeWidth={1}
                  strokeDasharray="4 2"
                  dot={false}
                  name="Media geométrica"
                />
              </>
            )}

            {/* Línea principal de casos */}
            <Line
              type="monotone"
              dataKey="casos"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3, fill: '#2563eb' }}
              activeDot={{ r: 5 }}
              name="Casos"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {showEndemicChannel && endemicBands.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1"><span className="w-3 h-1 bg-green-400 inline-block rounded" />Éxito (&lt;P25)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1 bg-orange-400 inline-block rounded" />Alerta (P25–P75)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1 bg-red-400 inline-block rounded" />Brote (&gt;P75)</span>
        </div>
      )}
    </div>
  );
};
