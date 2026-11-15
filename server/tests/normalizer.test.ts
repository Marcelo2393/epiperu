/**
 * Tests unitarios para el normalizador de nombres.
 */
import { describe, it, expect } from 'vitest';
import {
  normalizeString, normalizeDepartment, normalizeDisease,
  ubigeoToDepto, isValidUbigeo,
} from '../src/services/normalizer';

describe('normalizer', () => {
  describe('normalizeString', () => {
    it('debe convertir a mayúsculas', () => {
      expect(normalizeString('amazonas')).toBe('AMAZONAS');
    });

    it('debe eliminar tildes', () => {
      expect(normalizeString('Áncash')).toBe('ANCASH');
      expect(normalizeString('Apurímac')).toBe('APURIMAC');
      expect(normalizeString('Huánuco')).toBe('HUANUCO');
    });

    it('debe eliminar espacios extra', () => {
      expect(normalizeString('  La   Libertad  ')).toBe('LA LIBERTAD');
    });
  });

  describe('normalizeDepartment', () => {
    it('debe mapear nombres canónicos', () => {
      expect(normalizeDepartment('Amazonas')).toBe('01');
      expect(normalizeDepartment('Áncash')).toBe('02');
      expect(normalizeDepartment('Loreto')).toBe('16');
    });

    it('debe mapear variantes del MINSA', () => {
      expect(normalizeDepartment('LIMA REGION')).toBe('15');
      expect(normalizeDepartment('LIMA METROPOLITANA')).toBe('15');
      expect(normalizeDepartment('PROV. CONST. DEL CALLAO')).toBe('07');
    });

    it('debe manejar nombres con tildes', () => {
      expect(normalizeDepartment('Apurímac')).toBe('03');
      expect(normalizeDepartment('Huánuco')).toBe('10');
      expect(normalizeDepartment('San Martín')).toBe('22');
    });

    it('debe retornar null para nombres desconocidos', () => {
      expect(normalizeDepartment('Departamento Falso')).toBeNull();
    });

    it('debe mapear los 25 departamentos', () => {
      const nombres = [
        'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho',
        'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco',
        'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima',
        'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura',
        'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali',
      ];
      const ubigeos = nombres.map(n => normalizeDepartment(n));
      const unique = new Set(ubigeos);
      expect(unique.size).toBe(25);
      ubigeos.forEach(u => expect(u).not.toBeNull());
    });
  });

  describe('normalizeDisease', () => {
    it('debe mapear nombres canónicos', () => {
      expect(normalizeDisease('Dengue')).toBe('DENGUE');
      expect(normalizeDisease('Malaria')).toBe('MALARIA');
      expect(normalizeDisease('IRA')).toBe('IRA');
    });

    it('debe mapear variantes', () => {
      expect(normalizeDisease('Paludismo')).toBe('MALARIA');
      expect(normalizeDisease('Verruga Peruana')).toBe('BARTONELOSIS');
      expect(normalizeDisease('COVID-19')).toBe('COVID19');
      expect(normalizeDisease('Tuberculosis')).toBe('TBC');
      expect(normalizeDisease('Influenza AH1N1')).toBe('INFLUENZA');
    });

    it('debe retornar null para enfermedades desconocidas', () => {
      expect(normalizeDisease('Enfermedad Ficticia')).toBeNull();
    });
  });

  describe('ubigeoToDepto', () => {
    it('debe extraer los primeros 2 dígitos', () => {
      expect(ubigeoToDepto('010101')).toBe('01');
      expect(ubigeoToDepto('150101')).toBe('15');
      expect(ubigeoToDepto('250103')).toBe('25');
    });

    it('debe rellenar con ceros si el ubigeo es corto', () => {
      expect(ubigeoToDepto('1')).toBe('01');
      expect(ubigeoToDepto('7')).toBe('07');
    });
  });

  describe('isValidUbigeo', () => {
    it('debe validar ubigeos de 2 dígitos', () => {
      expect(isValidUbigeo('01')).toBe(true);
      expect(isValidUbigeo('25')).toBe(true);
      expect(isValidUbigeo('07')).toBe(true);
    });

    it('debe rechazar ubigeos inválidos', () => {
      expect(isValidUbigeo('00')).toBe(false);
      expect(isValidUbigeo('26')).toBe(false);
      expect(isValidUbigeo('99')).toBe(false);
    });
  });
});
