/**
 * Normalización de nombres de departamentos y enfermedades.
 * Mapea variantes del MINSA/CDC a los ubigeos y códigos canónicos.
 */

// Mapa de ubigeo canónico por nombre normalizado (sin tildes, mayúsculas)
const DEPT_MAP: Record<string, string> = {
  // Forma canónica → ubigeo
  'AMAZONAS': '01',
  'ANCASH': '02',
  'ÁNCASH': '02',
  'ANCASH REGION': '02',
  'APURIMAC': '03',
  'APURÍMAC': '03',
  'AREQUIPA': '04',
  'AYACUCHO': '05',
  'CAJAMARCA': '06',
  'CALLAO': '07',
  'PROV. CONST. DEL CALLAO': '07',
  'PROVINCIA CONSTITUCIONAL DEL CALLAO': '07',
  'CUSCO': '08',
  'CUZCO': '08',
  'HUANCAVELICA': '09',
  'HUANUCO': '10',
  'HUÁNUCO': '10',
  'ICA': '11',
  'JUNIN': '12',
  'JUNÍN': '12',
  'LA LIBERTAD': '13',
  'LAMBAYEQUE': '14',
  'LIMA': '15',
  'LIMA REGION': '15',
  'LIMA REGIÓN': '15',
  'LIMA METROPOLITANA': '15',
  'LIMA PROVINCIAS': '15',
  'LORETO': '16',
  'MADRE DE DIOS': '17',
  'MOQUEGUA': '18',
  'PASCO': '19',
  'PIURA': '20',
  'PUNO': '21',
  'SAN MARTIN': '22',
  'SAN MARTÍN': '22',
  'TACNA': '23',
  'TUMBES': '24',
  'UCAYALI': '25',
};

// Mapa de código de enfermedad por variantes de nombre
const DISEASE_MAP: Record<string, string> = {
  'DENGUE': 'DENGUE',
  'DENGUE CLASICO': 'DENGUE',
  'DENGUE CLASICO (SIN SEÑALES DE ALARMA)': 'DENGUE',
  'DENGUE CON SEÑALES DE ALARMA': 'DENGUE',
  'DENGUE GRAVE': 'DENGUE',
  'MALARIA': 'MALARIA',
  'MALARIA VIVAX': 'MALARIA',
  'MALARIA FALCIPARUM': 'MALARIA',
  'PALUDISMO': 'MALARIA',
  'CHIKUNGUNYA': 'CHIKUNGUNYA',
  'CHIKUNGUÑA': 'CHIKUNGUNYA',
  'FIEBRE CHIKUNGUNYA': 'CHIKUNGUNYA',
  'IRA': 'IRA',
  'INFECCION RESPIRATORIA AGUDA': 'IRA',
  'NEUMONIA': 'IRA',
  'NEUMONÍA': 'IRA',
  'EDA': 'EDA',
  'ENFERMEDAD DIARREICA AGUDA': 'EDA',
  'DIARREA': 'EDA',
  'LEPTOSPIROSIS': 'LEPTOSPIROSIS',
  'BARTONELOSIS': 'BARTONELOSIS',
  'VERRUGA PERUANA': 'BARTONELOSIS',
  'FIEBRE DE LA OROYA': 'BARTONELOSIS',
  'TUBERCULOSIS': 'TBC',
  'TBC': 'TBC',
  'INFLUENZA': 'INFLUENZA',
  'INFLUENZA AH1N1': 'INFLUENZA',
  'GRIPE': 'INFLUENZA',
  'COVID': 'COVID19',
  'COVID-19': 'COVID19',
  'COVID19': 'COVID19',
  'SARS-COV-2': 'COVID19',
};

/**
 * Normaliza un string: elimina tildes, convierte a mayúsculas, elimina espacios extra.
 */
export function normalizeString(str: string): string {
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mapea el nombre de un departamento (como viene del CSV del MINSA) al ubigeo canónico.
 * Retorna null si no se encuentra el mapeo.
 */
export function normalizeDepartment(name: string): string | null {
  const normalized = normalizeString(name);
  return DEPT_MAP[normalized] ?? null;
}

/**
 * Mapea el nombre de una enfermedad (como viene del CSV del MINSA) al código canónico.
 * Retorna null si no se encuentra el mapeo.
 */
export function normalizeDisease(name: string): string | null {
  const normalized = normalizeString(name);
  return DISEASE_MAP[normalized] ?? null;
}

/**
 * Retorna el ubigeo a partir del código ubigeo de distrito (6 dígitos).
 * Los primeros 2 dígitos son el código de departamento.
 */
export function ubigeoToDepto(ubigeo: string): string {
  return ubigeo.substring(0, 2).padStart(2, '0');
}

/**
 * Lista de ubigeos canónicos de los 25 departamentos.
 */
export const VALID_UBIGEOS = Object.keys(
  Object.fromEntries(Object.values(DEPT_MAP).map(v => [v, true]))
).sort();

/**
 * Verifica si un ubigeo es válido.
 */
export function isValidUbigeo(ubigeo: string): boolean {
  return VALID_UBIGEOS.includes(ubigeo.padStart(2, '0'));
}

/**
 * Verifica si un código de enfermedad es válido.
 */
export function isValidDisease(code: string): boolean {
  return Object.values(DISEASE_MAP).includes(code.toUpperCase());
}
