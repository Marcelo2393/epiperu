/**
 * Ruta de tendencias epidemiológicas.
 * GET /api/trends?ubigeo=&disease=&periods=12&mode=monthly
 */
import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/client';
import { calcIncidenceRate } from '../services/rateCalculator';
import { getEndemicBands } from '../services/endemicChannel';
import { isValidUbigeo } from '../services/normalizer';

const router = Router();

const TrendsQuery = z.object({
  ubigeo: z.string().min(1).max(2),
  disease: z.string().min(1),
  periods: z.coerce.number().int().min(1).max(52).default(12),
  mode: z.enum(['monthly', 'weekly']).default('monthly'),
  year: z.coerce.number().int().min(2000).max(2030).optional(),
});

router.get('/', (req, res) => {
  try {
    const parsed = TrendsQuery.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }

    const { ubigeo, disease, periods, mode } = parsed.data;
    const padded = ubigeo.padStart(2, '0');

    if (!isValidUbigeo(padded)) {
      return res.status(400).json({ success: false, error: 'Ubigeo inválido' });
    }

    const now = new Date();
    const currentYear = parsed.data.year ?? now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const db = getDb();

    // Obtener población del departamento
    const dept = db.prepare(
      'SELECT poblacion FROM departments WHERE ubigeo = ?'
    ).get(padded) as { poblacion: number } | undefined;

    if (!dept) {
      return res.status(404).json({ success: false, error: 'Departamento no encontrado' });
    }

    let trendData: Array<{ label: string; casos: number; defunciones: number; tasa: number; origen: string }>;

    if (mode === 'monthly') {
      // Últimos N meses
      const rows: Array<{
        anio: number;
        mes: number;
        casos: number;
        defunciones: number;
        origen: string;
      }> = [];

      let year = currentYear;
      let month = currentMonth;

      for (let i = 0; i < periods; i++) {
        const row = db.prepare(`
          SELECT
            ? as anio, ? as mes,
            COALESCE(SUM(casos), 0) as casos,
            COALESCE(SUM(defunciones), 0) as defunciones,
            MAX(origen) as origen
          FROM cases
          WHERE ubigeo = ? AND enfermedad = ? AND anio = ? AND mes = ?
        `).get(year, month, padded, disease.toUpperCase(), year, month) as {
          anio: number; mes: number; casos: number; defunciones: number; origen: string;
        };

        rows.unshift(row); // Agregar al inicio (orden cronológico)

        month--;
        if (month === 0) {
          month = 12;
          year--;
        }
      }

      const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      trendData = rows.map(r => ({
        label: `${MONTHS_ES[r.mes - 1]} ${r.anio}`,
        casos: r.casos,
        defunciones: r.defunciones,
        tasa: calcIncidenceRate(r.casos, dept.poblacion),
        origen: r.origen ?? 'demo',
      }));
    } else {
      // Últimas N semanas del año actual
      const rows = db.prepare(`
        SELECT
          semana,
          anio,
          COALESCE(SUM(casos), 0) as casos,
          COALESCE(SUM(defunciones), 0) as defunciones,
          MAX(origen) as origen
        FROM cases
        WHERE ubigeo = ?
          AND enfermedad = ?
          AND semana IS NOT NULL
          AND (anio = ? OR anio = ?)
        GROUP BY anio, semana
        ORDER BY anio DESC, semana DESC
        LIMIT ?
      `).all(padded, disease.toUpperCase(), currentYear, currentYear - 1, periods) as Array<{
        semana: number; anio: number; casos: number; defunciones: number; origen: string;
      }>;

      trendData = rows.reverse().map(r => ({
        label: `SE${r.semana} (${r.anio})`,
        casos: r.casos,
        defunciones: r.defunciones,
        tasa: calcIncidenceRate(r.casos, dept.poblacion),
        origen: r.origen ?? 'demo',
      }));
    }

    // Bandas del canal endémico para el año actual
    const endemicBands = getEndemicBands(padded, disease.toUpperCase(), currentYear);

    return res.json({
      success: true,
      data: trendData,
      canal_endemico: endemicBands,
      ubigeo: padded,
      enfermedad: disease.toUpperCase(),
      modo: mode,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al obtener tendencias' });
  }
});

export default router;
