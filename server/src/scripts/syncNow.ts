/**
 * Script para forzar sincronización manual desde la línea de comandos.
 * Uso: npm run --prefix server sync
 */
import 'dotenv/config';
import { getDb } from '../db/client';
import { createSchema } from '../db/schema';
import { runSync } from '../services/syncService';

async function syncNow(): Promise<void> {
  console.log('╔════════════════════════════════════════╗');
  console.log('║    EpiPerú – Sincronización Manual     ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  try {
    const db = getDb();
    createSchema(db); // Asegurar que el esquema existe

    const results = await runSync();

    console.log('');
    console.log('Resultados:');
    for (const r of results) {
      const icon = r.estado === 'ok' ? '✓' : r.estado === 'skipped' ? '–' : '✗';
      console.log(`  ${icon} ${r.fuente}: ${r.mensaje} (${r.duracionMs}ms)`);
    }

    const totalOk = results.filter(r => r.estado === 'ok').length;
    const totalErrors = results.filter(r => r.estado === 'error').length;
    console.log('');
    console.log(`✓ Sincronización completada: ${totalOk} exitosas, ${totalErrors} errores`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error durante la sincronización:', error);
    process.exit(1);
  }
}

syncNow();
