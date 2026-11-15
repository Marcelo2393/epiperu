/**
 * Panel de alertas epidemiológicas activas.
 */
import React, { useEffect, useState } from 'react';
import { getAlerts } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import type { ActiveAlert } from '../../types';
import { Skeleton } from '../ui/Skeleton';

export const AlertsPanel: React.FC = () => {
  const { selectedYear, selectedMonth } = useAppStore();
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAlerts(selectedYear, selectedMonth)
      .then(setAlerts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedYear, selectedMonth]);

  return (
    <div className="p-4" role="region" aria-label="Alertas epidemiológicas activas">
      <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-3">
        🚨 Alertas Activas
      </h2>

      {loading ? (
        <Skeleton lines={4} />
      ) : alerts.length === 0 ? (
        <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
          <div className="text-3xl mb-2">✅</div>
          <p>No hay alertas activas para este período.</p>
        </div>
      ) : (
        <ul className="space-y-2" aria-label={`${alerts.length} alertas activas`}>
          {alerts.map((alert, i) => (
            <li
              key={`${alert.ubigeo}-${alert.enfermedad}-${i}`}
              className="flex items-start gap-2.5 p-3 rounded-lg border"
              style={{
                borderColor: alert.nivel_color + '60',
                backgroundColor: alert.nivel_color + '15',
              }}
            >
              <span className="text-lg flex-shrink-0 mt-0.5" aria-hidden="true">
                {alert.nivel === 'outbreak' ? '🚨' : '⚠️'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                    {alert.departamento}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
                    style={{ backgroundColor: alert.nivel_color }}
                  >
                    {alert.nivel_label}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {alert.nombre_enfermedad} ·{' '}
                  <strong>{alert.casos.toLocaleString('es-PE')}</strong> casos
                </div>
                <a
                  href={alert.fuente_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-0.5 inline-block"
                  aria-label={`Ver fuente oficial para ${alert.enfermedad} en ${alert.departamento}`}
                >
                  Ver fuente oficial →
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
