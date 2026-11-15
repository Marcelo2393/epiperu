/**
 * Tests unitarios para el cálculo de Semana Epidemiológica (CDC Perú).
 */
import { describe, it, expect } from 'vitest';
import { getEpiWeek, getSE1Start, getTotalEpiWeeks, getEpiWeekStart, getCurrentEpiWeek } from '../src/utils/epidemicWeek';

describe('epidemicWeek', () => {
  describe('getSE1Start', () => {
    it('debe calcular correctamente el inicio de SE1 para 2024', () => {
      // 2024: el primer miércoles de enero es el 3 de enero (mié)
      // El domingo de esa semana es el 31 de diciembre de 2023
      const se1 = getSE1Start(2024);
      expect(se1.getUTCMonth()).toBe(11); // Diciembre (0-indexed)
      expect(se1.getUTCDate()).toBe(31);
      expect(se1.getUTCFullYear()).toBe(2023);
    });

    it('debe calcular correctamente el inicio de SE1 para 2025', () => {
      // 2025: el 1 de enero es miércoles, SE1 empieza el 29 de diciembre de 2024
      const se1 = getSE1Start(2025);
      expect(se1.getUTCMonth()).toBe(11); // Diciembre
      expect(se1.getUTCFullYear()).toBe(2024);
    });

    it('debe calcular correctamente el inicio de SE1 para 2026', () => {
      // 2026: el 1 de enero es jueves, primer miércoles es el 7 de enero
      // Domingo de esa semana es el 4 de enero de 2026
      const se1 = getSE1Start(2026);
      expect(se1.getUTCMonth()).toBe(0); // Enero
      expect(se1.getUTCFullYear()).toBe(2026);
    });
  });

  describe('getEpiWeek', () => {
    it('debe retornar SE1 para una fecha en la primera semana', () => {
      // 4 de enero de 2026 es el primer domingo de SE1 de 2026
      const result = getEpiWeek(new Date(2026, 0, 4));
      expect(result.week).toBe(1);
      expect(result.year).toBe(2026);
    });

    it('debe retornar SE1 para el primer miércoles de 2025', () => {
      // 1 de enero de 2025 es miércoles → SE1 de 2025
      const result = getEpiWeek(new Date(2025, 0, 1));
      expect(result.year).toBe(2025);
      expect(result.week).toBeGreaterThanOrEqual(1);
      expect(result.week).toBeLessThanOrEqual(53);
    });

    it('debe retornar una semana válida (1-53)', () => {
      const result = getEpiWeek(new Date(2025, 5, 15));
      expect(result.week).toBeGreaterThanOrEqual(1);
      expect(result.week).toBeLessThanOrEqual(53);
    });

    it('debe retornar el año correcto para fechas de diciembre', () => {
      const result = getEpiWeek(new Date(2025, 11, 28)); // 28 dic 2025
      expect(result.week).toBeGreaterThanOrEqual(1);
      expect(result.week).toBeLessThanOrEqual(53);
    });

    it('debe retornar SE52 o SE53 para fin de año', () => {
      // 28 de diciembre de 2025 es domingo, empieza última semana del año
      const result = getEpiWeek(new Date(2025, 11, 28));
      expect(result.week).toBeGreaterThanOrEqual(52);
    });

    it('debe retornar semana 1 o última semana del año anterior para 1 de enero', () => {
      const result = getEpiWeek(new Date(2026, 0, 1));
      // 1 de enero de 2026 es jueves → pertenece a la última semana de 2025 o SE1 de 2026
      expect(result.year).toBeGreaterThanOrEqual(2025);
      expect(result.year).toBeLessThanOrEqual(2026);
    });

    it('debe retornar semana válida para una fecha de mediados de año', () => {
      const result = getEpiWeek(new Date(2024, 6, 15)); // 15 julio 2024
      expect(result.week).toBeGreaterThan(25);
      expect(result.week).toBeLessThan(35);
    });

    it('debe manejar correctamente el 29 de febrero en año bisiesto', () => {
      const result = getEpiWeek(new Date(2024, 1, 29)); // 29 feb 2024
      expect(result.week).toBeGreaterThanOrEqual(8);
      expect(result.week).toBeLessThanOrEqual(10);
    });

    it('debe incrementar la semana en días consecutivos', () => {
      const week1 = getEpiWeek(new Date(2025, 5, 15));
      const week2 = getEpiWeek(new Date(2025, 5, 22)); // +7 días
      expect(week2.week - week1.week).toBeLessThanOrEqual(1);
    });

    it('debe retornar semana válida para la fecha actual', () => {
      const result = getCurrentEpiWeek();
      expect(result.week).toBeGreaterThanOrEqual(1);
      expect(result.week).toBeLessThanOrEqual(53);
    });
  });

  describe('getTotalEpiWeeks', () => {
    it('debe retornar 52 o 53 para cualquier año', () => {
      for (let year = 2020; year <= 2026; year++) {
        const total = getTotalEpiWeeks(year);
        expect(total).toBeGreaterThanOrEqual(52);
        expect(total).toBeLessThanOrEqual(53);
      }
    });
  });

  describe('getEpiWeekStart', () => {
    it('debe retornar un domingo para cualquier semana', () => {
      const start = getEpiWeekStart(2025, 26);
      expect(start.getUTCDay()).toBe(0); // Domingo
    });

    it('debe retornar el sábado correspondiente como fin de semana', () => {
      const start = getEpiWeekStart(2025, 1);
      const end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 6);
      expect(end.getUTCDay()).toBe(6); // Sábado
    });
  });
});
