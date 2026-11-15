/**
 * Componente Badge para indicar el origen de datos (oficial/demo) y nivel de alerta.
 */
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'official' | 'demo' | 'alert' | 'success' | 'warning' | 'info';
  className?: string;
  title?: string;
}

const variantClasses: Record<string, string> = {
  official: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900 dark:text-blue-200',
  demo:     'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900 dark:text-amber-200',
  alert:    'bg-red-100 text-red-800 border border-red-300',
  success:  'bg-green-100 text-green-800 border border-green-300',
  warning:  'bg-orange-100 text-orange-800 border border-orange-300',
  info:     'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-700 dark:text-slate-200',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'info',
  className = '',
  title,
}) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant] ?? variantClasses.info} ${className}`}
    title={title}
    role="status"
    aria-label={title}
  >
    {children}
  </span>
);

export const DataOriginBadge: React.FC<{ origen: 'official' | 'demo' }> = ({ origen }) => (
  <Badge variant={origen === 'official' ? 'official' : 'demo'} title={
    origen === 'official'
      ? 'Datos oficiales del MINSA/CDC Perú'
      : 'Datos de demostración (no oficiales)'
  }>
    {origen === 'official' ? '🔵 Datos oficiales' : '🟡 Datos de demostración'}
  </Badge>
);
