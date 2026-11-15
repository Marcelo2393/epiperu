/**
 * Selector de año y mes, con indicador de semana epidemiológica.
 */
import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getCurrentEpiWeek, MONTHS_ES } from '../../utils/epidemicWeek';

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2009 }, (_, i) => currentYear - i);

export const PeriodSelector: React.FC = () => {
  const { selectedYear, selectedMonth, setSelectedYear, setSelectedMonth } = useAppStore();
  const { week, year: epiYear } = getCurrentEpiWeek();

  return (
    <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Selector de período">
      {/* Selector de año */}
      <div>
        <label htmlFor="year-select" className="sr-only">Año</label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
          className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-md px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          aria-label="Seleccionar año"
        >
          {YEARS.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Selector de mes */}
      <div>
        <label htmlFor="month-select" className="sr-only">Mes</label>
        <select
          id="month-select"
          value={selectedMonth}
          onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
          className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-md px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          aria-label="Seleccionar mes"
        >
          {MONTHS_ES.map((name, idx) => (
            <option key={idx + 1} value={idx + 1}>{name}</option>
          ))}
        </select>
      </div>

      {/* Indicador de semana epidemiológica */}
      <div
        className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-md px-2.5 py-1.5 border border-blue-200 dark:border-blue-700 whitespace-nowrap"
        title={`Semana Epidemiológica ${week} del año ${epiYear} (Calendario CDC Perú)`}
        aria-label={`Semana epidemiológica ${week} del año ${epiYear}`}
      >
        📅 SE {week} · {epiYear}
      </div>
    </div>
  );
};
