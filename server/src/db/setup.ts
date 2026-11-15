/**
 * Script de configuración inicial del servidor.
 * Ejecutar con: npm run --prefix server setup
 * Crea la base SQLite, el esquema y carga los datos semilla.
 */
import 'dotenv/config';
import { getDb } from './client';
import { createSchema } from './schema';
import { insertSeedData } from './seed';

async function setup(): Promise<void> {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     EpiPerú – Configuración Inicial    ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  try {
    // 1. Inicializar la base de datos
    console.log('[Setup] Inicializando base de datos SQLite...');
    const db = getDb();

    // 2. Crear esquema
    console.log('[Setup] Creando esquema...');
    createSchema(db);

    // 3. Cargar datos semilla
    console.log('[Setup] Cargando datos de demostración...');
    insertSeedData(db);

    console.log('');
    console.log('✓ Configuración completada exitosamente');
    console.log('');
    console.log('Puedes iniciar el servidor con: npm run dev');
    console.log('O forzar sincronización con: npm run sync');

    process.exit(0);
  } catch (error) {
    console.error('[Setup] ✗ Error durante la configuración:', error);
    process.exit(1);
  }
}

setup();
