/**
 * Hook para gestionar el modo oscuro.
 */
import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useDarkMode() {
  const { darkMode, toggleDarkMode } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.body.style.backgroundColor = '#000000';
  }, [darkMode]);

  return { darkMode, toggleDarkMode };
}
