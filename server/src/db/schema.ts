/**
 * Esquema DDL de la base de datos SQLite de EpiPerú.
 * Se ejecuta al inicializar el servidor.
 */
import type Database from 'better-sqlite3';

export function createSchema(db: Database.Database): void {
  // Tabla de departamentos (25 circunscripciones)
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      ubigeo    TEXT PRIMARY KEY,
      nombre    TEXT NOT NULL,
      poblacion INTEGER NOT NULL,
      lat       REAL NOT NULL,
      lon       REAL NOT NULL,
      region    TEXT NOT NULL DEFAULT 'Costa'
    );
  `);

  // Catálogo de enfermedades
  db.exec(`
    CREATE TABLE IF NOT EXISTS diseases (
      codigo      TEXT PRIMARY KEY,
      nombre      TEXT NOT NULL,
      categoria   TEXT NOT NULL,
      descripcion TEXT,
      prevencion  TEXT,
      fuente_url  TEXT,
      dataset_id  TEXT
    );
  `);

  // Casos epidemiológicos (datos reales u oficiales)
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      ubigeo      TEXT NOT NULL REFERENCES departments(ubigeo),
      enfermedad  TEXT NOT NULL REFERENCES diseases(codigo),
      anio        INTEGER NOT NULL,
      mes         INTEGER NOT NULL,
      semana      INTEGER,
      casos       INTEGER NOT NULL DEFAULT 0,
      defunciones INTEGER NOT NULL DEFAULT 0,
      origen      TEXT NOT NULL DEFAULT 'demo',
      UNIQUE(ubigeo, enfermedad, anio, mes, semana)
    );
    CREATE INDEX IF NOT EXISTS idx_cases_ubigeo_anio_mes
      ON cases(ubigeo, anio, mes);
    CREATE INDEX IF NOT EXISTS idx_cases_enfermedad_anio
      ON cases(enfermedad, anio);
    CREATE INDEX IF NOT EXISTS idx_cases_origen
      ON cases(origen);
  `);

  // Fuentes de datos externas
  db.exec(`
    CREATE TABLE IF NOT EXISTS data_sources (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre      TEXT NOT NULL,
      url         TEXT NOT NULL,
      dataset_id  TEXT,
      ultima_sync TEXT,
      estado      TEXT NOT NULL DEFAULT 'pending',
      registros   INTEGER DEFAULT 0,
      mensaje     TEXT
    );
  `);

  // Registro de sincronizaciones
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp   TEXT NOT NULL,
      fuente      TEXT NOT NULL,
      estado      TEXT NOT NULL,
      registros   INTEGER DEFAULT 0,
      duracion_ms INTEGER,
      mensaje     TEXT
    );
  `);

  console.log('[DB] Esquema creado/verificado correctamente');
}
