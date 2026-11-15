/**
 * Cliente para el portal CKAN de datos abiertos del Perú.
 * Obtiene los metadatos y URLs de descarga de los datasets del MINSA/CDC.
 */
import axios from 'axios';

const CKAN_BASE = process.env.CKAN_BASE_URL ?? 'https://www.datosabiertos.gob.pe/api/3/action';
const TIMEOUT = 30000; // 30 segundos

export interface CkanResource {
  id: string;
  url: string;
  format: string;
  name: string;
  size: string;
  last_modified: string;
}

export interface CkanPackage {
  id: string;
  name: string;
  title: string;
  resources: CkanResource[];
}

/**
 * Obtiene los metadatos de un dataset CKAN por su ID/nombre.
 */
export async function getPackageMetadata(datasetId: string): Promise<CkanPackage | null> {
  try {
    const resp = await axios.get(`${CKAN_BASE}/package_show`, {
      params: { id: datasetId },
      timeout: TIMEOUT,
    });

    if (!resp.data.success || !resp.data.result?.[0]) {
      return null;
    }

    const pkg = resp.data.result[0];
    return {
      id: pkg.id,
      name: pkg.name,
      title: pkg.title,
      resources: pkg.resources.filter((r: CkanResource) =>
        r.format.toLowerCase() === 'csv'
      ),
    };
  } catch (error) {
    console.error(`[CKAN] Error obteniendo metadatos de ${datasetId}:`, error);
    return null;
  }
}

/**
 * Verifica si el recurso CSV fue modificado desde la última sincronización.
 * Usa HEAD request para verificar Last-Modified sin descargar el archivo.
 */
export async function checkIfModified(
  url: string,
  lastSync: string | null
): Promise<boolean> {
  if (!lastSync) return true; // Primera vez, siempre descargar

  try {
    const resp = await axios.head(url, { timeout: TIMEOUT });
    const lastModified = resp.headers['last-modified'];

    if (!lastModified) return true; // No podemos verificar, asumir que sí cambió

    const lastModifiedDate = new Date(lastModified);
    const lastSyncDate = new Date(lastSync);

    return lastModifiedDate > lastSyncDate;
  } catch {
    return true; // Si hay error, intentar descargar de todas formas
  }
}

/**
 * Obtiene la URL del primer recurso CSV de un dataset.
 */
export async function getCsvUrl(datasetId: string): Promise<string | null> {
  const pkg = await getPackageMetadata(datasetId);
  if (!pkg || pkg.resources.length === 0) return null;
  return pkg.resources[0].url;
}
