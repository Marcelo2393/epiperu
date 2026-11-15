# 🇵🇪 EpiPerú – Vigilancia Epidemiológica por Departamento

Aplicación web de vigilancia epidemiológica que muestra, en un mapa interactivo del Perú dividido en sus 25 circunscripciones (24 departamentos + Callao), el estado sanitario de cada región para un período dado. Los datos provienen de los datasets abiertos del MINSA/CDC Perú publicados en [datosabiertos.gob.pe](https://www.datosabiertos.gob.pe), con datos de demostración como respaldo cuando las fuentes no estén disponibles.

## ⚠️ Aviso Importante

> Información con fines informativos basada en datos abiertos del MINSA/CDC Perú. No sustituye el diagnóstico médico ni los comunicados oficiales. Ante síntomas acude a tu establecimiento de salud o llama a **INFOSALUD 113**.

---

## 📋 Requisitos

- **Node.js 20+** (verificar con `node --version`)
- **npm 10+** (verificar con `npm --version`)
- Conexión a internet (para sincronizar datos reales y cargar tiles del mapa)

No se requiere Docker, PostgreSQL ni ninguna instalación extra.

---

## 🚀 Instalación y Ejecución

### 1. Configuración inicial

```bash
# Clonar o descargar el proyecto, luego:
cd EpiPeru

# Instalar dependencias + crear BD SQLite + cargar datos semilla
npm run setup
```

Esto hace lo siguiente:
1. Instala las dependencias del monorepo (raíz, cliente y servidor).
2. Crea la base de datos SQLite en `server/data/epiperu.db`.
3. Carga el esquema de tablas.
4. Inserta los datos semilla (25 departamentos, 10 enfermedades, 7 años de datos demo).
5. Ejecuta una primera sincronización con las fuentes reales (si falla, continúa con la semilla).

### 2. Levantar el entorno de desarrollo

```bash
npm run dev
```

Esto levanta simultáneamente:
- **Frontend (Vite):** http://localhost:5173
- **Backend (Express):** http://localhost:3000
- **Socket.IO:** ws://localhost:3000

Abre http://localhost:5173 en tu navegador para ver la aplicación.

### 3. Forzar sincronización de datos

```bash
npm run sync
```

Descarga los datos más recientes de los datasets del MINSA/CDC Perú y los guarda en la base de datos.

### 4. Ejecutar tests

```bash
npm run test
```

Ejecuta los tests unitarios (Vitest) y de integración (supertest).

---

## 📱 Probar desde el celular (misma red WiFi)

1. Levanta el servidor con `npm run dev`.
2. En tu computadora, averigua tu IP local:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # o
   ipconfig getifaddr en0
   ```
3. En el archivo `client/vite.config.ts`, agrega `host: true` al bloque `server`:
   ```ts
   server: {
     host: true,  // ← permite conexiones desde la red local
     port: 5173,
     proxy: { ... }
   }
   ```
4. En tu celular, abre `http://<IP-DE-TU-PC>:5173` en el navegador.

---

## 🗂️ Estructura del Proyecto

```
EpiPeru/
├── package.json              # Raíz: scripts setup, dev, sync, test, build
├── .env.example              # Variables de entorno (copiar a .env)
├── README.md
├── client/                   # Frontend React + Vite + TypeScript
│   ├── public/
│   │   ├── data/peru-departamentos.geojson
│   │   ├── manifest.json      # PWA
│   │   └── sw.js              # Service Worker
│   └── src/
│       ├── App.tsx           # Componente principal
│       ├── components/       # Mapa, Panel, Controles, Rankings, etc.
│       ├── hooks/            # useMapData, useSocket, useDarkMode
│       ├── services/api.ts   # Cliente HTTP
│       ├── store/            # Estado global (Zustand)
│       └── utils/            # Niveles de alerta, SE
└── server/                   # Backend Node + Express + TypeScript
    ├── src/
    │   ├── index.ts          # Servidor Express + Socket.IO + cron
    │   ├── db/               # Esquema SQLite + datos semilla
    │   ├── routes/           # API REST
    │   ├── services/         # Sincronización, canal endémico, tasas
    │   └── utils/            # Semana epidemiológica
    ├── data/
    │   ├── epiperu.db        # Base SQLite (auto-generada)
    │   └── imports/          # CSV manuales para importar
    └── tests/                # Vitest + supertest
```

---

## 🔌 API REST

Base URL: `http://localhost:3000/api`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/departments` | Lista de 25 departamentos |
| GET | `/departments/:ubigeo/summary?year=&month=` | Resumen epidemiológico de un departamento |
| GET | `/diseases` | Catálogo de enfermedades |
| GET | `/map?year=&month=&disease=` | Datos del mapa coropleta |
| GET | `/trends?ubigeo=&disease=&periods=12` | Serie temporal de casos |
| GET | `/rankings?year=&month=` | Top 5 departamentos y enfermedades |
| GET | `/alerts?year=&month=` | Departamentos en alerta o brote |
| GET | `/meta/freshness` | Frescura de datos por fuente |
| GET | `/meta/endemic-channel?ubigeo=&disease=` | Canal endémico histórico |
| GET | `/meta/weather?ubigeo=&year=&month=` | Temperatura y precipitación (Open-Meteo) |
| POST | `/admin/sync` | Forzar sincronización (requiere token) |

### Eventos Socket.IO

| Evento | Descripción |
|--------|-------------|
| `data:updated` | Notificación cuando hay datos nuevos |
| `alert:new` | Nueva alerta epidemiológica detectada |
| `sync:status` | Estado de la sincronización |

---

## 📊 Datos: Reales vs. Demostración

### Datos oficiales (origen: `official`)

Provenientes de [datosabiertos.gob.pe](https://www.datosabiertos.gob.pe) (CKAN API):

| Dataset | Período | Frecuencia |
|---------|---------|------------|
| Vigilancia Dengue | 2000–2025 | Semanal |
| Vigilancia EDA | 2000–2025 | Semanal |
| Vigilancia IRA | 2000–2025 | Semanal |
| Vigilancia Zoonosis | 2000–2025 | Semanal |

Insignia en la UI: 🔵 **Datos oficiales**

### Datos de demostración (origen: `demo`)

Datos semilla generados con patrones epidemiológicos realistas:
- 25 departamentos con población INEI 2024.
- 10 enfermedades: dengue, malaria, chikungunya, IRA, EDA, leptospirosis, bartonelosis, TBC, influenza, COVID-19.
- Serie 2020–2026 con estacionalidad (dengue en verano, IRA en invierno andino).
- Patrones por región: dengue alto en selva, IRA alto en sierra, TBC alto en Lima.

Insignia en la UI: 🟡 **Datos de demostración**

---

## 📈 Canal Endémico — Metodología

El canal endémico clasifica el nivel de alerta de cada enfermedad/departamento comparando los casos actuales con el historial de los últimos 5 años del mismo período (mes o semana):

1. Se obtienen los casos del mismo mes de los últimos 5 años disponibles.
2. Se calculan los percentiles 25 (Q1) y 75 (Q3), y la media geométrica.
3. Clasificación:
   - **Éxito (verde):** casos < Q1
   - **Seguridad (amarillo):** Q1 ≤ casos < media geométrica
   - **Alerta (naranja):** media geométrica ≤ casos < Q3
   - **Brote (rojo):** casos ≥ Q3
4. Se requieren al menos 3 años de datos históricos.

La media geométrica se usa por ser más robusta que la aritmética para datos de conteo epidemiológico (puede manejar ceros y valores atípicos).

---

## ➕ Cómo Agregar una Nueva Enfermedad

1. Editar `server/src/db/seed.ts`:
   - Agregar un objeto al array `DISEASES` con código, nombre, categoría, descripción, prevención y URL de fuente.
   - Agregar la enfermedad al mapa de factores en `BASE_RATES` y `SEASONAL`.
2. Si la enfermedad tiene un dataset en datosabiertos.gob.pe:
   - Agregar el ID del dataset a `DATA_SOURCES` en `seed.ts`.
   - Agregar un caso en el `switch` de `csvImporter.ts` con la lógica de parseo.
   - Agregar la entrada al array `DATASETS` en `syncService.ts`.
3. Si tiene variantes de nombre en los CSV del MINSA, agregarlas al `DISEASE_MAP` en `normalizer.ts`.
4. Reiniciar el servidor.

---

## 📥 Cómo Importar un CSV Manualmente

1. Coloca el archivo CSV en `server/data/imports/`.
2. Nombra el archivo de forma que el sistema detecte el tipo:
   - `dengue_*.csv` → datos de dengue
   - `eda_*.csv` → datos de EDA
   - `ira_*.csv` → datos de IRA
   - `zoonosis_*.csv` → datos de zoonosis
3. Ejecuta `npm run sync` para procesarlo.
4. El archivo se moverá a `server/data/imports/processed/` tras la importación.

El CSV debe tener al menos estas columnas:
- `departamento` (nombre del departamento)
- `ano` (año, 4 dígitos)
- `semana` (semana epidemiológica, 1–53)
- `ubigeo` (código INEI de 6 dígitos, opcional)
- `enfermedad` (nombre de la enfermedad, para datasets multienfermedad)

---

## ⚙️ Configuración (.env)

Copia `.env.example` a `.env` y ajusta los valores:

```env
PORT=3000                    # Puerto del backend
SYNC_CRON=0 */6 * * *         # Cron: cada 6 horas
ADMIN_TOKEN=tu_token_aqui    # Token para POST /api/admin/sync
CKAN_BASE_URL=https://www.datosabiertos.gob.pe/api/3/action
ENABLE_WEATHER=true           # Capa climática Open-Meteo
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

---

## 🐛 Solución de Problemas

### El mapa no carga
- Verifica que el archivo `client/public/data/peru-departamentos.geojson` existe.
- Abre la consola del navegador (F12) para ver errores.
- Asegúrate de que el frontend está en http://localhost:5173.

### Error de conexión con el backend
- Verifica que el servidor esté corriendo en http://localhost:3000.
- Comprueba con `curl http://localhost:3000/api/health`.
- Revisa los logs del servidor en la terminal.

### La sincronización falla
- Esto es normal si no hay conexión a internet o el portal de datos está caído.
- La aplicación continúa funcionando con los datos de demostración.
- Revisa el estado de las fuentes en http://localhost:3000/api/meta/freshness.

### La base de datos no se crea
- Elimina `server/data/epiperu.db` y ejecuta `npm run setup` de nuevo.
- Verifica permisos de escritura en `server/data/`.

### El puerto 3000 o 5173 está ocupado
- Cambia `PORT` en `.env` para el backend.
- Cambia `port` en `client/vite.config.ts` para el frontend.

### Error de módulos nativos (better-sqlite3)
- En macOS: `npm rebuild better-sqlite3` dentro de `server/`.
- En Windows: asegúrate de tener Visual Studio Build Tools instalado.

---

## 🧪 Tests

```bash
# Todos los tests
npm run test

# Solo backend
npm run --prefix server test

# Solo frontend
npm run --prefix client test
```

Tests cubiertos:
- **Semana epidemiológica** (CDC Perú, calendario domingo-sábado)
- **Canal endémico** (media geométrica, percentiles, clasificación)
- **Tasas por 100 000 habitantes** (incidencia y variación interanual)
- **Normalización de nombres** (25 departamentos, 10 enfermedades)
- **Endpoints de la API** (supertest: departments, diseases, map, rankings, alerts, freshness)

---

## 🛡️ Seguridad

- **Helmet:** cabeceras HTTP seguras.
- **Rate limiting:** 200 req/min en endpoints públicos, 10 req/min en admin.
- **Zod:** validación de todos los query params.
- **ADMIN_TOKEN:** requerido para `POST /api/admin/sync`.
- **Sin datos personales:** solo datos agregados por departamento/semana.

---

## 📚 Fuentes de Datos

- [Datos Abiertos del Perú](https://www.datosabiertos.gob.pe) – Datasets del MINSA/CDC Perú (licencia ODC-By)
- [CDC Perú / DGE](https://www.dge.gob.pe/portalnuevo/) – Sala de Situación de Salud
- [Open-Meteo](https://open-meteo.com) – Datos climáticos (sin API key)
- [INEI](https://www.inei.gob.pe) – Proyecciones poblacionales
- [juaneladio/peru-geojson](https://github.com/juaneladio/peru-geojson) – GeoJSON de departamentos

---

## 📄 Licencia

Datos: Open Data Commons Attribution License (ODC-By) — datosabiertos.gob.pe
Código: MIT
