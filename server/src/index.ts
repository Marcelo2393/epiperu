/**
 * Servidor principal de EpiPerú.
 * Express + Socket.IO + node-cron
 */
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';

import { getDb } from './db/client';
import { createSchema } from './db/schema';
import { insertSeedData } from './db/seed';
import { setSocketIO, runSync } from './services/syncService';

// Rutas
import departmentsRouter from './routes/departments';
import diseasesRouter from './routes/diseases';
import mapRouter from './routes/map';
import trendsRouter from './routes/trends';
import rankingsRouter from './routes/rankings';
import alertsRouter from './routes/alerts';
import metaRouter from './routes/meta';
import adminRouter from './routes/admin';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5174';
const SYNC_CRON = process.env.SYNC_CRON ?? '0 */6 * * *';

// ─────────────────────────────────────────────────────────────────────────────
// Inicializar base de datos
// ─────────────────────────────────────────────────────────────────────────────
function initDatabase(): void {
  const db = getDb();
  createSchema(db);
  insertSeedData(db);
  console.log('[DB] Base de datos lista');
}

// ─────────────────────────────────────────────────────────────────────────────
// Configurar Express
// ─────────────────────────────────────────────────────────────────────────────
const app = express();

// Seguridad: Helmet (cabeceras HTTP)
app.use(helmet({
  // Permitir que el cliente de Leaflet cargue tiles desde terceros
  contentSecurityPolicy: false,
}));

// CORS: permitir solicitudes del frontend
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5174', 'http://localhost:4173'],
  methods: ['GET', 'POST'],
  credentials: true,
}));

// Rate limiting general
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 200, // 200 req/min por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiadas solicitudes, intenta en un minuto' },
});
app.use('/api', apiLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────────────────────
// Rutas de la API
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/departments', departmentsRouter);
app.use('/api/diseases', diseasesRouter);
app.use('/api/map', mapRouter);
app.use('/api/trends', trendsRouter);
app.use('/api/rankings', rankingsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/meta', metaRouter);
app.use('/api/endemic-channel', (req, res) => {
  // Alias para /api/meta/endemic-channel
  req.url = '/endemic-channel' + (req.url === '/' ? '' : req.url);
  metaRouter(req, res, () => {});
});
app.use('/api/weather', (req, res) => {
  req.url = '/weather' + (req.url === '/' ? '' : req.url);
  metaRouter(req, res, () => {});
});
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 404 para rutas API no encontradas
app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Socket.IO
// ─────────────────────────────────────────────────────────────────────────────
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST'],
  },
});

// Registrar instancia de Socket.IO en el servicio de sincronización
setSocketIO(io);

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Cliente conectado: ${socket.id}`);

  // Enviar estado actual al conectarse
  try {
    const db = getDb();
    const lastSync = db.prepare(`
      SELECT MAX(ultima_sync) as ultima FROM data_sources
    `).get() as { ultima: string | null };

    socket.emit('sync:status', {
      status: 'connected',
      ultima_actualizacion: lastSync.ultima,
      timestamp: new Date().toISOString(),
    });
  } catch { /* ignorar */ }

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cron job de sincronización
// ─────────────────────────────────────────────────────────────────────────────
function scheduleCronSync(): void {
  if (!cron.validate(SYNC_CRON)) {
    console.warn(`[Cron] Expresión inválida: ${SYNC_CRON}. Usando default.`);
    return;
  }

  cron.schedule(SYNC_CRON, async () => {
    console.log('[Cron] Iniciando sincronización programada...');
    try {
      await runSync();
    } catch (error) {
      console.error('[Cron] Error en sincronización programada:', error);
    }
  });

  console.log(`[Cron] Sincronización programada: ${SYNC_CRON}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Arrancar servidor
// ─────────────────────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  console.log('╔════════════════════════════════════════╗');
  console.log('║        EpiPerú – Servidor API          ║');
  console.log('╚════════════════════════════════════════╝');

  // 1. Inicializar DB
  initDatabase();

  // 2. Programar cron
  scheduleCronSync();

  // 3. Iniciar sincronización inicial (en segundo plano, sin bloquear el arranque)
  setTimeout(async () => {
    console.log('[Startup] Ejecutando sincronización inicial...');
    try {
      await runSync();
    } catch (error) {
      console.error('[Startup] Sincronización inicial falló (continuando con datos demo):', error);
    }
  }, 5000); // 5 segundos después de arrancar

  // 4. Escuchar
  httpServer.listen(PORT, () => {
    console.log(`\n✓ Servidor escuchando en http://localhost:${PORT}`);
    console.log(`  API:       http://localhost:${PORT}/api`);
    console.log(`  Health:    http://localhost:${PORT}/api/health`);
    console.log(`  Socket.IO: ws://localhost:${PORT}`);
    console.log('');
  });
}

start().catch(error => {
  console.error('Error fatal al arrancar el servidor:', error);
  process.exit(1);
});

// Cierre limpio
process.on('SIGINT', () => {
  console.log('\n[Server] Cerrando servidor...');
  httpServer.close(() => {
    console.log('[Server] Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0));
});
