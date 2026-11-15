/**
 * Servicio de comunicación con la API backend de EpiPerú.
 */
import axios from 'axios';
import type {
  Department, Disease, MapDeptData, DepartmentSummary,
  TrendPoint, EndemicBand, RankingDept, RankingDisease,
  ActiveAlert, DataFreshness, WeatherData,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Respuesta genérica de la API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Departamentos
// ─────────────────────────────────────────────────────────────────────────────

export async function getDepartments(): Promise<Department[]> {
  const resp = await api.get<ApiResponse<Department[]>>('/departments');
  return resp.data.data;
}

export async function getDepartmentSummary(
  ubigeo: string,
  year: number,
  month: number
): Promise<DepartmentSummary> {
  const resp = await api.get<ApiResponse<DepartmentSummary>>(
    `/departments/${ubigeo}/summary`,
    { params: { year, month } }
  );
  return resp.data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Enfermedades
// ─────────────────────────────────────────────────────────────────────────────

export async function getDiseases(): Promise<Disease[]> {
  const resp = await api.get<ApiResponse<Disease[]>>('/diseases');
  return resp.data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapa
// ─────────────────────────────────────────────────────────────────────────────

export async function getMapData(
  year: number,
  month: number,
  disease?: string
): Promise<MapDeptData[]> {
  const resp = await api.get<ApiResponse<MapDeptData[]>>('/map', {
    params: { year, month, ...(disease ? { disease } : {}) },
  });
  return resp.data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tendencias
// ─────────────────────────────────────────────────────────────────────────────

export async function getTrends(
  ubigeo: string,
  disease: string,
  periods = 12,
  mode: 'monthly' | 'weekly' = 'monthly'
): Promise<{ data: TrendPoint[]; canal_endemico: EndemicBand[] }> {
  const resp = await api.get('/trends', {
    params: { ubigeo, disease, periods, mode },
  });
  return { data: resp.data.data, canal_endemico: resp.data.canal_endemico };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rankings
// ─────────────────────────────────────────────────────────────────────────────

export async function getRankings(
  year: number,
  month: number
): Promise<{
  top_departamentos: RankingDept[];
  top_enfermedades: RankingDisease[];
  total_casos_nacional: number;
}> {
  const resp = await api.get('/rankings', { params: { year, month } });
  return resp.data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Alertas
// ─────────────────────────────────────────────────────────────────────────────

export async function getAlerts(
  year: number,
  month: number
): Promise<ActiveAlert[]> {
  const resp = await api.get<ApiResponse<ActiveAlert[]>>('/alerts', {
    params: { year, month },
  });
  return resp.data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadatos
// ─────────────────────────────────────────────────────────────────────────────

export async function getFreshness(): Promise<DataFreshness> {
  const resp = await api.get<ApiResponse<DataFreshness>>('/meta/freshness');
  return resp.data.data;
}

export async function getEndemicChannel(
  ubigeo: string,
  disease: string,
  year: number
): Promise<{ bandas_mensuales: EndemicBand[]; estado_actual: Record<string, unknown> }> {
  const resp = await api.get('/meta/endemic-channel', {
    params: { ubigeo, disease, year },
  });
  return resp.data.data;
}

export async function getWeather(
  ubigeo: string,
  year: number,
  month: number
): Promise<WeatherData | null> {
  try {
    const resp = await api.get<ApiResponse<WeatherData>>('/meta/weather', {
      params: { ubigeo, year, month },
    });
    return resp.data.data;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────────────────────────────────────

export async function triggerSync(adminToken: string): Promise<void> {
  await api.post('/admin/sync', {}, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
}
