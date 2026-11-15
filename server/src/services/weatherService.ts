/**
 * Servicio de datos climáticos usando Open-Meteo API.
 * Gratuito, sin API key, para uso no comercial.
 * https://open-meteo.com
 */
import axios from 'axios';
import { getDb } from '../db/client';

const ARCHIVE_API = 'https://archive-api.open-meteo.com/v1/archive';
const FORECAST_API = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT = 15000;

export interface WeatherData {
  ubigeo: string;
  year: number;
  month: number;
  tempMin: number;
  tempMax: number;
  tempMean: number;
  precipitationTotal: number;
}

/**
 * Obtiene temperatura y precipitación mensual promedio para un departamento.
 * Usa el archivo histórico de Open-Meteo.
 */
export async function getMonthlyWeather(
  ubigeo: string,
  year: number,
  month: number
): Promise<WeatherData | null> {
  const db = getDb();

  // Obtener coordenadas del departamento
  const dept = db.prepare(
    'SELECT lat, lon FROM departments WHERE ubigeo = ?'
  ).get(ubigeo) as { lat: number; lon: number } | undefined;

  if (!dept) return null;

  // Construir rango de fechas del mes
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${endDay}`;

  // Determinar si usar datos históricos o pronóstico
  const today = new Date();
  const isHistorical = year < today.getFullYear() ||
    (year === today.getFullYear() && month < today.getMonth() + 1);

  const apiUrl = isHistorical ? ARCHIVE_API : FORECAST_API;

  try {
    const resp = await axios.get(apiUrl, {
      params: {
        latitude: dept.lat,
        longitude: dept.lon,
        start_date: startDate,
        end_date: endDate,
        daily: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum',
        timezone: 'America/Lima',
      },
      timeout: TIMEOUT,
    });

    const daily = resp.data.daily;
    if (!daily || !daily.temperature_2m_mean) return null;

    const temps: number[] = daily.temperature_2m_mean.filter((t: number | null) => t !== null);
    const tempsMax: number[] = daily.temperature_2m_max.filter((t: number | null) => t !== null);
    const tempsMin: number[] = daily.temperature_2m_min.filter((t: number | null) => t !== null);
    const precip: number[] = daily.precipitation_sum.filter((p: number | null) => p !== null);

    if (temps.length === 0) return null;

    const avg = (arr: number[]) =>
      arr.length ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : 0;
    const sum = (arr: number[]) =>
      Math.round(arr.reduce((s, v) => s + v, 0) * 10) / 10;

    return {
      ubigeo,
      year,
      month,
      tempMean: avg(temps),
      tempMax: avg(tempsMax),
      tempMin: avg(tempsMin),
      precipitationTotal: sum(precip),
    };
  } catch (error) {
    console.error(`[Weather] Error obteniendo clima para ubigeo=${ubigeo}:`, error);
    return null;
  }
}
