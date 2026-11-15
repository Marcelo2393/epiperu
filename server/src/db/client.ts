/**
 * Cliente SQLite singleton usando better-sqlite3.
 * Importar desde cualquier módulo del servidor.
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ruta a la base de datos
const DB_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'epiperu.db');

// Asegurar que el directorio existe
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Instancia singleton
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    // Optimizaciones de rendimiento para SQLite
    _db.pragma('journal_mode = WAL');
    _db.pragma('synchronous = NORMAL');
    _db.pragma('foreign_keys = ON');
    _db.pragma('cache_size = -64000'); // 64 MB de caché
  }
  return _db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

export default getDb;
