/**
 * Tests unitarios para el cálculo de tasas.
 */
import { describe, it, expect } from 'vitest';
import { calcIncidenceRate, calcPercentChange } from '../src/services/rateCalculator';

describe('rateCalculator', () => {
  describe('calcIncidenceRate', () => {
    it('debe calcular la tasa por 100 000 habitantes', () => {
      expect(calcIncidenceRate(100, 100000)).toBe(100);
    });

    it('debe calcular correctamente para poblaciones grandes', () => {
      expect(calcIncidenceRate(500, 1000000)).toBe(50);
    });

    it('debe retornar 0 si no hay casos', () => {
      expect(calcIncidenceRate(0, 100000)).toBe(0);
    });

    it('debe retornar 0 si la población es 0', () => {
      expect(calcIncidenceRate(100, 0)).toBe(0);
    });

    it('debe redondear a 2 decimales', () => {
      const result = calcIncidenceRate(33, 100000);
      expect(result).toBe(33);
    });

    it('debe manejar casos mayores que la población', () => {
      expect(calcIncidenceRate(200000, 100000)).toBe(200000);
    });
  });

  describe('calcPercentChange', () => {
    it('debe calcular la variación positiva correctamente', () => {
      expect(calcPercentChange(150, 100)).toBe(50);
    });

    it('debe calcular la variación negativa correctamente', () => {
      expect(calcPercentChange(50, 100)).toBe(-50);
    });

    it('debe retornar 0 si no hay cambio', () => {
      expect(calcPercentChange(100, 100)).toBe(0);
    });

    it('debe retornar null si el valor anterior es 0', () => {
      expect(calcPercentChange(100, 0)).toBeNull();
    });

    it('debe calcular la variación para duplicaciones', () => {
      expect(calcPercentChange(200, 100)).toBe(100);
    });

    it('debe redondear a 1 decimal', () => {
      // (33 - 30) / 30 * 100 = 10
      expect(calcPercentChange(33, 30)).toBe(10);
    });
  });
});
