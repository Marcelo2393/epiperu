/**
 * Tests unitarios para el cálculo del Canal Endémico.
 */
import { describe, it, expect } from 'vitest';
import { geometricMean, percentile, alertLevelLabel, alertLevelColor } from '../src/services/endemicChannel';
import type { AlertLevel } from '../src/services/endemicChannel';

describe('endemicChannel', () => {
  describe('geometricMean', () => {
    it('debe calcular la media geométrica correctamente', () => {
      // GM de [1, 4, 16] = sqrt(1*4*16) = 8, pero con log(x+1):
      // log(2)+log(5)+log(17) = 0.693+1.609+2.833 = 5.135, /3 = 1.712
      // exp(1.712) - 1 = 4.54
      const result = geometricMean([1, 4, 16]);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(16);
    });

    it('debe retornar 0 para array vacío', () => {
      expect(geometricMean([])).toBe(0);
    });

    it('debe manejar valores con ceros', () => {
      // Con log(x+1), los ceros se manejan como log(1) = 0
      const result = geometricMean([0, 0, 10]);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(10);
    });

    it('debe retornar el mismo valor para array constante', () => {
      const result = geometricMean([5, 5, 5, 5]);
      // log(6)*4/4 = log(6), exp(log(6)) - 1 = 5
      expect(result).toBeCloseTo(5, 0);
    });
  });

  describe('percentile', () => {
    it('debe calcular el percentil 50 (mediana)', () => {
      const sorted = [1, 2, 3, 4, 5];
      expect(percentile(sorted, 50)).toBe(3);
    });

    it('debe calcular el percentil 25 (Q1)', () => {
      const sorted = [1, 2, 3, 4, 5];
      expect(percentile(sorted, 25)).toBe(2);
    });

    it('debe calcular el percentil 75 (Q3)', () => {
      const sorted = [1, 2, 3, 4, 5];
      expect(percentile(sorted, 75)).toBe(4);
    });

    it('debe retornar el primer elemento para P0', () => {
      const sorted = [10, 20, 30];
      expect(percentile(sorted, 0)).toBe(10);
    });

    it('debe retornar el último elemento para P100', () => {
      const sorted = [10, 20, 30];
      expect(percentile(sorted, 100)).toBe(30);
    });

    it('debe manejar un solo elemento', () => {
      expect(percentile([42], 50)).toBe(42);
    });

    it('debe interpolar correctamente', () => {
      // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], P25 = 3.25
      const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const p25 = percentile(sorted, 25);
      expect(p25).toBeGreaterThanOrEqual(2.5);
      expect(p25).toBeLessThanOrEqual(3.5);
    });
  });

  describe('alertLevelLabel', () => {
    it('debe retornar las etiquetas correctas', () => {
      expect(alertLevelLabel('success')).toBe('Éxito');
      expect(alertLevelLabel('safety')).toBe('Seguridad');
      expect(alertLevelLabel('alert')).toBe('Alerta');
      expect(alertLevelLabel('outbreak')).toBe('Brote/Epidemia');
      expect(alertLevelLabel('no_data')).toBe('Sin datos');
    });
  });

  describe('alertLevelColor', () => {
    it('debe retornar colores hex correctos', () => {
      expect(alertLevelColor('success')).toBe('#22c55e');
      expect(alertLevelColor('safety')).toBe('#eab308');
      expect(alertLevelColor('alert')).toBe('#f97316');
      expect(alertLevelColor('outbreak')).toBe('#ef4444');
      expect(alertLevelColor('no_data')).toBe('#94a3b8');
    });
  });
});
