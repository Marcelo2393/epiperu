/**
 * Ruta de rankings epidemiológicos.
 * GET /api/rankings?year=&month=
 */
import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/client';
import { calcIncidenceRate } from '../services/rateCalculator';

const router = Router();

const RankingsQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2030).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

router.get('/', (req, res) => {
  try {
    const parsed = RankingsQuery.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }

    const now = new Date();
    const year = parsed.data.year ?? now.getFullYear();
    const month = parsed.data.month ?? (now.getMonth() + 1);

    const db = getDb();

    // Top 5 departamentos por casos totales
    const topDepts = db.prepare(`
      SELECT
        c.ubigeo,
        d.nombre,
        d.poblacion,
        SUM(c.casos) as total_casos,
        MAX(c.origen) as origen
      FROM cases c
      JOIN departments d ON d.ubigeo = c.ubigeo
      WHERE c.anio = ? AND c.mes = ?
      GROUP BY c.ubigeo, d.nombre, d.poblacion
      ORDER BY total_casos DESC
      LIMIT 5
    `).all(year, month) as Array<{
      ubigeo: string;
      nombre: string;
      poblacion: number;
      total_casos: number;
      origen: string;
    }>;

    // Top 5 enfermedades a nivel nacional
    const topDiseases = db.prepare(`
      SELECT
        c.enfermedad,
        dis.nombre,
        dis.categoria,
        SUM(c.casos) as total_casos,
        SUM(c.defunciones) as total_defunciones,
        MAX(c.origen) as origen
      FROM cases c
      JOIN diseases dis ON dis.codigo = c.enfermedad
      WHERE c.anio = ? AND c.mes = ?
      GROUP BY c.enfermedad, dis.nombre, dis.categoria
      ORDER BY total_casos DESC
      LIMIT 5
    `).all(year, month) as Array<{
      enfermedad: string;
      nombre: string;
      categoria: string;
      total_casos: number;
      total_defunciones: number;
      origen: string;
    }>;

    // Total nacional para calcular porcentajes
    const totalNacional = topDepts.reduce((s, d) => s + d.total_casos, 0);
    const totalEnfermedades = topDiseases.reduce((s, d) => s + d.total_casos, 0);

    return res.json({
      success: true,
      data: {
        top_departamentos: topDepts.map((d, idx) => ({
          rank: idx + 1,
          ubigeo: d.ubigeo,
          nombre: d.nombre,
          casos: d.total_casos,
          tasa_100k: calcIncidenceRate(d.total_casos, d.poblacion),
          pct_nacional: totalNacional > 0 ? Math.round((d.total_casos / totalNacional) * 1000) / 10 : 0,
          origen: d.origen,
        })),
        top_enfermedades: topDiseases.map((e, idx) => ({
          rank: idx + 1,
          codigo: e.enfermedad,
          nombre: e.nombre,
          categoria: e.categoria,
          casos: e.total_casos,
          defunciones: e.total_defunciones,
          pct_total: totalEnfermedades > 0 ? Math.round((e.total_casos / totalEnfermedades) * 1000) / 10 : 0,
          origen: e.origen,
        })),
        total_casos_nacional: totalNacional,
      },
      periodo: { year, month },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al obtener rankings' });
  }
});

export default router;
