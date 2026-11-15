/**
 * Ruta del mapa coropleta.
 * GET /api/map?year=&month=&disease=
 * Retorna un registro por departamento con nivel de alerta y casos.
 */
import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/client';
import { calcEndemicChannel, getGlobalAlertLevel, alertLevelColor } from '../services/endemicChannel';
import { calcIncidenceRate } from '../services/rateCalculator';

const router = Router();

const MapQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2030).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  disease: z.string().optional(),
});

router.get('/', (req, res) => {
  try {
    const parsed = MapQuery.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }

    const now = new Date();
    const year = parsed.data.year ?? now.getFullYear();
    const month = parsed.data.month ?? (now.getMonth() + 1);
    const diseaseFilter = parsed.data.disease?.toUpperCase();

    const db = getDb();

    // Obtener todos los departamentos
    const departments = db.prepare(
      'SELECT ubigeo, nombre, poblacion FROM departments'
    ).all() as Array<{ ubigeo: string; nombre: string; poblacion: number }>;

    const result = departments.map(dept => {
      let alertLevel: string;
      let casos: number;
      let enfermedad_principal: string | null = null;

      if (diseaseFilter) {
        // Filtrado por enfermedad específica
        const endemicResult = calcEndemicChannel(dept.ubigeo, diseaseFilter, year, month);
        alertLevel = endemicResult.level;

        const casosRow = db.prepare(`
          SELECT COALESCE(SUM(casos), 0) as casos
          FROM cases
          WHERE ubigeo = ? AND enfermedad = ? AND anio = ? AND mes = ?
        `).get(dept.ubigeo, diseaseFilter, year, month) as { casos: number };
        casos = casosRow.casos;
        enfermedad_principal = diseaseFilter;
      } else {
        // Nivel de alerta global (máximo de todas las enfermedades)
        alertLevel = getGlobalAlertLevel(dept.ubigeo, year, month);

        // Casos totales
        const totalesRow = db.prepare(`
          SELECT COALESCE(SUM(casos), 0) as casos
          FROM cases
          WHERE ubigeo = ? AND anio = ? AND mes = ?
        `).get(dept.ubigeo, year, month) as { casos: number };
        casos = totalesRow.casos;

        // Enfermedad principal (la de más casos)
        const topDisease = db.prepare(`
          SELECT enfermedad
          FROM cases
          WHERE ubigeo = ? AND anio = ? AND mes = ? AND casos > 0
          ORDER BY casos DESC
          LIMIT 1
        `).get(dept.ubigeo, year, month) as { enfermedad: string } | undefined;

        enfermedad_principal = topDisease?.enfermedad ?? null;
      }

      const tasa = calcIncidenceRate(casos, dept.poblacion);
      const color = alertLevelColor(alertLevel as 'success' | 'safety' | 'alert' | 'outbreak' | 'no_data');

      // Verificar origen de los datos
      const origenRow = db.prepare(`
        SELECT MAX(origen) as origen
        FROM cases
        WHERE ubigeo = ? AND anio = ? AND mes = ?
      `).get(dept.ubigeo, year, month) as { origen: string | null };

      return {
        ubigeo: dept.ubigeo,
        nombre: dept.nombre,
        nivel_alerta: alertLevel,
        color,
        casos,
        tasa_100k: tasa,
        enfermedad_principal,
        origen: origenRow.origen ?? 'demo',
      };
    });

    return res.json({
      success: true,
      data: result,
      periodo: { year, month },
      filtro_enfermedad: diseaseFilter ?? null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al obtener datos del mapa' });
  }
});

export default router;
