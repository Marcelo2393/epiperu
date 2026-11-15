# EpiPerú – Diseño Técnico del Sistema

**Versión:** 1.0  
**Fecha:** 2026-10-31  

---

## 1. Hallazgos de Fuentes de Datos (Investigación Previa)

### 1.1 Datasets Verificados en datosabiertos.gob.pe (CKAN)

| Dataset | ID CKAN | URL CSV | Tamaño | Frecuencia | Período | Campos clave |
|---------|---------|---------|--------|------------|---------|--------------|
| Vigilancia Dengue | `vigilancia-epidemiológica-de-dengue` | `https://www.datosabiertos.gob.pe/sites/default/files/datos_abiertos_vigilancia_dengue_2000_2025_0.csv` | 112 MB | Semanal/Mensual | 2000-2025 | departamento, provincia, distrito, enfermedad, ano, semana, tipo_dx, ubigeo, edad, sexo |
| Vigilancia EDA | `vigilancia-epidemiológica-de-enfermedad-diarreica-aguda-eda` | Obtenible vía CKAN API | ~30 MB | Semanal/Mensual | 2000-2025 | departamento, ano, semana, episodios_men5, episodios_may5, defunciones_men5/may5, ubigeo |
| Vigilancia IRA | `vigilancia-epidemiologica-de-infecciones-respiratorias-agudas-ira` | Obtenible vía CKAN API | ~40 MB | Semanal/Mensual | 2000-2025 | departamento, ano, semana, episodios_men5, episodios_may5, hospitalizados, defunciones |
| Vigilancia Zoonosis | `vigilancia-epidemiológica-de-las-zoonosis` | `https://www.datosabiertos.gob.pe/sites/default/files/datos_abiertos_vigilancia_zoonosis_2000_2025_0.csv` | 12.5 MB | Semanal/Mensual | 2000-2025 | departamento, enfermedad (rabia, bartonelosis, leptospirosis), ano, semana, tipo_dx, ubigeo |

**Nota:** Los archivos CSV de dengue y zoonosis son de gran tamaño (>100 MB). La estrategia de sincronización descarga solo los registros de los últimos 2 años o filtra por año antes de parsear.

### 1.2 Endpoint CKAN

```
Base: https://www.datosabiertos.gob.pe/api/3/action/
package_show?id=<nombre-dataset>  → metadata + URL del CSV
```

Los datos están bajo licencia **Open Data Commons Attribution License** (ODC-By).

### 1.3 Enfermedades con Dataset Propio (confirmadas)

- **Dengue**: dataset individual, actualizado semanalmente.
- **EDA** (Enfermedad Diarreica Aguda): dataset individual.
- **IRA** (Infecciones Respiratorias Agudas): dataset individual.
- **Zoonosis** (rabia humana, bartonelosis, leptospirosis): dataset individual.

### 1.4 Enfermedades Sin Dataset CSV Propio Verificado

Malaria, chikungunya, zika, influenza, COVID-19, tos ferina, sarampión, TBC no tienen un CSV descargable directamente verificado en datosabiertos.gob.pe a esta fecha. Se contemplan en los datos de **demostración** y pueden incorporarse con un importador CSV manual cuando el MINSA los publique.

### 1.5 Open-Meteo (Capa Climática)

- API gratuita, sin API key, para uso no comercial.
- Endpoint histórico: `https://archive-api.open-meteo.com/v1/archive?latitude=X&longitude=Y&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&daily=temperature_2m_mean,precipitation_sum`
- Se usan las coordenadas de la capital de cada departamento (tabla estática en el código).

### 1.6 GeoJSON de Departamentos

- Fuente: [joseluisq/peru-geojson-datasets](https://github.com/joseluisq/peru-geojson-datasets) (MIT) — incluye GeoJSON simplificado de departamentos con propiedad `DEPARTAMEN` y código `FIRST_IDDP`.
- Se incluye en el repo como `/client/public/data/peru-departamentos.geojson`.

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────┐
│           CLIENTE (React + Vite)        │
│  react-leaflet │ Recharts │ socket.io   │
│  Tailwind CSS  │ TypeScript             │
└────────────────┬────────────────────────┘
                 │ HTTP /api/* + WS /socket.io
┌────────────────▼────────────────────────┐
│         SERVIDOR (Node + Express)       │
│  API REST │ Socket.IO │ node-cron       │
│  Zod validators │ better-sqlite3        │
│  Sincronizador CKAN │ Importador CSV    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│          BASE DE DATOS (SQLite)         │
│  /server/data/epiperu.db                │
└─────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│           FUENTES EXTERNAS              │
│  datosabiertos.gob.pe (CKAN CSV)        │
│  Open-Meteo (REST, sin API key)         │
└─────────────────────────────────────────┘
```

### 2.1 Monorepo

```
EpiPeru/
├── package.json              ← raíz, scripts: setup, dev, sync
├── .env.example
├── README.md
├── client/                   ← React + Vite
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── public/
│   │   ├── data/
│   │   │   └── peru-departamentos.geojson
│   │   ├── manifest.json     ← PWA
│   │   └── sw.js             ← Service Worker
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       │   ├── Map/
│       │   │   ├── PeruMap.tsx
│       │   │   ├── DepartmentLayer.tsx
│       │   │   └── MapLegend.tsx
│       │   ├── Panel/
│       │   │   ├── DepartmentPanel.tsx
│       │   │   ├── DiseaseList.tsx
│       │   │   ├── TrendChart.tsx
│       │   │   ├── EndemicChannel.tsx
│       │   │   └── ClimateLayer.tsx
│       │   ├── Controls/
│       │   │   ├── PeriodSelector.tsx
│       │   │   ├── DiseaseFilter.tsx
│       │   │   ├── SearchBar.tsx
│       │   │   └── TimelinePlayer.tsx
│       │   ├── Rankings/
│       │   │   └── RankingPanel.tsx
│       │   ├── Alerts/
│       │   │   └── AlertsPanel.tsx
│       │   ├── Comparator/
│       │   │   └── DepartmentComparator.tsx
│       │   ├── DataFreshness/
│       │   │   └── FreshnessIndicator.tsx
│       │   └── ui/
│       │       ├── Badge.tsx
│       │       ├── Skeleton.tsx
│       │       └── Toast.tsx
│       ├── hooks/
│       │   ├── useMapData.ts
│       │   ├── useDepartmentDetail.ts
│       │   ├── useSocket.ts
│       │   └── useDarkMode.ts
│       ├── services/
│       │   └── api.ts
│       ├── store/
│       │   └── useAppStore.ts   ← Zustand
│       ├── types/
│       │   └── index.ts
│       └── utils/
│           ├── alertLevel.ts
│           └── epidemicWeek.ts
└── server/
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── index.ts             ← Express + Socket.IO
    │   ├── db/
    │   │   ├── schema.ts        ← DDL SQLite
    │   │   ├── seed.ts          ← Datos demo
    │   │   └── client.ts        ← better-sqlite3 singleton
    │   ├── routes/
    │   │   ├── departments.ts
    │   │   ├── diseases.ts
    │   │   ├── map.ts
    │   │   ├── trends.ts
    │   │   ├── rankings.ts
    │   │   ├── alerts.ts
    │   │   ├── meta.ts
    │   │   └── admin.ts
    │   ├── services/
    │   │   ├── syncService.ts      ← Orquestador cron
    │   │   ├── ckanClient.ts       ← Descarga CSV vía CKAN
    │   │   ├── csvImporter.ts      ← Normaliza e importa CSV
    │   │   ├── endemicChannel.ts   ← Cálculo canal endémico
    │   │   ├── rateCalculator.ts   ← Tasas por 100k hab.
    │   │   ├── weatherService.ts   ← Open-Meteo
    │   │   └── normalizer.ts       ← Normalización nombres
    │   └── utils/
    │       └── epidemicWeek.ts
    ├── data/
    │   ├── epiperu.db           ← SQLite (gitignored)
    │   └── imports/             ← CSV manuales
    └── tests/
        ├── epidemicWeek.test.ts
        ├── endemicChannel.test.ts
        ├── rateCalculator.test.ts
        ├── normalizer.test.ts
        └── api.test.ts          ← supertest
```

---

## 3. Modelo de Datos (SQLite)

### Tabla `departments`
```sql
CREATE TABLE departments (
  ubigeo      TEXT PRIMARY KEY,  -- Código INEI 2 dígitos (e.g., "01" = Amazonas)
  nombre      TEXT NOT NULL,
  poblacion   INTEGER NOT NULL,  -- Proyección INEI año referencia
  lat         REAL NOT NULL,     -- Latitud capital (para Open-Meteo)
  lon         REAL NOT NULL,     -- Longitud capital
  region      TEXT              -- Costa / Sierra / Selva
);
```

### Tabla `diseases`
```sql
CREATE TABLE diseases (
  codigo        TEXT PRIMARY KEY,  -- e.g., "DENGUE", "EDA", "IRA"
  nombre        TEXT NOT NULL,
  categoria     TEXT NOT NULL,     -- vectorial|respiratoria|digestiva|zoonotica|inmunoprevenible
  descripcion   TEXT,
  prevencion    TEXT,              -- Texto educativo
  fuente_url    TEXT,              -- Enlace CDC/MINSA
  dataset_id    TEXT              -- ID CKAN si tiene dataset propio
);
```

### Tabla `cases`
```sql
CREATE TABLE cases (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ubigeo        TEXT NOT NULL REFERENCES departments(ubigeo),
  enfermedad    TEXT NOT NULL REFERENCES diseases(codigo),
  anio          INTEGER NOT NULL,
  mes           INTEGER NOT NULL,   -- 1-12
  semana        INTEGER,            -- semana epidemiológica 1-53
  casos         INTEGER NOT NULL DEFAULT 0,
  defunciones   INTEGER NOT NULL DEFAULT 0,
  origen        TEXT NOT NULL DEFAULT 'demo',  -- 'official'|'demo'
  UNIQUE(ubigeo, enfermedad, anio, mes, semana)
);
CREATE INDEX idx_cases_ubigeo_anio_mes ON cases(ubigeo, anio, mes);
CREATE INDEX idx_cases_enfermedad_anio ON cases(enfermedad, anio);
```

### Tabla `data_sources`
```sql
CREATE TABLE data_sources (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL,
  url           TEXT NOT NULL,
  dataset_id    TEXT,
  ultima_sync   TEXT,              -- ISO 8601
  estado        TEXT DEFAULT 'pending',  -- 'ok'|'error'|'pending'|'offline'
  registros     INTEGER DEFAULT 0,
  mensaje       TEXT
);
```

### Tabla `sync_log`
```sql
CREATE TABLE sync_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp   TEXT NOT NULL,
  fuente      TEXT NOT NULL,
  estado      TEXT NOT NULL,
  registros   INTEGER,
  duracion_ms INTEGER,
  mensaje     TEXT
);
```

---

## 4. API REST

Base URL: `http://localhost:3000/api`

| Método | Endpoint | Descripción | Params |
|--------|----------|-------------|--------|
| GET | `/departments` | Lista de 25 departamentos con datos básicos | – |
| GET | `/departments/:ubigeo/summary` | Resumen epidemiológico de un departamento | `?year=&month=` |
| GET | `/diseases` | Catálogo de enfermedades | – |
| GET | `/map` | Datos por departamento para pintar el mapa (nivel alerta, casos) | `?year=&month=&disease=` |
| GET | `/trends` | Serie temporal de casos | `?ubigeo=&disease=&weeks=12` |
| GET | `/rankings` | Top 5 departamentos y top 5 enfermedades | `?year=&month=` |
| GET | `/alerts` | Departamentos en alerta o brote | `?year=&month=` |
| GET | `/meta/freshness` | Frescura de datos por fuente | – |
| GET | `/weather` | Temp. y precipitación de un departamento | `?ubigeo=&year=&month=` |
| GET | `/endemic-channel` | Canal endémico histórico | `?ubigeo=&disease=` |
| POST | `/admin/sync` | Fuerza sincronización | Header: `Authorization: Bearer <ADMIN_TOKEN>` |

### Eventos Socket.IO

| Evento | Dirección | Payload |
|--------|-----------|---------|
| `data:updated` | Server → Client | `{ timestamp, datasets: string[] }` |
| `alert:new` | Server → Client | `{ ubigeo, enfermedad, nivel, casos }` |
| `sync:status` | Server → Client | `{ status, message }` |

---

## 5. Lógica de Alertas y Canal Endémico

### Algoritmo (RN-01)

```
Para cada (departamento, enfermedad, semana/mes):
  1. Obtener los valores del mismo mes/semana para los últimos 5 años disponibles.
  2. Calcular:
     - Media geométrica (exp(mean(log(casos+1))) - 1)
     - Percentil 25 (Q1)
     - Percentil 75 (Q3)
  3. Clasificar el valor actual:
     - < Q1        → Verde (éxito)
     - Q1 ≤ x ≤ μg → Amarillo (seguridad)
     - μg < x ≤ Q3 → Naranja (alerta)
     - > Q3        → Rojo (brote)
  4. Si hay < 3 años de datos → Gris (sin datos históricos)
```

### Cálculo de la SE (RN-02)

La semana epidemiológica peruana sigue el calendario CDC (MMWR weeks):
- Empieza el domingo.
- La SE 1 es la semana que contiene el primer miércoles del año.
- Se implementa en `/server/src/utils/epidemicWeek.ts` y se testea con Vitest.

---

## 6. Proceso de Sincronización

```
syncService.ts (cron: cada 6 horas)
│
├── Para cada dataset en data_sources:
│   ├── GET CKAN package_show → URL del CSV
│   ├── HEAD request → verificar Last-Modified
│   ├── Si modificado desde última sync:
│   │   ├── Descargar CSV (stream, no buffer completo)
│   │   ├── Parsear con PapaParse
│   │   ├── Normalizar departamentos (normalizer.ts)
│   │   ├── Agregar por (ubigeo, enfermedad, año, mes)
│   │   ├── Upsert en tabla cases con origen='official'
│   │   └── Actualizar data_sources.ultima_sync
│   └── Si error → log + continuar con datos existentes
│
├── Emitir data:updated via Socket.IO
└── Registrar en sync_log
```

**Optimización para CSV grandes (>100 MB):**  
- Usar streaming con `papaparse` en modo `step` para no cargar todo el archivo en memoria.  
- Solo procesar registros del año actual y año anterior.

---

## 7. Datos Semilla de Demostración

Archivo: `/server/src/db/seed.ts`

- 25 departamentos con población (fuente: INEI proyección 2024).
- 10 enfermedades: DENGUE, MALARIA, CHIKUNGUNYA, IRA, EDA, LEPTOSPIROSIS, BARTONELOSIS, TBC, INFLUENZA, COVID19.
- 12 meses × 25 departamentos × 10 enfermedades = 3000 registros por año.
- Datos realistas: dengue alto en selva (Loreto, Ucayali, Madre de Dios), malaria en selva, IRA alto en sierra (Puno, Cusco, Huancavelica) en época de frío.
- Serie histórica: 2020–2026 (6 años) para permitir canal endémico.
- Todos marcados con `origen='demo'`.

---

## 8. Normalización de Nombres de Departamentos

El MINSA usa variantes en sus CSVs:

| Nombre en CSV MINSA | Ubigeo canónico |
|---------------------|-----------------|
| AMAZONAS | 01 |
| ANCASH | 02 |
| APURIMAC | 03 |
| AREQUIPA | 04 |
| AYACUCHO | 05 |
| CAJAMARCA | 06 |
| CALLAO | 07 |
| CUSCO | 08 |
| HUANCAVELICA | 09 |
| HUANUCO | 10 |
| ICA | 11 |
| JUNIN | 12 |
| LA LIBERTAD | 13 |
| LAMBAYEQUE | 14 |
| LIMA REGION | 15 |
| LIMA METROPOLITANA | 15 |
| LORETO | 16 |
| MADRE DE DIOS | 17 |
| MOQUEGUA | 18 |
| PASCO | 19 |
| PIURA | 20 |
| PUNO | 21 |
| SAN MARTIN | 22 |
| TACNA | 23 |
| TUMBES | 24 |
| UCAYALI | 25 |

---

## 9. Configuración de Variables de Entorno

Archivo `.env.example`:
```env
# Puerto del servidor backend
PORT=3000

# Frecuencia de sincronización (expresión cron)
SYNC_CRON=0 */6 * * *

# Token de administración para POST /api/admin/sync
ADMIN_TOKEN=cambiar_en_produccion

# URLs de datasets CKAN (se obtienen automáticamente via CKAN API)
CKAN_BASE_URL=https://www.datosabiertos.gob.pe/api/3/action

# Habilitar capa climática (true/false)
ENABLE_WEATHER=true

# Modo (development|production)
NODE_ENV=development
```

---

## 10. Scripts del Monorepo

```json
// package.json raíz
{
  "scripts": {
    "setup": "npm install && npm run --prefix server setup && npm run --prefix client install",
    "dev": "concurrently \"npm run --prefix server dev\" \"npm run --prefix client dev\"",
    "sync": "npm run --prefix server sync",
    "test": "npm run --prefix server test && npm run --prefix client test",
    "build": "npm run --prefix client build && npm run --prefix server build"
  }
}
```

---

## 11. Decisiones Técnicas

| Decisión | Alternativa descartada | Razón |
|----------|------------------------|-------|
| react-leaflet | d3-geo | Ecosistema más maduro, plugins GeoJSON nativos |
| Recharts | Chart.js | Mejor integración con React, accesibilidad mejorada |
| Zustand | Redux | Menor boilerplate para estado global sencillo |
| better-sqlite3 | PostgreSQL | Sin instalación extra, funciona en Windows |
| PapaParse streaming | csv-parse | Maneja archivos >100 MB sin OOM |
| Vite proxy | CORS server | Evita problemas CORS en desarrollo |

---

## 12. Consideraciones de Seguridad

- **Helmet**: cabeceras HTTP seguras.
- **Rate limiting**: 100 req/min por IP en endpoints públicos; 10 req/min en `/admin/sync`.
- **Zod**: validación de todos los query params de la API.
- **Sanitización**: los nombres de departamento y enfermedad se validan contra listas blancas antes de usarse en queries SQLite.
- **Sin datos personales**: solo datos agregados por departamento/semana.
- **ADMIN_TOKEN**: requerido en header `Authorization: Bearer <token>` para endpoint de sync manual.
