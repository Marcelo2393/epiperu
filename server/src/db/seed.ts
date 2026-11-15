/**
 * Datos semilla de demostración para EpiPerú.
 * Incluye 25 departamentos, 10 enfermedades y 7 años de datos históricos (2020-2026)
 * con patrones epidemiológicos realistas por región.
 * Todos los registros se marcan con origen='demo'.
 */
import type Database from 'better-sqlite3';

// ─────────────────────────────────────────────────────────────────────────────
// DEPARTAMENTOS (25: 24 regiones + Callao)
// Población: proyección INEI 2024
// Coordenadas: capital del departamento
// ─────────────────────────────────────────────────────────────────────────────
export const DEPARTMENTS = [
  { ubigeo: '01', nombre: 'Amazonas',      poblacion: 420000,  lat: -6.234,  lon: -77.868, region: 'Selva' },
  { ubigeo: '02', nombre: 'Áncash',        poblacion: 1160000, lat: -9.526,  lon: -77.529, region: 'Sierra' },
  { ubigeo: '03', nombre: 'Apurímac',      poblacion: 430000,  lat: -13.635, lon: -72.881, region: 'Sierra' },
  { ubigeo: '04', nombre: 'Arequipa',      poblacion: 1497000, lat: -16.408, lon: -71.537, region: 'Sierra' },
  { ubigeo: '05', nombre: 'Ayacucho',      poblacion: 703000,  lat: -13.159, lon: -74.224, region: 'Sierra' },
  { ubigeo: '06', nombre: 'Cajamarca',     poblacion: 1341000, lat: -7.163,  lon: -78.502, region: 'Sierra' },
  { ubigeo: '07', nombre: 'Callao',        poblacion: 1130000, lat: -12.056, lon: -77.118, region: 'Costa' },
  { ubigeo: '08', nombre: 'Cusco',         poblacion: 1330000, lat: -13.531, lon: -71.978, region: 'Sierra' },
  { ubigeo: '09', nombre: 'Huancavelica',  poblacion: 357000,  lat: -12.785, lon: -74.972, region: 'Sierra' },
  { ubigeo: '10', nombre: 'Huánuco',       poblacion: 724000,  lat: -9.929,  lon: -76.242, region: 'Sierra' },
  { ubigeo: '11', nombre: 'Ica',           poblacion: 944000,  lat: -14.067, lon: -75.729, region: 'Costa' },
  { ubigeo: '12', nombre: 'Junín',         poblacion: 1361000, lat: -11.159, lon: -75.992, region: 'Sierra' },
  { ubigeo: '13', nombre: 'La Libertad',   poblacion: 2017000, lat: -8.112,  lon: -79.028, region: 'Costa' },
  { ubigeo: '14', nombre: 'Lambayeque',    poblacion: 1295000, lat: -6.771,  lon: -79.844, region: 'Costa' },
  { ubigeo: '15', nombre: 'Lima',          poblacion: 11000000,lat: -12.046, lon: -77.042, region: 'Costa' },
  { ubigeo: '16', nombre: 'Loreto',        poblacion: 1106000, lat: -3.749,  lon: -73.253, region: 'Selva' },
  { ubigeo: '17', nombre: 'Madre de Dios', poblacion: 155000,  lat: -12.593, lon: -69.186, region: 'Selva' },
  { ubigeo: '18', nombre: 'Moquegua',      poblacion: 187000,  lat: -17.193, lon: -70.932, region: 'Costa' },
  { ubigeo: '19', nombre: 'Pasco',         poblacion: 273000,  lat: -10.685, lon: -76.260, region: 'Sierra' },
  { ubigeo: '20', nombre: 'Piura',         poblacion: 1936000, lat: -5.194,  lon: -80.633, region: 'Costa' },
  { ubigeo: '21', nombre: 'Puno',          poblacion: 1437000, lat: -15.840, lon: -70.022, region: 'Sierra' },
  { ubigeo: '22', nombre: 'San Martín',    poblacion: 929000,  lat: -6.485,  lon: -76.361, region: 'Selva' },
  { ubigeo: '23', nombre: 'Tacna',         poblacion: 362000,  lat: -18.013, lon: -70.252, region: 'Costa' },
  { ubigeo: '24', nombre: 'Tumbes',        poblacion: 258000,  lat: -3.566,  lon: -80.451, region: 'Costa' },
  { ubigeo: '25', nombre: 'Ucayali',       poblacion: 580000,  lat: -8.379,  lon: -74.553, region: 'Selva' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ENFERMEDADES (10 del catálogo)
// ─────────────────────────────────────────────────────────────────────────────
export const DISEASES = [
  {
    codigo: 'DENGUE', nombre: 'Dengue', categoria: 'vectorial',
    descripcion: 'Enfermedad viral transmitida por el mosquito Aedes aegypti. Puede presentarse sin síntomas graves o con dengue severo con sangrado y fallo orgánico.',
    prevencion: 'Eliminar criaderos de agua estancada (recipientes, neumáticos, floreros). Usar repelente, ropa de manga larga y mosquiteros. Acudir al médico ante fiebre alta súbita.',
    fuente_url: 'https://www.dge.gob.pe/portalnuevo/sala-de-situacion/enfermedades-vectoriales/',
    dataset_id: 'vigilancia-epidemiológica-de-dengue'
  },
  {
    codigo: 'MALARIA', nombre: 'Malaria (Paludismo)', categoria: 'vectorial',
    descripcion: 'Infección parasitaria por Plasmodium transmitida por el mosquito Anopheles. Predomina en regiones amazónicas (Loreto, Ucayali, Madre de Dios).',
    prevencion: 'Usar mosquiteros impregnados con insecticida al dormir. Aplicar repelente. Tomar quimioprofilaxis si viaja a zonas endémicas. Acudir al médico ante fiebre con escalofríos.',
    fuente_url: 'https://www.dge.gob.pe/portalnuevo/sala-de-situacion/enfermedades-vectoriales/',
    dataset_id: null
  },
  {
    codigo: 'CHIKUNGUNYA', nombre: 'Chikungunya', categoria: 'vectorial',
    descripcion: 'Infección viral transmitida por Aedes aegypti. Característica por fiebre aguda y artralgia intensa.',
    prevencion: 'Eliminar recipientes con agua estancada. Usar repelente y ropa protectora. No existe vacuna disponible actualmente.',
    fuente_url: 'https://www.dge.gob.pe/portalnuevo/',
    dataset_id: null
  },
  {
    codigo: 'IRA', nombre: 'Infección Respiratoria Aguda (IRA)', categoria: 'respiratoria',
    descripcion: 'Conjunto de enfermedades infecciosas del tracto respiratorio. Mayor incidencia en niños menores de 5 años, adultos mayores y en temporadas frías (sierra).',
    prevencion: 'Vacunarse contra influenza y neumococo. Lavado frecuente de manos. Ventilar los ambientes. Abrigar adecuadamente a niños y adultos mayores en épocas de frío.',
    fuente_url: 'https://www.dge.gob.pe/portalnuevo/vigilancia-epidemiologica/vigilancia-de-eda-ira-sgb-utveis/',
    dataset_id: 'vigilancia-epidemiologica-de-infecciones-respiratorias-agudas-ira'
  },
  {
    codigo: 'EDA', nombre: 'Enfermedad Diarreica Aguda (EDA)', categoria: 'digestiva',
    descripcion: 'Síndrome caracterizado por deposiciones líquidas frecuentes, con posibles complicaciones de deshidratación. Principal causa de morbimortalidad infantil.',
    prevencion: 'Lavado de manos con agua y jabón antes de comer y después del baño. Consumir agua segura. Asegurar saneamiento básico. Lactancia materna exclusiva los primeros 6 meses.',
    fuente_url: 'https://www.dge.gob.pe/portalnuevo/vigilancia-epidemiologica/vigilancia-de-eda-ira-sgb-utveis/',
    dataset_id: 'vigilancia-epidemiológica-de-enfermedad-diarreica-aguda-eda'
  },
  {
    codigo: 'LEPTOSPIROSIS', nombre: 'Leptospirosis', categoria: 'zoonotica',
    descripcion: 'Infección bacteriana transmitida por contacto con orina de animales infectados (ratas). Común en zonas inundables y selva baja.',
    prevencion: 'Usar botas y guantes al trabajar en zonas inundadas. Control de roedores. No bañarse en aguas potencialmente contaminadas. Vacunar animales domésticos.',
    fuente_url: 'https://www.dge.gob.pe/portalnuevo/',
    dataset_id: 'vigilancia-epidemiológica-de-las-zoonosis'
  },
  {
    codigo: 'BARTONELOSIS', nombre: 'Bartonelosis (Verruga Peruana)', categoria: 'zoonotica',
    descripcion: 'Infección endémica del Perú causada por Bartonella bacilliformis, transmitida por la mosca Lutzomyia. Presente en valles interandinos (500-3200 msnm).',
    prevencion: 'Usar repelente y ropa de manga larga al atardecer y noche en zonas endémicas. Instalar mosquiteros de malla fina. Evitar exposición en horas de mayor actividad del vector.',
    fuente_url: 'https://www.dge.gob.pe/portalnuevo/',
    dataset_id: 'vigilancia-epidemiológica-de-las-zoonosis'
  },
  {
    codigo: 'TBC', nombre: 'Tuberculosis (TBC)', categoria: 'respiratoria',
    descripcion: 'Infección bacteriana crónica (Mycobacterium tuberculosis) que afecta principalmente los pulmones. El Perú tiene una de las mayores cargas de TBC en América Latina.',
    prevencion: 'Completar el tratamiento indicado por el médico. Ventilar los ambientes. Vacunación BCG al recién nacido. Diagnóstico temprano en contactos de casos confirmados.',
    fuente_url: 'https://www.dge.gob.pe/portalnuevo/',
    dataset_id: null
  },
  {
    codigo: 'INFLUENZA', nombre: 'Influenza (Gripe)', categoria: 'respiratoria',
    descripcion: 'Infección viral respiratoria aguda con epidemias estacionales. Mayor riesgo en adultos mayores, embarazadas, niños pequeños e inmunocomprometidos.',
    prevencion: 'Vacunación anual contra la influenza (campaña MINSA). Lavado de manos. Cubrir la boca y nariz al toser/estornudar. Evitar lugares concurridos durante brotes.',
    fuente_url: 'https://www.dge.gob.pe/portalnuevo/',
    dataset_id: null
  },
  {
    codigo: 'COVID19', nombre: 'COVID-19', categoria: 'respiratoria',
    descripcion: 'Enfermedad respiratoria causada por el coronavirus SARS-CoV-2. Puede causar desde síntomas leves hasta neumonía grave y muerte.',
    prevencion: 'Completar esquema de vacunación (incluyendo refuerzos). Ventilar ambientes cerrados. Usar mascarilla en entornos de alto riesgo. Ante síntomas, realizarse prueba diagnóstica.',
    fuente_url: 'https://www.dge.gob.pe/portalnuevo/',
    dataset_id: null
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FUENTES DE DATOS
// ─────────────────────────────────────────────────────────────────────────────
export const DATA_SOURCES = [
  {
    nombre: 'Vigilancia Dengue – CDC Perú',
    url: 'https://www.datosabiertos.gob.pe/sites/default/files/datos_abiertos_vigilancia_dengue_2000_2025_0.csv',
    dataset_id: 'vigilancia-epidemiológica-de-dengue',
  },
  {
    nombre: 'Vigilancia EDA – CDC Perú',
    url: 'https://www.datosabiertos.gob.pe/api/3/action/package_show?id=vigilancia-epidemiológica-de-enfermedad-diarreica-aguda-eda',
    dataset_id: 'vigilancia-epidemiológica-de-enfermedad-diarreica-aguda-eda',
  },
  {
    nombre: 'Vigilancia IRA – CDC Perú',
    url: 'https://www.datosabiertos.gob.pe/api/3/action/package_show?id=vigilancia-epidemiologica-de-infecciones-respiratorias-agudas-ira',
    dataset_id: 'vigilancia-epidemiologica-de-infecciones-respiratorias-agudas-ira',
  },
  {
    nombre: 'Vigilancia Zoonosis – CDC Perú',
    url: 'https://www.datosabiertos.gob.pe/sites/default/files/datos_abiertos_vigilancia_zoonosis_2000_2025_0.csv',
    dataset_id: 'vigilancia-epidemiológica-de-las-zoonosis',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GENERADOR DE CASOS DEMO
// Patrones realistas por región:
// - Dengue: alto en selva (Loreto, Ucayali, San Martín, Madre de Dios), medio en costa norte
// - Malaria: casi exclusivo en selva
// - IRA: alto en sierra en meses fríos (junio-agosto)
// - EDA: alto en verano (enero-marzo), costa y sierra
// - TBC: alto en Lima, Callao, La Libertad
// ─────────────────────────────────────────────────────────────────────────────

type CaseRecord = {
  ubigeo: string;
  enfermedad: string;
  anio: number;
  mes: number;
  semana: number | null;
  casos: number;
  defunciones: number;
  origen: string;
};

function rng(seed: number): () => number {
  // Generador pseudo-aleatorio determinista (para reproducibilidad)
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function poisson(lambda: number, rand: () => number): number {
  // Aproximación de distribución Poisson para conteos de casos
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rand();
  } while (p > L && k < 10000);
  return Math.max(0, k - 1);
}

// Factores de escala base por enfermedad y región
const BASE_RATES: Record<string, Record<string, number>> = {
  DENGUE:       { Selva: 80, Costa: 20, Sierra: 5 },
  MALARIA:      { Selva: 60, Costa: 2,  Sierra: 1 },
  CHIKUNGUNYA:  { Selva: 15, Costa: 8,  Sierra: 2 },
  IRA:          { Selva: 30, Costa: 35, Sierra: 60 },
  EDA:          { Selva: 40, Costa: 35, Sierra: 45 },
  LEPTOSPIROSIS:{ Selva: 12, Costa: 3,  Sierra: 2 },
  BARTONELOSIS: { Selva: 5,  Costa: 2,  Sierra: 8 },
  TBC:          { Selva: 8,  Costa: 15, Sierra: 6 },
  INFLUENZA:    { Selva: 10, Costa: 12, Sierra: 15 },
  COVID19:      { Selva: 20, Costa: 30, Sierra: 18 },
};

// Factores estacionales por mes (índice 0=enero, 11=diciembre)
const SEASONAL: Record<string, number[]> = {
  DENGUE:       [2.0, 2.2, 1.8, 1.2, 0.8, 0.5, 0.4, 0.4, 0.6, 0.8, 1.2, 1.7],
  MALARIA:      [1.8, 2.0, 1.6, 1.2, 0.8, 0.6, 0.5, 0.5, 0.7, 0.9, 1.2, 1.5],
  CHIKUNGUNYA:  [1.5, 1.6, 1.4, 1.1, 0.8, 0.6, 0.6, 0.7, 0.9, 1.0, 1.2, 1.4],
  IRA:          [0.8, 0.8, 1.0, 1.3, 1.6, 2.0, 2.2, 1.9, 1.4, 1.0, 0.9, 0.8],
  EDA:          [1.6, 1.7, 1.5, 1.2, 0.9, 0.7, 0.7, 0.8, 0.9, 1.0, 1.2, 1.4],
  LEPTOSPIROSIS:[1.8, 1.9, 1.6, 1.2, 0.8, 0.6, 0.5, 0.5, 0.7, 0.9, 1.2, 1.6],
  BARTONELOSIS: [1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2],
  TBC:          [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
  INFLUENZA:    [0.9, 0.9, 1.0, 1.2, 1.5, 1.8, 2.0, 1.7, 1.3, 1.0, 0.9, 0.9],
  COVID19:      [1.2, 1.0, 0.9, 1.0, 1.1, 1.3, 1.2, 1.1, 1.0, 1.0, 1.1, 1.3],
};

// Factores especiales por departamento
const DEPT_FACTORS: Record<string, Partial<Record<string, number>>> = {
  '15': { TBC: 3.0, COVID19: 2.5 },   // Lima
  '07': { TBC: 3.5, COVID19: 2.5 },   // Callao
  '16': { MALARIA: 4.0, DENGUE: 3.5 },// Loreto
  '25': { MALARIA: 3.0, DENGUE: 2.5 },// Ucayali
  '17': { MALARIA: 2.5, DENGUE: 2.0 },// Madre de Dios
  '22': { DENGUE: 2.0 },              // San Martín
  '20': { DENGUE: 1.8 },              // Piura
  '24': { DENGUE: 1.6 },              // Tumbes
  '21': { IRA: 2.0 },                 // Puno
  '09': { IRA: 1.8 },                 // Huancavelica
  '08': { IRA: 1.6 },                 // Cusco
};

// Factores de tendencia por año (pandemia COVID-19, brotes de dengue)
const YEAR_FACTOR: Record<number, Partial<Record<string, number>>> = {
  2020: { COVID19: 5.0, IRA: 1.5 },
  2021: { COVID19: 6.0, IRA: 1.3, DENGUE: 1.2 },
  2022: { COVID19: 2.0, DENGUE: 1.5 },
  2023: { DENGUE: 2.5, MALARIA: 1.3 },
  2024: { DENGUE: 3.0, MALARIA: 1.4 },
  2025: { DENGUE: 2.0, MALARIA: 1.2 },
  2026: { DENGUE: 1.8 },
};

export function generateDemoCases(): CaseRecord[] {
  const records: CaseRecord[] = [];
  const rand = rng(42); // Semilla fija para reproducibilidad

  for (const dept of DEPARTMENTS) {
    for (const disease of DISEASES) {
      for (let year = 2020; year <= 2026; year++) {
        // Solo hasta octubre 2026 (fecha actual)
        const maxMonth = year === 2026 ? 10 : 12;
        for (let month = 1; month <= maxMonth; month++) {
          const baseRate = BASE_RATES[disease.codigo]?.[dept.region] ?? 5;
          const seasonal = SEASONAL[disease.codigo]?.[month - 1] ?? 1.0;
          const deptFactor = DEPT_FACTORS[dept.ubigeo]?.[disease.codigo] ?? 1.0;
          const yearFactor = YEAR_FACTOR[year]?.[disease.codigo] ?? 1.0;

          // Lambda ajustado por población (por 100k hab)
          const popFactor = dept.poblacion / 100000;
          const lambda = baseRate * seasonal * deptFactor * yearFactor * popFactor * 0.1;

          const casos = poisson(lambda, rand);
          // Defunciones ~0.2% para dengue/malaria, 0.1% para IRA/EDA
          const tasaDefuncion = ['DENGUE', 'MALARIA', 'TBC'].includes(disease.codigo) ? 0.002 : 0.001;
          const defunciones = Math.round(casos * tasaDefuncion);

          if (casos > 0) {
            records.push({
              ubigeo: dept.ubigeo,
              enfermedad: disease.codigo,
              anio: year,
              mes: month,
              semana: null,
              casos,
              defunciones,
              origen: 'demo',
            });
          }
        }
      }
    }
  }

  return records;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL: insertar todos los datos semilla
// ─────────────────────────────────────────────────────────────────────────────
export function insertSeedData(db: Database.Database): void {
  console.log('[Seed] Insertando datos de demostración...');

  // Insertar departamentos
  const insertDept = db.prepare(`
    INSERT OR REPLACE INTO departments (ubigeo, nombre, poblacion, lat, lon, region)
    VALUES (@ubigeo, @nombre, @poblacion, @lat, @lon, @region)
  `);
  const insertManyDepts = db.transaction(() => {
    for (const d of DEPARTMENTS) insertDept.run(d);
  });
  insertManyDepts();
  console.log(`[Seed] ${DEPARTMENTS.length} departamentos insertados`);

  // Insertar enfermedades
  const insertDisease = db.prepare(`
    INSERT OR REPLACE INTO diseases (codigo, nombre, categoria, descripcion, prevencion, fuente_url, dataset_id)
    VALUES (@codigo, @nombre, @categoria, @descripcion, @prevencion, @fuente_url, @dataset_id)
  `);
  const insertManyDiseases = db.transaction(() => {
    for (const d of DISEASES) insertDisease.run(d);
  });
  insertManyDiseases();
  console.log(`[Seed] ${DISEASES.length} enfermedades insertadas`);

  // Insertar fuentes de datos
  const insertSource = db.prepare(`
    INSERT OR IGNORE INTO data_sources (nombre, url, dataset_id, estado)
    VALUES (@nombre, @url, @dataset_id, 'pending')
  `);
  const insertManySources = db.transaction(() => {
    for (const s of DATA_SOURCES) insertSource.run(s);
  });
  insertManySources();
  console.log(`[Seed] ${DATA_SOURCES.length} fuentes de datos registradas`);

  // Insertar casos demo (solo si la tabla está vacía)
  const existing = (db.prepare('SELECT COUNT(*) as cnt FROM cases').get() as { cnt: number }).cnt;
  if (existing === 0) {
    const cases = generateDemoCases();
    const insertCase = db.prepare(`
      INSERT OR IGNORE INTO cases (ubigeo, enfermedad, anio, mes, semana, casos, defunciones, origen)
      VALUES (@ubigeo, @enfermedad, @anio, @mes, @semana, @casos, @defunciones, @origen)
    `);
    const insertManyCases = db.transaction((records: CaseRecord[]) => {
      for (const c of records) insertCase.run(c);
    });
    insertManyCases(cases);
    console.log(`[Seed] ${cases.length} registros de casos demo insertados`);
  } else {
    console.log(`[Seed] Tabla cases ya tiene ${existing} registros, omitiendo semilla`);
  }

  console.log('[Seed] ✓ Datos semilla cargados correctamente');
}
