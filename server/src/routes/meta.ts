/**
 * Rutas de metadatos y frescura de datos.
 * GET /api/meta/freshness
 * GET /api/endemic-channel
 * GET /api/weather
 */
import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/client';
import { getCurrentEpiWeek } from '../utils/epidemicWeek';
import { getEndemicBands, calcEndemicChannel, alertLevelLabel, alertLevelColor } from '../services/endemicChannel';
import { getMonthlyWeather } from '../services/weatherService';
import { isValidUbigeo } from '../services/normalizer';

const router = Router();

/**
 * GET /api/meta/freshness
 * Estado de frescura de cada fuente de datos.
 */
router.get('/freshness', (_req, res) => {
  try {
    const db = getDb();
    const sources = db.prepare(`
      SELECT nombre, url, dataset_id, ultima_sync, estado, registros, mensaje
      FROM data_sources
      ORDER BY nombre
    `).all() as Array<{
      nombre: string;
      url: string;
      dataset_id: string;
      ultima_sync: string | null;
      estado: string;
      registros: number;
      mensaje: string | null;
    }>;

    const { week, year } = getCurrentEpiWeek();

    // Calcular si los datos están al día (última sync < 8 días)
    const now = new Date();
    const enriched = sources.map(s => {
      let freshness: 'al_dia' | 'retrasada' | 'fuera_de_linea' | 'pendiente' = 'pendiente';

      if (s.ultima_sync) {
        const lastSync = new Date(s.ultima_sync);
        const diffDays = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
        if (s.estado === 'error') freshness = 'fuera_de_linea';
        else if (diffDays <= 7) freshness = 'al_dia';
        else freshness = 'retrasada';
      } else if (s.estado === 'error') {
        freshness = 'fuera_de_linea';
      }

      return { ...s, freshness };
    });

    // Última sincronización general
    const lastSync = sources
      .map(s => s.ultima_sync)
      .filter(Boolean)
      .sort()
      .reverse()[0] ?? null;

    res.json({
      success: true,
      data: {
        fuentes: enriched,
        ultima_actualizacion: lastSync,
        semana_epidemiologica: { semana: week, anio: year },
        timestamp_servidor: now.toISOString(),
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Error al obtener frescura de datos' });
  }
});

/**
 * GET /api/endemic-channel?ubigeo=&disease=&year=
 */
const EndemicQuery = z.object({
  ubigeo: z.string().min(1).max(2),
  disease: z.string().min(1),
  year: z.coerce.number().int().min(2000).max(2030).optional(),
});

router.get('/endemic-channel', (req, res) => {
  try {
    const parsed = EndemicQuery.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }

    const padded = parsed.data.ubigeo.padStart(2, '0');
    if (!isValidUbigeo(padded)) {
      return res.status(400).json({ success: false, error: 'Ubigeo inválido' });
    }

    const year = parsed.data.year ?? new Date().getFullYear();
    const bands = getEndemicBands(padded, parsed.data.disease.toUpperCase(), year);

    // Estado actual (mes actual)
    const currentMonth = new Date().getMonth() + 1;
    const currentResult = calcEndemicChannel(padded, parsed.data.disease.toUpperCase(), year, currentMonth);

    return res.json({
      success: true,
      data: {
        bandas_mensuales: bands,
        estado_actual: {
          mes: currentMonth,
          nivel: currentResult.level,
          nivel_label: alertLevelLabel(currentResult.level),
          nivel_color: alertLevelColor(currentResult.level),
          ...currentResult,
        },
      },
      ubigeo: padded,
      enfermedad: parsed.data.disease.toUpperCase(),
      anio: year,
    });
  } catch {
    return res.status(500).json({ success: false, error: 'Error al calcular canal endémico' });
  }
});

/**
 * GET /api/weather?ubigeo=&year=&month=
 */
const WeatherQuery = z.object({
  ubigeo: z.string().min(1).max(2),
  year: z.coerce.number().int().min(2000).max(2030).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

router.get('/weather', async (req, res) => {
  try {
    if (process.env.ENABLE_WEATHER !== 'true') {
      return res.status(503).json({ success: false, error: 'Capa climática deshabilitada' });
    }

    const parsed = WeatherQuery.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }

    const padded = parsed.data.ubigeo.padStart(2, '0');
    if (!isValidUbigeo(padded)) {
      return res.status(400).json({ success: false, error: 'Ubigeo inválido' });
    }

    const now = new Date();
    const year = parsed.data.year ?? now.getFullYear();
    const month = parsed.data.month ?? (now.getMonth() + 1);

    const weatherData = await getMonthlyWeather(padded, year, month);

    if (!weatherData) {
      return res.status(404).json({ success: false, error: 'Datos climáticos no disponibles' });
    }

    return res.json({ success: true, data: weatherData });
  } catch {
    return res.status(500).json({ success: false, error: 'Error al obtener datos climáticos' });
  }
});

export default router;
