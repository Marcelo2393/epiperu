/**
 * Componente Toast para notificaciones no intrusivas.
 */
import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

const typeClasses = {
  info:    'bg-blue-600 text-white',
  success: 'bg-green-600 text-white',
  warning: 'bg-amber-500 text-white',
  error:   'bg-red-600 text-white',
};

export const Toast: React.FC = () => {
  const { toast, setToast } = useAppStore();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast, setToast]);

  if (!toast) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl max-w-sm text-sm font-medium transition-all ${typeClasses[toast.type]}`}
    >
      <span>{toast.message}</span>
      <button
        onClick={() => setToast(null)}
        className="ml-2 opacity-75 hover:opacity-100 text-lg leading-none"
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  );
};
