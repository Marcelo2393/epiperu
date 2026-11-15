/**
 * Panel lateral de detalle del departamento seleccionado.
 * En escritorio: panel lateral derecho.
 * En móvil: bottom sheet deslizable.
 */
import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useDepartmentDetail } from '../../hooks/useDepartmentDetail';
import { DiseaseList } from './DiseaseList';
import { TrendChart } from './TrendChart';
import { ClimateLayer } from './ClimateLayer';
import { DataOriginBadge } from '../ui/Badge';
import { DiseaseCardSkeleton } from '../ui/Skeleton';
import { MONTHS_ES } from '../../utils/epidemicWeek';
import { getCurrentEpiWeek } from '../../utils/epidemicWeek';

export const DepartmentPanel: React.FC = () => {
  const {
    selectedUbigeo, selectedYear, selectedMonth,
    panelOpen, setPanelOpen,
  } = useAppStore();

  const [selectedDisease, setSelectedDisease] = useState<string | undefined>(undefined);

  const { summary, trendData, endemicBands, weather, loading, error } =
    useDepartmentDetail(selectedUbigeo, selectedYear, selectedMonth, selectedDisease);

  const { week } = getCurrentEpiWeek();

  if (!panelOpen || !selectedUbigeo) return null;

  const periodoLabel = `${MONTHS_ES[selectedMonth - 1]} ${selectedYear}`;

  return (
    <>
      {/* Overlay móvil */}
      <div
        className="md:hidden fixed inset-0 bg-black/30 z-[900]"
        onClick={() => setPanelOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`
          fixed z-[901]
          md:relative md:z-auto
          bg-white dark:bg-slate-800
          border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700
          shadow-2xl md:shadow-none
          transition-transform duration-300
          flex flex-col
          /* Móvil: bottom sheet */
          bottom-0 left-0 right-0 max-h-[75vh] md:max-h-none rounded-t-2xl md:rounded-none
          /* Escritorio: columna lateral */
          md:w-[380px] md:h-full
        `}
        role="complementary"
        aria-label={summary ? `Detalle epidemiológico de ${summary.departamento.nombre}` : 'Panel de detalle'}
      >
        {/* Indicador de arrastre (solo móvil) */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden="true" />
        </div>

        {/* Cabecera */}
        <div className="flex items-start justify-between px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <div>
            {loading ? (
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
            ) : summary ? (
              <>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {summary.departamento.nombre}
                </h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    👥 {summary.departamento.poblacion.toLocaleString('es-PE')} hab.
                    · {summary.departamento.region}
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    SE{week} · {periodoLabel}
                  </span>
                  <DataOriginBadge origen={summary.origen_datos} />
                </div>
              </>
            ) : null}
          </div>
          <button
            onClick={() => setPanelOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ml-2 flex-shrink-0"
            aria-label="Cerrar panel de detalle"
          >
            ✕
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {error ? (
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              <div className="text-2xl mb-2">⚠️</div>
              <p className="text-sm">{error}</p>
              <p className="text-xs text-slate-500 mt-1">Verifica la conexión con el servidor</p>
            </div>
          ) : loading ? (
            <>
              <DiseaseCardSkeleton />
              <DiseaseCardSkeleton />
              <DiseaseCardSkeleton />
            </>
          ) : summary ? (
            <>
              {/* Resumen total */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total de casos en {periodoLabel}:</span>
                  <span className="font-bold text-lg text-slate-800 dark:text-slate-100">
                    {summary.total_casos_mes.toLocaleString('es-PE')}
                  </span>
                </div>
                {summary.enfermedad_predominante && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Enfermedad predominante: <strong>{summary.enfermedad_predominante}</strong>
                  </div>
                )}
              </div>

              {/* Lista de enfermedades */}
              <section aria-label="Enfermedades activas">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Enfermedades Activas
                </h3>
                <DiseaseList
                  enfermedades={summary.enfermedades}
                  onSelectDisease={setSelectedDisease}
                  selectedDisease={selectedDisease}
                />
              </section>

              {/* Gráfico de tendencia */}
              {trendData.length > 0 && (
                <section aria-label="Gráfico de tendencia">
                  <TrendChart
                    trendData={trendData}
                    endemicBands={endemicBands}
                    enfermedad={selectedDisease ?? summary.enfermedad_predominante ?? 'Enfermedad'}
                  />
                </section>
              )}

              {/* Capa climática */}
              <section aria-label="Datos climáticos">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Clima del Período 🌤️
                </h3>
                <ClimateLayer weather={weather} />
              </section>
            </>
          ) : null}
        </div>
      </aside>
    </>
  );
};
