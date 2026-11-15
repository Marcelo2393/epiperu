/**
 * Panel de ranking: top 5 departamentos y top 5 enfermedades.
 */
import React, { useEffect, useState } from 'react';
import { getRankings } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import type { RankingDept, RankingDisease } from '../../types';
import { DataOriginBadge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';

export const RankingPanel: React.FC = () => {
  const { selectedYear, selectedMonth } = useAppStore();
  const [depts, setDepts] = useState<RankingDept[]>([]);
  const [diseases, setDiseases] = useState<RankingDisease[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRankings(selectedYear, selectedMonth)
      .then(data => {
        setDepts(data.top_departamentos);
        setDiseases(data.top_enfermedades);
        setTotal(data.total_casos_nacional);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedYear, selectedMonth]);

  if (loading) {
    return <div className="p-4 space-y-2"><Skeleton lines={5} /></div>;
  }

  return (
    <div className="p-4 space-y-5" role="region" aria-label="Ranking epidemiológico nacional">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 dark:text-slate-100">🏆 Ranking Nacional</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Total: {total.toLocaleString('es-PE')} casos
        </span>
      </div>

      {/* Top departamentos */}
      <section aria-label="Top 5 departamentos">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Departamentos con Mayor Incidencia
        </h3>
        <ol className="space-y-1.5">
          {depts.map(d => (
            <li key={d.ubigeo} className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">
                {d.rank}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{d.nombre}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {d.casos.toLocaleString('es-PE')}
                  </span>
                </div>
                <div className="mt-0.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(d.pct_nacional, 100)}%` }}
                    role="progressbar"
                    aria-valuenow={d.pct_nacional}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${d.pct_nacional}% del total nacional`}
                  />
                </div>
              </div>
              <DataOriginBadge origen={d.origen} />
            </li>
          ))}
        </ol>
      </section>

      {/* Top enfermedades */}
      <section aria-label="Top 5 enfermedades">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Enfermedades Más Frecuentes
        </h3>
        <ol className="space-y-1.5">
          {diseases.map(e => (
            <li key={e.codigo} className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">
                {e.rank}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{e.nombre}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {e.casos.toLocaleString('es-PE')}
                  </span>
                </div>
                <div className="mt-0.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full"
                    style={{ width: `${Math.min(e.pct_total, 100)}%` }}
                    role="progressbar"
                    aria-valuenow={e.pct_total}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${e.pct_total}% del total`}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
