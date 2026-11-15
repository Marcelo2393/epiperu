/**
 * Reproductor de línea de tiempo animada por meses.
 */
import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { MONTHS_SHORT } from '../../utils/epidemicWeek';

const INTERVAL_MS = 900;

export const TimelinePlayer: React.FC = () => {
  const { isPlaying, setIsPlaying, selectedMonth, selectedYear, advanceMonth } = useAppStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        advanceMonth();
        // Detener al llegar al mes actual si es el año actual
        const now = new Date();
        if (selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1) {
          setIsPlaying(false);
        }
      }, INTERVAL_MS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, advanceMonth, selectedYear, selectedMonth, setIsPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Línea de tiempo animada">
      <button
        onClick={togglePlay}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isPlaying
            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
        }`}
        aria-label={isPlaying ? 'Pausar reproducción' : 'Reproducir línea de tiempo'}
        aria-pressed={isPlaying}
      >
        <span aria-hidden="true">{isPlaying ? '⏸' : '▶'}</span>
        {isPlaying ? 'Pausar' : 'Reproducir'}
      </button>

      {/* Barra de meses */}
      <div
        className="hidden md:flex gap-0.5"
        role="presentation"
        aria-hidden="true"
      >
        {MONTHS_SHORT.map((m, i) => (
          <div
            key={m}
            className={`w-5 h-1.5 rounded-full transition-colors ${
              i + 1 === selectedMonth ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-300 dark:bg-slate-600'
            }`}
            title={m}
          />
        ))}
      </div>
    </div>
  );
};
