/**
 * Rutas de administración (protegidas por token).
 * POST /api/admin/sync
 */
import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { runSync } from '../services/syncService';

const router = Router();

// Rate limit estricto para endpoints de administración
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  message: { success: false, error: 'Demasiadas solicitudes, intenta en 1 minuto' },
});

// Middleware de autenticación por Bearer token
function requireAdminToken(req: Request, res: Response, next: NextFunction): void {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    res.status(503).json({ success: false, error: 'Token de administración no configurado' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token requerido' });
    return;
  }

  const provided = authHeader.split(' ')[1];
  if (provided !== token) {
    res.status(403).json({ success: false, error: 'Token inválido' });
    return;
  }

  next();
}

/**
 * POST /api/admin/sync
 * Fuerza una sincronización inmediata con las fuentes de datos.
 */
router.post('/sync', adminLimiter, requireAdminToken, async (_req, res) => {
  try {
    console.log('[Admin] Sincronización manual iniciada');
    const results = await runSync();
    res.json({
      success: true,
      message: 'Sincronización completada',
      resultados: results,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
