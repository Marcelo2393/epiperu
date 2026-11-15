/**
 * Hook para obtener los datos de detalle de un departamento.
 */
import { useState, useEffect } from 'react';
import { getDepartmentSummary, getTrends, getWeather } from '../services/api';
import type { DepartmentSummary, TrendPoint, EndemicBand, WeatherData } from '../types';

interface DepartmentDetailData {
  summary: DepartmentSummary | null;
  trendData: TrendPoint[];
  endemicBands: EndemicBand[];
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
}

export function useDepartmentDetail(
  ubigeo: string | null,
  year: number,
  month: number,
  selectedDisease?: string
) {
  const [data, setData] = useState<DepartmentDetailData>({
    summary: null,
    trendData: [],
    endemicBands: [],
    weather: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!ubigeo) {
      setData(prev => ({ ...prev, summary: null, loading: false }));
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setData(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Obtener resumen del departamento
        const summary = await getDepartmentSummary(ubigeo, year, month);

        if (cancelled) return;

        // Determinar qué enfermedad graficar
        const disease = selectedDisease ?? summary.enfermedad_predominante ?? 'DENGUE';

        // Obtener tendencia y datos climáticos en paralelo
        const [trendResult, weatherResult] = await Promise.allSettled([
          getTrends(ubigeo, disease, 12, 'monthly'),
          getWeather(ubigeo, year, month),
        ]);

        if (cancelled) return;

        const trendData = trendResult.status === 'fulfilled' ? trendResult.value.data : [];
        const endemicBands = trendResult.status === 'fulfilled' ? trendResult.value.canal_endemico : [];
        const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;

        setData({
          summary,
          trendData,
          endemicBands,
          weather,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) return;
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Error al cargar los datos del departamento',
        }));
        console.error('[useDepartmentDetail] Error:', error);
      }
    };

    fetch();

    return () => { cancelled = true; };
  }, [ubigeo, year, month, selectedDisease]);

  return data;
}
