/**
 * Cálculo del Canal Endémico para vigilancia epidemiológica.
 *
 * Metodología (OPS/CDC):
 * - Se usan los datos del mismo mes/semana de los últimos 5 años disponibles.
 * - Se calcula la media geométrica (más robusta que la aritmética para datos de conteo).
 * - Se calcula el percentil 25 (Q1) y percentil 75 (Q3).
 * - Las zonas son:
 *   - Éxito:    < Q1
 *   - Seguridad: Q1 ≤ x < media geométrica
 *   - Alerta:   media geométrica ≤ x < Q3
 *   - Brote:    ≥ Q3
 *
 * Se requieren ≥ 3 años de datos históricos para calcular el canal.
 */
import { getDb } from '../db/client';

export type AlertLevel = 'success' | 'safety' | 'alert' | 'outbreak' | 'no_data';

export interface EndemicChannelResult {
  q1: number;
  median: number;
  geometricMean: number;
  q3: number;
  level: AlertLevel;
  historicalYears: number;
  hasData: boolean;
}

export interface EndemicBand {
  month: number;
  q1: number;
  geometricMean: number;
  q3: number;
}

/**
 * Calcula la media geométrica de un array de números.
 * Se usa log(x+1) para manejar ceros (luego se resta 1 al final).
 */
export function geometricMean(values: number[]): number {
  if (values.length === 0) return 0;
  const logSum = values.reduce((sum, v) => sum + Math.log(v + 1), 0);
  return Math.exp(logSum / values.length) - 1;
}

/**
 * Calcula el percentil p de un array de números (método de interpolación lineal).
 */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

/**
 * Calcula el canal endémico para un departamento/enfermedad/mes dado.
 * Compara el valor actual contra los últimos 5 años disponibles del mismo mes.
 */
export function calcEndemicChannel(
  ubigeo: string,
  enfermedad: string,
  anio: number,
  mes: number
): EndemicChannelResult {
  const db = getDb();

  // Obtener datos históricos del mismo mes en los últimos 5 años
  const historicalRows = db.prepare(`
    SELECT anio, COALESCE(SUM(casos), 0) AS casos
    FROM cases
    WHERE ubigeo = ?
      AND enfermedad = ?
      AND mes = ?
      AND anio < ?
      AND anio >= ?
    GROUP BY anio
    ORDER BY anio DESC
  `).all(ubigeo, enfermedad, mes, anio, anio - 5) as { anio: number; casos: number }[];

  if (historicalRows.length < 3) {
    return {
      q1: 0, median: 0, geometricMean: 0, q3: 0,
      level: 'no_data',
      historicalYears: historicalRows.length,
      hasData: false,
    };
  }

  const values = historicalRows.map(r => r.casos).sort((a, b) => a - b);
  const q1 = percentile(values, 25);
  const q3 = percentile(values, 75);
  const gm = geometricMean(values);
  const med = percentile(values, 50);

  // Obtener el valor actual
  const currentRow = db.prepare(`
    SELECT COALESCE(SUM(casos), 0) AS casos
    FROM cases
    WHERE ubigeo = ? AND enfermedad = ? AND anio = ? AND mes = ?
  `).get(ubigeo, enfermedad, anio, mes) as { casos: number };

  const current = currentRow?.casos ?? 0;

  // Clasificar según el canal endémico
  let level: AlertLevel;
  if (current < q1) {
    level = 'success';
  } else if (current < gm) {
    level = 'safety';
  } else if (current < q3) {
    level = 'alert';
  } else {
    level = 'outbreak';
  }

  return {
    q1: Math.round(q1 * 10) / 10,
    median: Math.round(med * 10) / 10,
    geometricMean: Math.round(gm * 10) / 10,
    q3: Math.round(q3 * 10) / 10,
    level,
    historicalYears: historicalRows.length,
    hasData: true,
  };
}

/**
 * Calcula el nivel de alerta global para un departamento en un período dado.
 * Es el nivel más alto de cualquier enfermedad en ese período.
 */
export function getGlobalAlertLevel(
  ubigeo: string,
  anio: number,
  mes: number
): AlertLevel {
  const db = getDb();

  // Obtener todas las enfermedades con casos en ese período
  const diseases = db.prepare(`
    SELECT DISTINCT enfermedad FROM cases
    WHERE ubigeo = ? AND anio = ? AND mes = ? AND casos > 0
  `).all(ubigeo, anio, mes) as { enfermedad: string }[];

  if (diseases.length === 0) return 'no_data';

  const levels: AlertLevel[] = ['no_data', 'success', 'safety', 'alert', 'outbreak'];
  let maxLevel: AlertLevel = 'no_data';

  for (const { enfermedad } of diseases) {
    const result = calcEndemicChannel(ubigeo, enfermedad, anio, mes);
    if (levels.indexOf(result.level) > levels.indexOf(maxLevel)) {
      maxLevel = result.level;
    }
    if (maxLevel === 'outbreak') break; // Nivel máximo alcanzado
  }

  return maxLevel;
}

/**
 * Obtiene las bandas del canal endémico para todos los meses de un año
 * para una combinación ubigeo/enfermedad. Útil para graficar.
 */
export function getEndemicBands(
  ubigeo: string,
  enfermedad: string,
  anio: number
): EndemicBand[] {
  const bands: EndemicBand[] = [];

  for (let mes = 1; mes <= 12; mes++) {
    const result = calcEndemicChannel(ubigeo, enfermedad, anio, mes);
    bands.push({
      month: mes,
      q1: result.hasData ? result.q1 : 0,
      geometricMean: result.hasData ? result.geometricMean : 0,
      q3: result.hasData ? result.q3 : 0,
    });
  }

  return bands;
}

/**
 * Texto legible para el nivel de alerta.
 */
export function alertLevelLabel(level: AlertLevel): string {
  const labels: Record<AlertLevel, string> = {
    success: 'Éxito',
    safety: 'Seguridad',
    alert: 'Alerta',
    outbreak: 'Brote/Epidemia',
    no_data: 'Sin datos',
  };
  return labels[level];
}

/**
 * Color (clase Tailwind) para el nivel de alerta.
 */
export function alertLevelColor(level: AlertLevel): string {
  const colors: Record<AlertLevel, string> = {
    success: '#22c55e',
    safety: '#eab308',
    alert: '#f97316',
    outbreak: '#ef4444',
    no_data: '#94a3b8',
  };
  return colors[level];
}
