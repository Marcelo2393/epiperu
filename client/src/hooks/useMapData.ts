/**
 * Hook para obtener y actualizar los datos del mapa.
 */
import { useEffect, useCallback } from 'react';
import { getMapData } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export function useMapData() {
  const {
    selectedYear, selectedMonth, diseaseFilter,
    setMapData, setMapDataLoading, setToast,
  } = useAppStore();

  const fetchMapData = useCallback(async () => {
    setMapDataLoading(true);
    try {
      const data = await getMapData(
        selectedYear,
        selectedMonth,
        diseaseFilter ?? undefined
      );
      setMapData(data);
    } catch (error) {
      console.error('[useMapData] Error:', error);
      setToast({ message: 'Error al cargar datos del mapa. Verifica la conexión al servidor.', type: 'error' });
    } finally {
      setMapDataLoading(false);
    }
  }, [selectedYear, selectedMonth, diseaseFilter, setMapData, setMapDataLoading, setToast]);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  return { refetch: fetchMapData };
}
