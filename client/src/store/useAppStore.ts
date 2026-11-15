/**
 * Store global de la aplicación usando Zustand.
 */
import { create } from 'zustand';
import type { AppState, MapDeptData } from '../types';

interface AppStore extends AppState {
  // Acciones
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  setSelectedUbigeo: (ubigeo: string | null) => void;
  setDiseaseFilter: (disease: string | null) => void;
  toggleDarkMode: () => void;
  setPanelOpen: (open: boolean) => void;
  setMapData: (data: MapDeptData[]) => void;
  setMapDataLoading: (loading: boolean) => void;
  setHasNewData: (has: boolean) => void;
  setToast: (toast: AppState['toast']) => void;
  setComparatorUbigeos: (ubigeos: string[]) => void;
  toggleComparator: (ubigeo: string) => void;
  setIsPlaying: (playing: boolean) => void;
  advanceMonth: () => void;
}

const now = new Date();

export const useAppStore = create<AppStore>((set, get) => ({
  // Estado inicial
  selectedYear: now.getFullYear(),
  selectedMonth: now.getMonth() + 1,
  selectedUbigeo: null,
  diseaseFilter: null,
  darkMode: true,
  panelOpen: false,
  mapData: [],
  mapDataLoading: false,
  hasNewData: false,
  toast: null,
  comparatorUbigeos: [],
  isPlaying: false,

  // Acciones
  setSelectedYear: (year) => set({ selectedYear: year }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  setSelectedUbigeo: (ubigeo) => set({ selectedUbigeo: ubigeo, panelOpen: ubigeo !== null }),
  setDiseaseFilter: (disease) => set({ diseaseFilter: disease }),
  toggleDarkMode: () => {
    const isDark = !get().darkMode;
    set({ darkMode: isDark });
    // Aplicar clase dark al documento
    document.documentElement.classList.toggle('dark', isDark);
  },
  setPanelOpen: (open) => set({ panelOpen: open }),
  setMapData: (data) => set({ mapData: data }),
  setMapDataLoading: (loading) => set({ mapDataLoading: loading }),
  setHasNewData: (has) => set({ hasNewData: has }),
  setToast: (toast) => set({ toast }),
  setComparatorUbigeos: (ubigeos) => set({ comparatorUbigeos: ubigeos }),
  toggleComparator: (ubigeo) => {
    const current = get().comparatorUbigeos;
    if (current.includes(ubigeo)) {
      set({ comparatorUbigeos: current.filter(u => u !== ubigeo) });
    } else if (current.length < 3) {
      set({ comparatorUbigeos: [...current, ubigeo] });
    }
  },
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  advanceMonth: () => {
    const { selectedMonth, selectedYear } = get();
    const next = selectedMonth === 12
      ? { selectedMonth: 1, selectedYear: selectedYear + 1 }
      : { selectedMonth: selectedMonth + 1 };
    set(next);
  },
}));
