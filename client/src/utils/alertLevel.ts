/**
 * Utilidades para los niveles de alerta epidemiológica.
 */
import type { AlertLevel } from '../types';

export const ALERT_COLORS: Record<AlertLevel, string> = {
  success:  '#22c55e',
  safety:   '#eab308',
  alert:    '#f97316',
  outbreak: '#ef4444',
  no_data:  '#94a3b8',
};

export const ALERT_LABELS: Record<AlertLevel, string> = {
  success:  'Éxito',
  safety:   'Seguridad',
  alert:    'Alerta',
  outbreak: 'Brote',
  no_data:  'Sin datos',
};

export const ALERT_TAILWIND_BG: Record<AlertLevel, string> = {
  success:  'bg-green-500',
  safety:   'bg-yellow-500',
  alert:    'bg-orange-500',
  outbreak: 'bg-red-500',
  no_data:  'bg-slate-400',
};

export const ALERT_TAILWIND_TEXT: Record<AlertLevel, string> = {
  success:  'text-green-700',
  safety:   'text-yellow-700',
  alert:    'text-orange-700',
  outbreak: 'text-red-700',
  no_data:  'text-slate-500',
};

export const ALERT_TAILWIND_BORDER: Record<AlertLevel, string> = {
  success:  'border-green-500',
  safety:   'border-yellow-500',
  alert:    'border-orange-500',
  outbreak: 'border-red-500',
  no_data:  'border-slate-400',
};

// Iconos (emoji) por nivel de alerta (no depende solo del color)
export const ALERT_ICONS: Record<AlertLevel, string> = {
  success:  '✅',
  safety:   '🟡',
  alert:    '⚠️',
  outbreak: '🚨',
  no_data:  '❓',
};

// Patrones SVG para accesibilidad del mapa (no solo color)
export const ALERT_PATTERNS: Record<AlertLevel, string> = {
  success:  'none',
  safety:   'dots',
  alert:    'diagonal',
  outbreak: 'crosshatch',
  no_data:  'none',
};

export function getAlertColor(level: AlertLevel): string {
  return ALERT_COLORS[level] ?? ALERT_COLORS.no_data;
}

export function getAlertLabel(level: AlertLevel): string {
  return ALERT_LABELS[level] ?? 'Desconocido';
}
