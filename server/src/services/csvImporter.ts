/**
 * Importador y normalizador de CSV epidemiológicos.
 * Soporta los formatos de dengue, EDA, IRA y zoonosis del MINSA/CDC Perú.
 * Usa PapaParse en modo streaming para manejar archivos grandes (>100 MB).
 */
import Papa from 'papaparse';
import axios from 'axios';
import type { Readable } from 'stream';
import { getDb } from '../db/client';
import { normalizeDepartment, normalizeDisease, ubigeoToDepto } from './normalizer';

export type DatasetType = 'dengue' | 'eda' | 'ira' | 'zoonosis' | 'generic';

export interface ImportResult {
  processed: number;
  inserted: number;
  updated: number;
  errors: number;
  skipped: number;
}

// Años que importamos (no procesamos el histórico completo en cada sync)
const MIN_YEAR = new Date().getFullYear() - 2;
const MAX_YEAR = new Date().getFullYear();

/**
 * Normaliza una fila del CSV de dengue al formato interno.
 * Columnas: departamento, provincia, distrito, enfermedad, ano, semana,
 *           diagnostic, tipo_dx, diresa, ubigeo, localcod, edad, tipo_edad, sexo
 */
function processDengueRow(row: Record<string, string>): {
  ubigeo: string | null;
  enfermedad: string | null;
  anio: number;
  mes: number;
  semana: number | null;
} | null {
  const anio = parseInt(row['ano'] ?? row['year'] ?? '0', 10);
  const semana = parseInt(row['semana'] ?? '0', 10);

  if (anio < MIN_YEAR || anio > MAX_YEAR || semana <= 0) return null;

  // Calcular mes aproximado desde semana epidemiológica (4 semanas ≈ 1 mes)
  const mes = Math.min(12, Math.ceil(semana / 4.33));

  // Determinar ubigeo: usar el código del distrito si está disponible, sino del departamento
  let ubigeo: string | null = null;
  if (row['ubigeo'] && row['ubigeo'].length >= 2) {
    ubigeo = ubigeoToDepto(row['ubigeo'].padStart(6, '0'));
  } else if (row['departamento']) {
    ubigeo = normalizeDepartment(row['departamento']);
  }

  if (!ubigeo) return null;

  // Determinar enfermedad
  let enfermedad = 'DENGUE';
  if (row['enfermedad']) {
    const normalized = normalizeDisease(row['enfermedad']);
    if (normalized) enfermedad = normalized;
  }

  return { ubigeo, enfermedad, anio, mes, semana };
}

/**
 * Normaliza una fila del CSV de EDA.
 * Columnas: departamento, provincia, distrito, ano, semana, sub_reg_nt, ubigeo,
 *           episodios_men5, hospitalizados_men5, defunciones_men5,
 *           episodios_may5, hospitalizados_may5, defunciones_may5
 */
function processEdaRow(row: Record<string, string>): {
  ubigeo: string | null;
  enfermedad: string;
  anio: number;
  mes: number;
  semana: number | null;
  casos: number;
  defunciones: number;
} | null {
  const anio = parseInt(row['ano'] ?? '0', 10);
  const semana = parseInt(row['semana'] ?? '0', 10);
  if (anio < MIN_YEAR || anio > MAX_YEAR || semana <= 0) return null;

  const mes = Math.min(12, Math.ceil(semana / 4.33));

  let ubigeo: string | null = null;
  if (row['ubigeo'] && row['ubigeo'].length >= 2) {
    ubigeo = ubigeoToDepto(row['ubigeo'].padStart(6, '0'));
  } else if (row['departamento']) {
    ubigeo = normalizeDepartment(row['departamento']);
  }
  if (!ubigeo) return null;

  const casos =
    (parseInt(row['episodios_men5'] ?? '0', 10) || 0) +
    (parseInt(row['episodios_may5'] ?? '0', 10) || 0);
  const defunciones =
    (parseInt(row['defunciones_men5'] ?? '0', 10) || 0) +
    (parseInt(row['defunciones_may5'] ?? '0', 10) || 0);

  return { ubigeo, enfermedad: 'EDA', anio, mes, semana, casos, defunciones };
}

/**
 * Normaliza una fila del CSV de IRA.
 * Similar a EDA pero con campos de episodios respiratorios.
 */
function processIraRow(row: Record<string, string>): {
  ubigeo: string | null;
  enfermedad: string;
  anio: number;
  mes: number;
  semana: number | null;
  casos: number;
  defunciones: number;
} | null {
  const anio = parseInt(row['ano'] ?? '0', 10);
  const semana = parseInt(row['semana'] ?? '0', 10);
  if (anio < MIN_YEAR || anio > MAX_YEAR || semana <= 0) return null;

  const mes = Math.min(12, Math.ceil(semana / 4.33));

  let ubigeo: string | null = null;
  if (row['ubigeo'] && row['ubigeo'].length >= 2) {
    ubigeo = ubigeoToDepto(row['ubigeo'].padStart(6, '0'));
  } else if (row['departamento']) {
    ubigeo = normalizeDepartment(row['departamento']);
  }
  if (!ubigeo) return null;

  const casos =
    (parseInt(row['episodios_men5'] ?? row['episodios'] ?? '0', 10) || 0) +
    (parseInt(row['episodios_may5'] ?? '0', 10) || 0);
  const defunciones =
    (parseInt(row['defunciones_men5'] ?? row['defunciones'] ?? '0', 10) || 0) +
    (parseInt(row['defunciones_may5'] ?? '0', 10) || 0);

  return { ubigeo, enfermedad: 'IRA', anio, mes, semana, casos, defunciones };
}

/**
 * Normaliza una fila del CSV de zoonosis.
 * Puede contener múltiples enfermedades: leptospirosis, bartonelosis, rabia.
 */
function processZoonosisRow(row: Record<string, string>): {
  ubigeo: string | null;
  enfermedad: string | null;
  anio: number;
  mes: number;
  semana: number | null;
} | null {
  const anio = parseInt(row['ano'] ?? '0', 10);
  const semana = parseInt(row['semana'] ?? '0', 10);
  if (anio < MIN_YEAR || anio > MAX_YEAR || semana <= 0) return null;

  const mes = Math.min(12, Math.ceil(semana / 4.33));

  let ubigeo: string | null = null;
  if (row['ubigeo'] && row['ubigeo'].length >= 2) {
    ubigeo = ubigeoToDepto(row['ubigeo'].padStart(6, '0'));
  } else if (row['departamento']) {
    ubigeo = normalizeDepartment(row['departamento']);
  }
  if (!ubigeo) return null;

  const enfermedad = row['enfermedad'] ? normalizeDisease(row['enfermedad']) : null;
  if (!enfermedad) return null;

  return { ubigeo, enfermedad, anio, mes, semana };
}

// Mapa de acumulación en memoria (ubigeo+enfermedad+año+mes → {casos, defunciones})
type AggKey = string; // "ubigeo|enfermedad|anio|mes|semana"
type AggValue = { casos: number; defunciones: number };

/**
 * Importa un CSV desde URL en modo streaming.
 * Agrega los casos por (ubigeo, enfermedad, año, mes) antes de insertar en la DB.
 */
export async function importCsvFromUrl(
  url: string,
  datasetType: DatasetType
): Promise<ImportResult> {
  const result: ImportResult = { processed: 0, inserted: 0, updated: 0, errors: 0, skipped: 0 };

  // Mapa de agregación en memoria
  const aggregated = new Map<AggKey, AggValue>();

  return new Promise((resolve, reject) => {
    axios
      .get(url, { responseType: 'stream', timeout: 120000 })
      .then((response) => {
        const stream: Readable = response.data;

        Papa.parse(stream as unknown as File, {
          header: true,
          skipEmptyLines: true,
          worker: false,
          step(results) {
            result.processed++;
            const row = results.data as Record<string, string>;

            try {
              let parsed: {
                ubigeo: string | null;
                enfermedad: string | null;
                anio: number;
                mes: number;
                semana: number | null;
                casos?: number;
                defunciones?: number;
              } | null = null;

              switch (datasetType) {
                case 'dengue':
                  parsed = processDengueRow(row);
                  break;
                case 'eda':
                  parsed = processEdaRow(row);
                  break;
                case 'ira':
                  parsed = processIraRow(row);
                  break;
                case 'zoonosis':
                  parsed = processZoonosisRow(row);
                  break;
                default:
                  // Intento genérico
                  parsed = processDengueRow(row);
              }

              if (!parsed || !parsed.ubigeo || !parsed.enfermedad) {
                result.skipped++;
                return;
              }

              const key: AggKey = `${parsed.ubigeo}|${parsed.enfermedad}|${parsed.anio}|${parsed.mes}|${parsed.semana ?? 'null'}`;
              const existing = aggregated.get(key) ?? { casos: 0, defunciones: 0 };
              aggregated.set(key, {
                casos: existing.casos + (parsed.casos ?? 1),
                defunciones: existing.defunciones + (parsed.defunciones ?? 0),
              });
            } catch {
              result.errors++;
            }
          },
          complete() {
            // Insertar/actualizar en la base de datos
            try {
              const db = getDb();
              const upsert = db.prepare(`
                INSERT INTO cases (ubigeo, enfermedad, anio, mes, semana, casos, defunciones, origen)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'official')
                ON CONFLICT(ubigeo, enfermedad, anio, mes, semana)
                DO UPDATE SET
                  casos = excluded.casos,
                  defunciones = excluded.defunciones,
                  origen = 'official'
              `);

              const insertMany = db.transaction(() => {
                for (const [key, value] of aggregated) {
                  const parts = key.split('|');
                  const semana = parts[4] === 'null' ? null : parseInt(parts[4], 10);
                  upsert.run(
                    parts[0], // ubigeo
                    parts[1], // enfermedad
                    parseInt(parts[2], 10), // anio
                    parseInt(parts[3], 10), // mes
                    semana,
                    value.casos,
                    value.defunciones
                  );
                  result.inserted++;
                }
              });
              insertMany();

              resolve(result);
            } catch (dbError) {
              reject(dbError);
            }
          },
          error(error: Error) {
            reject(error);
          },
        });
      })
      .catch(reject);
  });
}

/**
 * Importa un archivo CSV local desde /server/data/imports/.
 * Detecta el tipo de dataset por el nombre del archivo.
 */
export async function importLocalCsv(filePath: string): Promise<ImportResult> {
  const fileName = filePath.toLowerCase();
  let datasetType: DatasetType = 'generic';

  if (fileName.includes('dengue')) datasetType = 'dengue';
  else if (fileName.includes('eda') || fileName.includes('diarrea')) datasetType = 'eda';
  else if (fileName.includes('ira') || fileName.includes('respirat')) datasetType = 'ira';
  else if (fileName.includes('zoonosis') || fileName.includes('leptospirosis') || fileName.includes('bartonelosis')) datasetType = 'zoonosis';

  return importCsvFromUrl(`file://${filePath}`, datasetType);
}
