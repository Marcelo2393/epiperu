/**
 * Componente Skeleton para estados de carga.
 */
import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 1 }) => {
  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'} h-4 ${className}`}
            role="status"
            aria-label="Cargando..."
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}
      role="status"
      aria-label="Cargando..."
    />
  );
};

export const DiseaseCardSkeleton: React.FC = () => (
  <div className="border rounded-lg p-3 space-y-2">
    <Skeleton className="h-5 w-1/2" />
    <div className="grid grid-cols-3 gap-2">
      <Skeleton className="h-8" />
      <Skeleton className="h-8" />
      <Skeleton className="h-8" />
    </div>
    <Skeleton lines={2} />
  </div>
);
