/**
 * Ruta de alertas activas.
 * GET /api/alerts?year=&month=
 */
import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/client';
import { calcEndemicChannel, alertLevelLabel, alertLevelColor } from '../services/endemicChannel';

const router = Router();

const AlertsQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2030).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

router.get('/', (req, res) => {
  try {
    const parsed = AlertsQuery.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }

    const now = new Date();
    const year = parsed.data.year ?? now.getFullYear();
    const month = parsed.data.month ?? (now.getMonth() + 1);

    const db = getDb();

    // Obtener departamentos con casos en el período
    const casesData = db.prepare(`
      SELECT
        c.ubigeo,
        d.nombre as dept_nombre,
        c.enfermedad,
        dis.nombre as enf_nombre,
        SUM(c.casos) as casos,
        MAX(c.origen) as origen
      FROM cases c
      JOIN departments d ON d.ubigeo = c.ubigeo
      JOIN diseases dis ON dis.codigo = c.enfermedad
      WHERE c.anio = ? AND c.mes = ? AND c.casos > 0
      GROUP BY c.ubigeo, d.nombre, c.enfermedad, dis.nombre
      ORDER BY casos DESC
    `).all(year, month) as Array<{
      ubigeo: string;
      dept_nombre: string;
      enfermedad: string;
      enf_nombre: string;
      casos: number;
      origen: string;
    }>;

    // Filtrar solo los que estén en nivel alerta o brote
    const alerts = casesData
      .map(row => {
        const endemic = calcEndemicChannel(row.ubigeo, row.enfermedad, year, month);
        return {
          ubigeo: row.ubigeo,
          departamento: row.dept_nombre,
          enfermedad: row.enfermedad,
          nombre_enfermedad: row.enf_nombre,
          casos: row.casos,
          nivel: endemic.level,
          nivel_label: alertLevelLabel(endemic.level),
          nivel_color: alertLevelColor(endemic.level),
          origen: row.origen,
          fuente_url: `https://www.dge.gob.pe/portalnuevo/sala-de-situacion/`,
        };
      })
      .filter(a => a.nivel === 'alert' || a.nivel === 'outbreak')
      .sort((a, b) => {
        // Ordenar: brote primero, luego por casos
        if (a.nivel === 'outbreak' && b.nivel !== 'outbreak') return -1;
        if (b.nivel === 'outbreak' && a.nivel !== 'outbreak') return 1;
        return b.casos - a.casos;
      });

    return res.json({
      success: true,
      data: alerts,
      total: alerts.length,
      periodo: { year, month },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al obtener alertas' });
  }
});

export default router;
