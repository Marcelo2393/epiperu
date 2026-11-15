/**
 * Rutas del catálogo de enfermedades.
 * GET /api/diseases
 */
import { Router } from 'express';
import { getDb } from '../db/client';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const db = getDb();
    const diseases = db.prepare(`
      SELECT codigo, nombre, categoria, descripcion, prevencion, fuente_url, dataset_id
      FROM diseases
      ORDER BY nombre
    `).all();
    res.json({ success: true, data: diseases });
  } catch {
    res.status(500).json({ success: false, error: 'Error al obtener enfermedades' });
  }
});

export default router;
