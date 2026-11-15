/**
 * Cálculo de tasas epidemiológicas.
 * - Tasa de incidencia por 100 000 habitantes
 * - Variación porcentual interanual
 */
import { getDb } from '../db/client';

/**
 * Calcula la tasa de incidencia por 100 000 habitantes.
 * @param casos - Número de casos
 * @param poblacion - Población de referencia
 * @returns Tasa redondeada a 2 decimales
 */
export function calcIncidenceRate(casos: number, poblacion: number): number {
  if (poblacion <= 0) return 0;
  return Math.round((casos / poblacion) * 100000 * 100) / 100;
}

/**
 * Calcula la variación porcentual entre dos valores.
 * @param actual - Valor actual
 * @param anterior - Valor del período anterior
 * @returns Variación en % o null si no se puede calcular
 */
export function calcPercentChange(actual: number, anterior: number): number | null {
  if (anterior === 0) return null; // No se puede calcular (evitar división por cero)
  return Math.round(((actual - anterior) / anterior) * 100 * 10) / 10;
}

/**
 * Obtiene la tasa de incidencia de un departamento/enfermedad/período
 * consultando directamente la base de datos.
 */
export function getDeptIncidenceRate(
  ubigeo: string,
  enfermedad: string,
  anio: number,
  mes: number
): { casos: number; tasa: number; defunciones: number } {
  const db = getDb();

  const row = db.prepare(`
    SELECT
      COALESCE(SUM(c.casos), 0) AS casos,
      COALESCE(SUM(c.defunciones), 0) AS defunciones,
      d.poblacion
    FROM cases c
    JOIN departments d ON d.ubigeo = c.ubigeo
    WHERE c.ubigeo = ?
      AND c.enfermedad = ?
      AND c.anio = ?
      AND c.mes = ?
    GROUP BY d.poblacion
  `).get(ubigeo, enfermedad, anio, mes) as
    | { casos: number; defunciones: number; poblacion: number }
    | undefined;

  if (!row) {
    // Buscar solo la población
    const dept = db.prepare('SELECT poblacion FROM departments WHERE ubigeo = ?').get(ubigeo) as
      | { poblacion: number }
      | undefined;
    return { casos: 0, tasa: 0, defunciones: 0 };
  }

  return {
    casos: row.casos,
    defunciones: row.defunciones,
    tasa: calcIncidenceRate(row.casos, row.poblacion),
  };
}

/**
 * Calcula el acumulado anual de casos para un departamento/enfermedad.
 */
export function getYearlyAccumulated(
  ubigeo: string,
  enfermedad: string,
  anio: number
): number {
  const db = getDb();
  const row = db.prepare(`
    SELECT COALESCE(SUM(casos), 0) AS total
    FROM cases
    WHERE ubigeo = ? AND enfermedad = ? AND anio = ?
  `).get(ubigeo, enfermedad, anio) as { total: number };
  return row.total;
}
