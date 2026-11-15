/**
 * Servicio de sincronización de datos epidemiológicos.
 * Orquesta la descarga, normalización e importación de los datasets del MINSA/CDC.
 * Se ejecuta automáticamente vía cron (cada 6 horas) y manualmente con npm run sync.
 */
import { getDb } from '../db/client';
import { getCsvUrl, checkIfModified } from './ckanClient';
import { importCsvFromUrl, DatasetType } from './csvImporter';
import type { Server as SocketIOServer } from 'socket.io';

export interface SyncResult {
  fuente: string;
  estado: 'ok' | 'error' | 'skipped';
  registros: number;
  duracionMs: number;
  mensaje: string;
}

// Definición de los datasets a sincronizar
const DATASETS: Array<{
  nombre: string;
  datasetId: string;
  tipo: DatasetType;
  csvUrlFallback: string;
}> = [
  {
    nombre: 'Vigilancia Dengue',
    datasetId: 'vigilancia-epidemiológica-de-dengue',
    tipo: 'dengue',
    csvUrlFallback: 'https://www.datosabiertos.gob.pe/sites/default/files/datos_abiertos_vigilancia_dengue_2000_2025_0.csv',
  },
  {
    nombre: 'Vigilancia EDA',
    datasetId: 'vigilancia-epidemiológica-de-enfermedad-diarreica-aguda-eda',
    tipo: 'eda',
    csvUrlFallback: '',
  },
  {
    nombre: 'Vigilancia IRA',
    datasetId: 'vigilancia-epidemiologica-de-infecciones-respiratorias-agudas-ira',
    tipo: 'ira',
    csvUrlFallback: '',
  },
  {
    nombre: 'Vigilancia Zoonosis',
    datasetId: 'vigilancia-epidemiológica-de-las-zoonosis',
    tipo: 'zoonosis',
    csvUrlFallback: 'https://www.datosabiertos.gob.pe/sites/default/files/datos_abiertos_vigilancia_zoonosis_2000_2025_0.csv',
  },
];

let io: SocketIOServer | null = null;

/**
 * Registra la instancia de Socket.IO para emitir eventos.
 */
export function setSocketIO(socketIO: SocketIOServer): void {
  io = socketIO;
}

/**
 * Sincroniza un dataset individual.
 */
async function syncDataset(dataset: (typeof DATASETS)[0]): Promise<SyncResult> {
  const db = getDb();
  const start = Date.now();

  try {
    // Obtener la fuente de la base de datos
    const source = db.prepare(
      'SELECT id, ultima_sync FROM data_sources WHERE dataset_id = ?'
    ).get(dataset.datasetId) as { id: number; ultima_sync: string | null } | undefined;

    // Obtener URL del CSV (vía CKAN o fallback directo)
    let csvUrl = dataset.csvUrlFallback;
    try {
      const ckanUrl = await getCsvUrl(dataset.datasetId);
      if (ckanUrl) csvUrl = ckanUrl;
    } catch {
      // Usar URL fallback si CKAN falla
    }

    if (!csvUrl) {
      return {
        fuente: dataset.nombre,
        estado: 'skipped',
        registros: 0,
        duracionMs: Date.now() - start,
        mensaje: 'Sin URL de descarga disponible',
      };
    }

    // Verificar si fue modificado desde la última sincronización
    const lastSync = source?.ultima_sync ?? null;
    const modified = await checkIfModified(csvUrl, lastSync);

    if (!modified) {
      return {
        fuente: dataset.nombre,
        estado: 'skipped',
        registros: 0,
        duracionMs: Date.now() - start,
        mensaje: 'Sin cambios desde la última sincronización',
      };
    }

    // Descargar e importar
    console.log(`[Sync] Descargando ${dataset.nombre}...`);
    const importResult = await importCsvFromUrl(csvUrl, dataset.tipo);

    // Actualizar estado en data_sources
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE data_sources
      SET ultima_sync = ?, estado = 'ok', registros = ?, mensaje = ?
      WHERE dataset_id = ?
    `).run(now, importResult.inserted, `${importResult.inserted} registros importados`, dataset.datasetId);

    return {
      fuente: dataset.nombre,
      estado: 'ok',
      registros: importResult.inserted,
      duracionMs: Date.now() - start,
      mensaje: `${importResult.inserted} registros actualizados, ${importResult.skipped} omitidos`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Sync] Error en ${dataset.nombre}:`, msg);

    // Actualizar estado de error
    try {
      getDb().prepare(`
        UPDATE data_sources
        SET estado = 'error', mensaje = ?
        WHERE dataset_id = ?
      `).run(msg.substring(0, 500), dataset.datasetId);
    } catch { /* ignorar error de DB */ }

    return {
      fuente: dataset.nombre,
      estado: 'error',
      registros: 0,
      duracionMs: Date.now() - start,
      mensaje: msg.substring(0, 200),
    };
  }
}

/**
 * Ejecuta la sincronización completa de todos los datasets.
 */
export async function runSync(): Promise<SyncResult[]> {
  const db = getDb();
  console.log(`[Sync] Iniciando sincronización (${new Date().toISOString()})...`);

  const results: SyncResult[] = [];
  const updatedDatasets: string[] = [];

  for (const dataset of DATASETS) {
    const result = await syncDataset(dataset);
    results.push(result);

    // Registrar en sync_log
    db.prepare(`
      INSERT INTO sync_log (timestamp, fuente, estado, registros, duracion_ms, mensaje)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      new Date().toISOString(),
      result.fuente,
      result.estado,
      result.registros,
      result.duracionMs,
      result.mensaje
    );

    if (result.estado === 'ok' && result.registros > 0) {
      updatedDatasets.push(result.fuente);
    }
  }

  // Emitir evento WebSocket si hubo actualizaciones
  if (io && updatedDatasets.length > 0) {
    io.emit('data:updated', {
      timestamp: new Date().toISOString(),
      datasets: updatedDatasets,
    });

    // Verificar alertas y emitirlas
    const alertsQuery = db.prepare(`
      SELECT c.ubigeo, c.enfermedad, c.casos, d.nombre as dept_nombre
      FROM cases c
      JOIN departments d ON d.ubigeo = c.ubigeo
      WHERE c.anio = ?
        AND c.mes = ?
        AND c.origen = 'official'
        AND c.casos > 0
      ORDER BY c.casos DESC
      LIMIT 10
    `);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const topAlerts = alertsQuery.all(currentYear, currentMonth) as Array<{
      ubigeo: string;
      enfermedad: string;
      casos: number;
      dept_nombre: string;
    }>;

    for (const alert of topAlerts.slice(0, 3)) {
      io.emit('alert:new', {
        ubigeo: alert.ubigeo,
        departamento: alert.dept_nombre,
        enfermedad: alert.enfermedad,
        casos: alert.casos,
        nivel: 'alert',
        timestamp: new Date().toISOString(),
      });
    }
  }

  const totalRegistros = results.reduce((sum, r) => sum + r.registros, 0);
  const errores = results.filter(r => r.estado === 'error').length;

  console.log(`[Sync] ✓ Completada: ${totalRegistros} registros, ${errores} errores`);

  return results;
}

/**
 * Procesa archivos CSV manuales en /server/data/imports/.
 */
export async function processManualImports(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  const { importCsvFromUrl } = await import('./csvImporter');

  const importsDir = path.resolve(__dirname, '../../data/imports');
  if (!fs.existsSync(importsDir)) return;

  const files = fs.readdirSync(importsDir).filter(f => f.toLowerCase().endsWith('.csv'));
  if (files.length === 0) return;

  for (const file of files) {
    const filePath = path.join(importsDir, file);
    console.log(`[Sync] Procesando importación manual: ${file}`);

    try {
      // Detectar tipo por nombre del archivo
      let tipo: DatasetType = 'generic';
      const fl = file.toLowerCase();
      if (fl.includes('dengue')) tipo = 'dengue';
      else if (fl.includes('eda') || fl.includes('diarrea')) tipo = 'eda';
      else if (fl.includes('ira') || fl.includes('respirat')) tipo = 'ira';
      else if (fl.includes('zoonosis') || fl.includes('lepto') || fl.includes('barton')) tipo = 'zoonosis';

      const result = await importCsvFromUrl(`file://${filePath}`, tipo);
      console.log(`[Sync] ${file}: ${result.inserted} registros importados`);

      // Mover a processed/
      const processedDir = path.join(importsDir, 'processed');
      if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir);
      fs.renameSync(filePath, path.join(processedDir, file));
    } catch (error) {
      console.error(`[Sync] Error procesando ${file}:`, error);
    }
  }
}
