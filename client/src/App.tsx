/**
 * Componente principal de la aplicación EpiPerú.
 * Layout: header + mapa + panel lateral + tabs inferiores (rankings/alertas/comparador)
 */
import React, { useState, useCallback } from 'react';
import { PeruMap } from './components/Map/PeruMap';
import { DepartmentPanel } from './components/Panel/DepartmentPanel';
import { PeriodSelector } from './components/Controls/PeriodSelector';
import { DiseaseFilter } from './components/Controls/DiseaseFilter';
import { SearchBar } from './components/Controls/SearchBar';
import { TimelinePlayer } from './components/Controls/TimelinePlayer';
import { RankingPanel } from './components/Rankings/RankingPanel';
import { AlertsPanel } from './components/Alerts/AlertsPanel';
import { DepartmentComparator } from './components/Comparator/DepartmentComparator';
import { FreshnessIndicator } from './components/DataFreshness/FreshnessIndicator';
import { Toast } from './components/ui/Toast';
import { useAppStore } from './store/useAppStore';
import { useMapData } from './hooks/useMapData';
import { useSocket } from './hooks/useSocket';
import { useDarkMode } from './hooks/useDarkMode';
import { useDepartmentDetail } from './hooks/useDepartmentDetail';

type Tab = 'ranking' | 'alerts' | 'comparator' | 'info';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('ranking');
  const [showInfoModal, setShowInfoModal] = useState(false);

  const {
    selectedYear, selectedMonth,
    darkMode, toggleDarkMode,
    hasNewData, setHasNewData,
  } = useAppStore();

  // Hooks: cargar datos del mapa, WebSocket, modo oscuro
  const { refetch: refetchMap } = useMapData();

  const onDataUpdated = useCallback(() => {
    refetchMap();
    setHasNewData(false);
  }, [refetchMap, setHasNewData]);

  useSocket(onDataUpdated);
  useDarkMode();

  return (
    <div className="h-screen flex flex-col bg-black dark:bg-black text-slate-100 overflow-hidden">
      {/* ─────────── HEADER ─────────── */}
      <header className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10">
        <div className="flex items-center gap-3 px-4 py-2.5 flex-wrap">
          {/* Logo / Título */}
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="EpiPerú">🇵🇪</span>
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 hidden sm:block">
              EpiPerú
            </h1>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
              Vigilancia Epidemiológica
            </span>
          </div>

          {/* Buscador */}
          <div className="ml-auto sm:ml-2">
            <SearchBar />
          </div>

          {/* Selector de período */}
          <PeriodSelector />

          {/* Filtro de enfermedad */}
          <DiseaseFilter />

          {/* Timeline player */}
          <TimelinePlayer />

          {/* Modo oscuro */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-pressed={darkMode}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Barra secundaria: frescura de datos + notificación de datos nuevos */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
          <FreshnessIndicator />

          {hasNewData && (
            <button
              onClick={onDataUpdated}
              className="text-xs bg-green-600 text-white px-3 py-1 rounded-full animate-pulse hover:bg-green-700"
              aria-label="Hay datos nuevos disponibles, clic para actualizar"
            >
              🔄 ¡Datos nuevos! Actualizar
            </button>
          )}
        </div>
      </header>

      {/* ─────────── CONTENIDO PRINCIPAL ─────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mapa */}
        <PeruMap />

        {/* Panel lateral (escritorio) */}
        <div className="hidden md:flex md:w-[380px] flex-shrink-0">
          <DepartmentPanel />
        </div>
      </div>

      {/* Panel móvil (overlay) */}
      <div className="md:hidden">
        <DepartmentPanel />
      </div>

      {/* ─────────── TABS INFERIORES ─────────── */}
      <nav
        className="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center"
        role="tablist"
        aria-label="Secciones de la aplicación"
      >
        <TabButton active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} icon="🏆" label="Ranking" />
        <TabButton active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} icon="🚨" label="Alertas" />
        <TabButton active={activeTab === 'comparator'} onClick={() => setActiveTab('comparator')} icon="📊" label="Comparar" />
        <TabButton active={activeTab === 'info'} onClick={() => setShowInfoModal(true)} icon="ℹ️" label="Info" />
      </nav>

      {/* Panel expandible de tabs */}
      {activeTab !== 'info' && (
        <div className="flex-shrink-0 max-h-[40vh] md:max-h-[35vh] overflow-y-auto bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          {activeTab === 'ranking' && <RankingPanel />}
          {activeTab === 'alerts' && <AlertsPanel />}
          {activeTab === 'comparator' && <DepartmentComparator />}
        </div>
      )}

      {/* ─────────── MODAL DE INFO / AVISO ÉTICO ─────────── */}
      {showInfoModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4"
          onClick={() => setShowInfoModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Acerca de EpiPerú"
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                🇵🇪 EpiPerú — Vigilancia Epidemiológica
              </h2>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl"
                aria-label="Cerrar"
              >×</button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Aplicación de visualización de datos epidemiológicos del Perú por departamento,
              basada en datos abiertos del MINSA/CDC Perú.
            </p>

            {/* Aviso ético permanente */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3">
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
                ⚠️ Información con fines informativos basada en datos abiertos del MINSA/CDC Perú.
                No sustituye el diagnóstico médico ni los comunicados oficiales.
                Ante síntomas acude a tu establecimiento de salud o llama a <strong>INFOSALUD 113</strong>.
              </p>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>📊 Fuentes de datos: datosabiertos.gob.pe (CKAN), Open-Meteo</p>
              <p>🗓️ Semana epidemiológica: Calendario CDC Perú (domingo-sábado)</p>
              <p>🔢 Canal endémico: Media geométrica y percentiles de 5 años históricos</p>
              <p>🔵 = Datos oficiales | 🟡 = Datos de demostración</p>
            </div>

            <a
              href="https://www.dge.gob.pe/portalnuevo/"
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-3 text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              CDC Perú — Dirección General de Epidemiología →
            </a>
          </div>
        </div>
      )}

      {/* Aviso ético permanente en footer */}
      <footer
        className="flex-shrink-0 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800 px-4 py-1 text-xs text-amber-800 dark:text-amber-200 text-center"
        role="contentinfo"
      >
        Información con fines informativos. No sustituye el diagnóstico médico. Ante síntomas: INFOSALUD 113 · MINSA/CDC Perú
      </footer>

      {/* Toast global */}
      <Toast />
    </div>
  );
}

// Botón de tab reutilizable
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    role="tab"
    aria-selected={active}
    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
      active
        ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
    }`}
  >
    <span aria-hidden="true">{icon}</span>
    <span>{label}</span>
  </button>
);
