/**
 * Comparador de hasta 3 departamentos en un mismo gráfico.
 */
import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { getDepartments, getTrends } from '../../services/api';
import type { Department } from '../../types';

const COLORS = ['#2563eb', '#dc2626', '#16a34a'];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export const DepartmentComparator: React.FC = () => {
  const { selectedYear, comparatorUbigeos, toggleComparator } = useAppStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [disease, setDisease] = useState('DENGUE');
  const [chartData, setChartData] = useState<Record<string, number>[]>([]>([]));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    if (comparatorUbigeos.length < 2) {
      setChartData([]);
      return;
    }
    setLoading(true);
    Promise.all(
      comparatorUbigeos.map(u => getTrends(u, disease, 12, 'monthly'))
    ).then(results => {
      // Construir datos combinados: [{label: 'Ene 2025', '01': 120, '15': 80}, ...]
      const combined: Record<string, number | string>[] = [];
      results.forEach((res, idx) => {
        res.data.forEach((point, i) => {
          if (!combined[i]) combined[i] = { label: point.label };
          combined[i][comparatorUbigeos[idx]] = point.casos;
        });
      });
      setChartData(combined);
    }).finally(() => setLoading(false));
  }, [comparatorUbigeos, disease, selectedYear]);

  const selectedDepts = departments.filter(d => comparatorUbigeos.includes(d.ubigeo));

  return (
    <div className="p-4" role="region" aria-label="Comparador de departamentos">
      <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-3">
        📊 Comparador de Departamentos
      </h2>

      {/* Selector de enfermedad para comparar */}
      <select
        value={disease}
        onChange={e => setDisease(e.target.value)}
        className="mb-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-md px-3 py-1.5 text-sm"
        aria-label="Enfermedad a comparar"
      >
        <option value="DENGUE">Dengue</option>
        <option value="MALARIA">Malaria</option>
        <option value="IRA">IRA</option>
        <option value="EDA">EDA</option>
        <option value="COVID19">COVID-19</option>
        <option value="INFLUENZA">Influenza</option>
      </select>

      {/* Selector de departamentos */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {departments.map(d => {
          const selected = comparatorUbigeos.includes(d.ubigeo);
          const disabled = !selected && comparatorUbigeos.length >= 3;
          return (
            <button
              key={d.ubigeo}
              onClick={() => toggleComparator(d.ubigeo)}
              disabled={disabled}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                selected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : disabled
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-600 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/30'
              }`}
              aria-pressed={selected}
            >
              {d.nombre}
            </button>
          );
        })}
      </div>

      {selectedDepts.length < 2 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          Selecciona al menos 2 departamentos para comparar ({selectedDepts.length}/2)
        </p>
      ) : loading ? (
        <div className="h-48 bg-slate-100 dark:bg-slate-700 animate-pulse rounded-lg" />
      ) : (
        <>
          {/* Resumen accesible */}
          <p className="sr-only">
            Comparación de {disease} en {selectedDepts.map(d => d.nombre).join(', ')}.
          </p>
          <div role="img" aria-label={`Gráfico comparativo de ${disease}`}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15,23,42,0.95)', color: 'white', border: 'none', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {selectedDepts.map((d, i) => (
                  <Line
                    key={d.ubigeo}
                    type="monotone"
                    dataKey={d.ubigeo}
                    name={d.nombre}
                    stroke={COLORS[i]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};
