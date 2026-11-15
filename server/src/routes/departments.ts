/**
 * Rutas de departamentos.
 * GET /api/departments          → lista de 25 departamentos
 * GET /api/departments/:ubigeo/summary → resumen epidemiológico
 */
import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/client';
import { calcEndemicChannel, alertLevelLabel, alertLevelColor } from '../services/endemicChannel';
import { calcIncidenceRate, calcPercentChange } from '../services/rateCalculator';
import { isValidUbigeo } from '../services/normalizer';

const router = Router();

// Esquema de validación para el resumen
const SummaryQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2030).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

/**
 * GET /api/departments
 * Lista de todos los departamentos con datos básicos.
 */
router.get('/', (_req, res) => {
  try {
    const db = getDb();
    const departments = db.prepare(`
      SELECT ubigeo, nombre, poblacion, lat, lon, region
      FROM departments
      ORDER BY nombre
    `).all();
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener departamentos' });
  }
});

/**
 * GET /api/departments/:ubigeo/summary?year=&month=
 * Resumen epidemiológico de un departamento para un período dado.
 */
router.get('/:ubigeo/summary', (req, res) => {
  try {
    const { ubigeo } = req.params;
    const padded = ubigeo.padStart(2, '0');

    if (!isValidUbigeo(padded)) {
      return res.status(400).json({ success: false, error: 'Ubigeo inválido' });
    }

    const parsed = SummaryQuery.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }

    const now = new Date();
    const year = parsed.data.year ?? now.getFullYear();
    const month = parsed.data.month ?? (now.getMonth() + 1);

    const db = getDb();

    // Datos del departamento
    const dept = db.prepare(
      'SELECT * FROM departments WHERE ubigeo = ?'
    ).get(padded) as { ubigeo: string; nombre: string; poblacion: number; lat: number; lon: number; region: string } | undefined;

    if (!dept) {
      return res.status(404).json({ success: false, error: 'Departamento no encontrado' });
    }

    // Casos del mes actual por enfermedad
    const casesThisMonth = db.prepare(`
      SELECT
        c.enfermedad,
        d.nombre as nombre_enfermedad,
        d.categoria,
        d.descripcion,
        d.prevencion,
        d.fuente_url,
        COALESCE(SUM(c.casos), 0) as casos,
        COALESCE(SUM(c.defunciones), 0) as defunciones,
        MAX(c.origen) as origen
      FROM cases c
      JOIN diseases d ON d.codigo = c.enfermedad
      WHERE c.ubigeo = ? AND c.anio = ? AND c.mes = ?
      GROUP BY c.enfermedad, d.nombre, d.categoria, d.descripcion, d.prevencion, d.fuente_url
      ORDER BY casos DESC
    `).all(padded, year, month) as Array<{
      enfermedad: string;
      nombre_enfermedad: string;
      categoria: string;
      descripcion: string;
      prevencion: string;
      fuente_url: string;
      casos: number;
      defunciones: number;
      origen: string;
    }>;

    // Acumulado anual por enfermedad
    const yearlyTotals = db.prepare(`
      SELECT enfermedad, COALESCE(SUM(casos), 0) as total_anio
      FROM cases
      WHERE ubigeo = ? AND anio = ?
      GROUP BY enfermedad
    `).all(padded, year) as Array<{ enfermedad: string; total_anio: number }>;

    const yearlyMap = new Map(yearlyTotals.map(r => [r.enfermedad, r.total_anio]));

    // Casos del mismo mes del año anterior
    const prevYear = year - 1;
    const casesPrevYear = db.prepare(`
      SELECT enfermedad, COALESCE(SUM(casos), 0) as casos_prev
      FROM cases
      WHERE ubigeo = ? AND anio = ? AND mes = ?
      GROUP BY enfermedad
    `).all(padded, prevYear, month) as Array<{ enfermedad: string; casos_prev: number }>;

    const prevYearMap = new Map(casesPrevYear.map(r => [r.enfermedad, r.casos_prev]));

    // Enriquecer con canal endémico, tasa y variación
    const enriched = casesThisMonth.map(c => {
      const endemicResult = calcEndemicChannel(padded, c.enfermedad, year, month);
      const tasa = calcIncidenceRate(c.casos, dept.poblacion);
      const casosPrev = prevYearMap.get(c.enfermedad) ?? 0;
      const variacion = calcPercentChange(c.casos, casosPrev);
      const acumuladoAnio = yearlyMap.get(c.enfermedad) ?? 0;

      return {
        enfermedad: c.enfermedad,
        nombre: c.nombre_enfermedad,
        categoria: c.categoria,
        descripcion: c.descripcion,
        prevencion: c.prevencion,
        fuente_url: c.fuente_url,
        casos_mes: c.casos,
        defunciones: c.defunciones,
        acumulado_anio: acumuladoAnio,
        tasa_100k: tasa,
        variacion_pct: variacion,
        origen: c.origen,
        nivel_alerta: endemicResult.level,
        nivel_alerta_label: alertLevelLabel(endemicResult.level),
        nivel_alerta_color: alertLevelColor(endemicResult.level),
        canal_endemico: {
          q1: endemicResult.q1,
          media_geometrica: endemicResult.geometricMean,
          q3: endemicResult.q3,
          anios_historicos: endemicResult.historicalYears,
          disponible: endemicResult.hasData,
        },
      };
    });

    // Determinar si los datos son oficiales o demo
    const hasOfficial = enriched.some(e => e.origen === 'official');

    return res.json({
      success: true,
      data: {
        departamento: {
          ubigeo: dept.ubigeo,
          nombre: dept.nombre,
          poblacion: dept.poblacion,
          region: dept.region,
          lat: dept.lat,
          lon: dept.lon,
        },
        periodo: { year, month },
        origen_datos: hasOfficial ? 'official' : 'demo',
        enfermedades: enriched,
        total_casos_mes: enriched.reduce((s, e) => s + e.casos_mes, 0),
        enfermedad_predominante: enriched.length > 0 ? enriched[0].enfermedad : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al obtener resumen' });
  }
});

export default router;
