/**
 * Tipos TypeScript compartidos del frontend de EpiPerú.
 */

// Niveles de alerta epidemiológica
export type AlertLevel = 'success' | 'safety' | 'alert' | 'outbreak' | 'no_data';

// Departamento
export interface Department {
  ubigeo: string;
  nombre: string;
  poblacion: number;
  lat: number;
  lon: number;
  region: 'Costa' | 'Sierra' | 'Selva';
}

// Enfermedad del catálogo
export interface Disease {
  codigo: string;
  nombre: string;
  categoria: 'vectorial' | 'respiratoria' | 'digestiva' | 'zoonotica' | 'inmunoprevenible';
  descripcion: string;
  prevencion: string;
  fuente_url: string;
  dataset_id: string | null;
}

// Datos de una enfermedad en el panel de detalle
export interface DiseaseDetail {
  enfermedad: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  prevencion: string;
  fuente_url: string;
  casos_mes: number;
  defunciones: number;
  acumulado_anio: number;
  tasa_100k: number;
  variacion_pct: number | null;
  origen: 'official' | 'demo';
  nivel_alerta: AlertLevel;
  nivel_alerta_label: string;
  nivel_alerta_color: string;
  canal_endemico: {
    q1: number;
    media_geometrica: number;
    q3: number;
    anios_historicos: number;
    disponible: boolean;
  };
}

// Resumen de un departamento
export interface DepartmentSummary {
  departamento: Department;
  periodo: { year: number; month: number };
  origen_datos: 'official' | 'demo';
  enfermedades: DiseaseDetail[];
  total_casos_mes: number;
  enfermedad_predominante: string | null;
}

// Datos del mapa por departamento
export interface MapDeptData {
  ubigeo: string;
  nombre: string;
  nivel_alerta: AlertLevel;
  color: string;
  casos: number;
  tasa_100k: number;
  enfermedad_principal: string | null;
  origen: 'official' | 'demo';
}

// Punto de tendencia
export interface TrendPoint {
  label: string;
  casos: number;
  defunciones: number;
  tasa: number;
  origen: 'official' | 'demo';
}

// Banda del canal endémico
export interface EndemicBand {
  month: number;
  q1: number;
  geometricMean: number;
  q3: number;
}

// Dato de ranking
export interface RankingDept {
  rank: number;
  ubigeo: string;
  nombre: string;
  casos: number;
  tasa_100k: number;
  pct_nacional: number;
  origen: 'official' | 'demo';
}

export interface RankingDisease {
  rank: number;
  codigo: string;
  nombre: string;
  categoria: string;
  casos: number;
  defunciones: number;
  pct_total: number;
  origen: 'official' | 'demo';
}

// Alerta activa
export interface ActiveAlert {
  ubigeo: string;
  departamento: string;
  enfermedad: string;
  nombre_enfermedad: string;
  casos: number;
  nivel: AlertLevel;
  nivel_label: string;
  nivel_color: string;
  origen: 'official' | 'demo';
  fuente_url: string;
}

// Frescura de datos
export interface DataFreshness {
  fuentes: Array<{
    nombre: string;
    url: string;
    dataset_id: string;
    ultima_sync: string | null;
    estado: string;
    registros: number;
    mensaje: string | null;
    freshness: 'al_dia' | 'retrasada' | 'fuera_de_linea' | 'pendiente';
  }>;
  ultima_actualizacion: string | null;
  semana_epidemiologica: { semana: number; anio: number };
  timestamp_servidor: string;
}

// Clima
export interface WeatherData {
  ubigeo: string;
  year: number;
  month: number;
  tempMin: number;
  tempMax: number;
  tempMean: number;
  precipitationTotal: number;
}

// Estado global de la app (Zustand)
export interface AppState {
  // Período seleccionado
  selectedYear: number;
  selectedMonth: number;
  // Departamento activo
  selectedUbigeo: string | null;
  // Filtro de enfermedad
  diseaseFilter: string | null;
  // Modo oscuro
  darkMode: boolean;
  // Panel lateral abierto
  panelOpen: boolean;
  // Datos del mapa
  mapData: MapDeptData[];
  mapDataLoading: boolean;
  // Notificación de datos nuevos
  hasNewData: boolean;
  // Toast
  toast: { message: string; type: 'info' | 'success' | 'warning' | 'error' } | null;
  // Modo comparador
  comparatorUbigeos: string[];
  // Reproducción animada
  isPlaying: boolean;
}
