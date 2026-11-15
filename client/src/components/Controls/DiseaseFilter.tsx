/**
 * Filtro de enfermedad para el mapa.
 */
import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getDiseases } from '../../services/api';
import type { Disease } from '../../types';

export const DiseaseFilter: React.FC = () => {
  const { diseaseFilter, setDiseaseFilter } = useAppStore();
  const [diseases, setDiseases] = useState<Disease[]>([]);

  useEffect(() => {
    getDiseases()
      .then(setDiseases)
      .catch(() => console.error('[DiseaseFilter] Error cargando enfermedades'));
  }, []);

  return (
    <div>
      <label htmlFor="disease-filter" className="sr-only">Filtrar por enfermedad</label>
      <select
        id="disease-filter"
        value={diseaseFilter ?? ''}
        onChange={e => setDiseaseFilter(e.target.value || null)}
        className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-md px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
        aria-label="Filtrar mapa por enfermedad"
      >
        <option value="">🗺️ Todas (nivel global)</option>
        {diseases.map(d => (
          <option key={d.codigo} value={d.codigo}>{d.nombre}</option>
        ))}
      </select>
    </div>
  );
};
