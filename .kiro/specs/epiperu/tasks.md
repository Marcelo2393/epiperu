# EpiPerú – Plan de Implementación

**Versión:** 1.0  
**Fecha:** 2026-10-31  

---

## Fase 0: Infraestructura Base del Monorepo

- [ ] **T-00** Crear estructura de carpetas del monorepo (`/client`, `/server`, `/server/data/imports`)
- [ ] **T-01** Configurar `package.json` raíz con scripts `setup`, `dev`, `sync`, `test`, `build` usando `concurrently`
- [ ] **T-02** Crear `.env.example` comentado con todas las variables de entorno
- [ ] **T-03** Configurar `.gitignore` (node_modules, *.db, .env, dist)

---

## Fase 1: Backend – Base de Datos y Modelo

- [ ] **T-10** Configurar proyecto Node.js + Express + TypeScript en `/server` con `tsconfig.json` estricto
- [ ] **T-11** Instalar dependencias del servidor: `express`, `better-sqlite3`, `socket.io`, `node-cron`, `zod`, `papaparse`, `axios`, `helmet`, `cors`, `express-rate-limit`, `concurrently` (dev)
- [ ] **T-12** Crear esquema SQLite en `/server/src/db/schema.ts` (tablas: departments, diseases, cases, data_sources, sync_log)
- [ ] **T-13** Crear cliente SQLite singleton en `/server/src/db/client.ts`
- [ ] **T-14** Crear datos semilla en `/server/src/db/seed.ts`:
  - 25 departamentos con ubigeo, nombre, población (INEI 2024), lat/lon capital
  - 10 enfermedades con descripción, prevención y enlace oficial
  - Registros de cases demo: 2020–2026, 12 meses, 25 departamentos, 10 enfermedades (con valores realistas por región)
- [ ] **T-15** Implementar script de setup del servidor: crear DB, ejecutar DDL, cargar semilla

---

## Fase 2: Backend – Utilidades y Servicios Lógicos

- [ ] **T-20** Implementar cálculo de semana epidemiológica en `/server/src/utils/epidemicWeek.ts` (calendario CDC, domingo-sábado, SE1 = primera semana con miércoles de enero)
- [ ] **T-21** Tests unitarios para semana epidemiológica con Vitest (`/server/tests/epidemicWeek.test.ts`): al menos 10 casos borde
- [ ] **T-22** Implementar normalizador de nombres en `/server/src/services/normalizer.ts` con la tabla de sinónimos de 25 departamentos y enfermedades
- [ ] **T-23** Tests unitarios del normalizador (`/server/tests/normalizer.test.ts`)
- [ ] **T-24** Implementar calculadora de tasas por 100 000 hab. en `/server/src/services/rateCalculator.ts`
- [ ] **T-25** Tests unitarios de tasas (`/server/tests/rateCalculator.test.ts`)
- [ ] **T-26** Implementar servicio de canal endémico en `/server/src/services/endemicChannel.ts` (media geométrica, Q1, Q3, clasificación de nivel)
- [ ] **T-27** Tests unitarios del canal endémico (`/server/tests/endemicChannel.test.ts`)

---

## Fase 3: Backend – Sincronización con Fuentes Reales

- [ ] **T-30** Implementar cliente CKAN en `/server/src/services/ckanClient.ts`: obtener URL del CSV via `package_show`, verificar `Last-Modified`, descargar en streaming
- [ ] **T-31** Implementar importador CSV en `/server/src/services/csvImporter.ts`: parseo PapaParse en modo `step` (streaming), normalización, agregación por (ubigeo, enfermedad, año, mes), upsert en tabla `cases`
- [ ] **T-32** Implementar servicio de sincronización en `/server/src/services/syncService.ts`: orquesta los 4 datasets confirmados (dengue, EDA, IRA, zoonosis), actualiza `data_sources`, escribe en `sync_log`, emite evento `data:updated` via Socket.IO
- [ ] **T-33** Configurar cron job en el servidor (cada 6 horas) que llama a `syncService`
- [ ] **T-34** Implementar importador de CSV manuales desde `/server/data/imports/` con detección automática del tipo de enfermedad por nombre de archivo

---

## Fase 4: Backend – API REST

- [ ] **T-40** Crear servidor Express principal en `/server/src/index.ts` con middleware: helmet, cors, rate-limit, json parser, Socket.IO
- [ ] **T-41** Implementar `GET /api/departments` – lista de 25 departamentos
- [ ] **T-42** Implementar `GET /api/departments/:ubigeo/summary` – resumen epidemiológico (casos por enfermedad, nivel de alerta, tasa, variación interanual) con validación Zod
- [ ] **T-43** Implementar `GET /api/diseases` – catálogo de enfermedades
- [ ] **T-44** Implementar `GET /api/map` – datos para el mapa coropleta (un registro por departamento con nivel de alerta y casos totales) para el período dado y opcionalmente filtrado por enfermedad
- [ ] **T-45** Implementar `GET /api/trends` – serie temporal de las últimas N semanas/meses para (ubigeo, enfermedad)
- [ ] **T-46** Implementar `GET /api/rankings` – top 5 departamentos y top 5 enfermedades del período
- [ ] **T-47** Implementar `GET /api/alerts` – departamentos en nivel naranja o rojo del período
- [ ] **T-48** Implementar `GET /api/meta/freshness` – estado de cada fuente de datos
- [ ] **T-49** Implementar `GET /api/endemic-channel` – canal endémico histórico para (ubigeo, enfermedad)
- [ ] **T-50** Implementar `GET /api/weather` – temperatura y precipitación via Open-Meteo para (ubigeo, año, mes)
- [ ] **T-51** Implementar `POST /api/admin/sync` – fuerza sincronización, protegido por Bearer token
- [ ] **T-52** Tests de integración de endpoints con supertest (`/server/tests/api.test.ts`): al menos los 5 principales

---

## Fase 5: Frontend – Configuración

- [ ] **T-60** Configurar proyecto React + Vite + TypeScript en `/client` con Tailwind CSS
- [ ] **T-61** Instalar dependencias del cliente: `react-leaflet`, `leaflet`, `recharts`, `socket.io-client`, `zustand`, `axios`
- [ ] **T-62** Configurar proxy de Vite para `/api` → `http://localhost:3000` y `/socket.io` → `http://localhost:3000`
- [ ] **T-63** Crear tipos TypeScript compartidos en `/client/src/types/index.ts`
- [ ] **T-64** Implementar servicio API en `/client/src/services/api.ts` (todas las llamadas HTTP)
- [ ] **T-65** Configurar store Zustand en `/client/src/store/useAppStore.ts` (estado global: período seleccionado, departamento activo, filtro de enfermedad, modo oscuro, datos del mapa)

---

## Fase 6: Frontend – Mapa Interactivo

- [ ] **T-70** Incluir GeoJSON de departamentos en `/client/public/data/peru-departamentos.geojson` (fuente: joseluisq/peru-geojson-datasets, simplificado)
- [ ] **T-71** Implementar componente `PeruMap.tsx` con react-leaflet: cargar GeoJSON, renderizar 25 polígonos, fondo de mapa OpenStreetMap
- [ ] **T-72** Implementar `DepartmentLayer.tsx`: colorear cada polígono según nivel de alerta (verde/amarillo/naranja/rojo + patrón/textura para accesibilidad), tooltip al hover con nombre/enfermedad/casos
- [ ] **T-73** Implementar `MapLegend.tsx`: leyenda de colores con textos de apoyo (no solo color)
- [ ] **T-74** Implementar hook `useMapData.ts`: fetches `GET /api/map` reactivo al período y filtro seleccionados

---

## Fase 7: Frontend – Controles y Selectores

- [ ] **T-80** Implementar `PeriodSelector.tsx`: selector de año (2010–actual) y mes, más indicador de semana epidemiológica actual
- [ ] **T-81** Implementar `DiseaseFilter.tsx`: dropdown "Todas" + lista de enfermedades del catálogo
- [ ] **T-82** Implementar `SearchBar.tsx`: búsqueda de departamento y enfermedad con autocompletado
- [ ] **T-83** Implementar `TimelinePlayer.tsx`: botón reproducir/pausar que recorre los 12 meses del año con intervalo de 800 ms

---

## Fase 8: Frontend – Panel de Detalle

- [ ] **T-90** Implementar `DepartmentPanel.tsx`: contenedor del panel lateral (escritorio) o bottom sheet (móvil), con nombre del departamento, población, semana epidemiológica, insignia de origen de datos (oficial/demo)
- [ ] **T-91** Implementar `DiseaseList.tsx`: lista de enfermedades activas ordenadas por casos, con casos/mes, acumulado/año, tasa/100k, variación %, nivel de alerta (icono + color + texto), recomendaciones y enlace oficial; enfermedad predominante destacada arriba
- [ ] **T-92** Implementar `TrendChart.tsx` con Recharts: gráfico de línea de las últimas 12 semanas/meses, accesible (aria-label con resumen de datos)
- [ ] **T-93** Implementar `EndemicChannel.tsx`: superponer bandas del canal endémico en el gráfico de tendencia, con botón "¿Cómo se calcula?"
- [ ] **T-94** Implementar `ClimateLayer.tsx`: temperatura y precipitación Open-Meteo dentro del panel de detalle (activable/desactivable)
- [ ] **T-95** Implementar hook `useDepartmentDetail.ts`: fetches `summary`, `trends`, `endemic-channel`, `weather` para el departamento activo

---

## Fase 9: Frontend – Funcionalidades Avanzadas

- [ ] **T-100** Implementar `RankingPanel.tsx`: top 5 departamentos y top 5 enfermedades del período con barras de progreso
- [ ] **T-101** Implementar `AlertsPanel.tsx`: lista de departamentos en alerta/brote con enlace a fuente oficial
- [ ] **T-102** Implementar `DepartmentComparator.tsx`: selector de hasta 3 departamentos + gráfico Recharts comparativo
- [ ] **T-103** Implementar `FreshnessIndicator.tsx`: indicador "Última actualización + SE actual + estado de fuente" siempre visible en el header
- [ ] **T-104** Implementar hook `useSocket.ts`: conectar a Socket.IO, escuchar `data:updated` y `alert:new`, disparar Toast de notificación y recargar datos

---

## Fase 10: Frontend – UX, Accesibilidad y PWA

- [ ] **T-110** Implementar `useDarkMode.ts` y aplicar tema oscuro con Tailwind (clase `dark:`)
- [ ] **T-111** Aplicar diseño responsive mobile-first en todos los componentes; asegurar que el panel es bottom-sheet en < 768 px
- [ ] **T-112** Crear `manifest.json` con íconos, nombre, tema y `display: standalone`
- [ ] **T-113** Crear `sw.js` (Service Worker) con estrategia cache-first para assets y network-first para llamadas API
- [ ] **T-114** Auditoría de accesibilidad: añadir roles ARIA, etiquetas, patrones adicionales (no solo color), contraste ≥ 4.5:1, navegación por teclado
- [ ] **T-115** Implementar estados de carga (Skeleton), error, sin datos y sin conexión para todos los componentes asíncronos
- [ ] **T-116** Implementar función de geolocalización (opcional, con permiso del usuario)
- [ ] **T-117** Implementar exportación CSV y exportación PNG del mapa
- [ ] **T-118** Implementar aviso ético permanente en el footer (HU-25)

---

## Fase 11: Ensamblaje y Verificación Final

- [ ] **T-120** Integrar todos los componentes en `App.tsx` con layout final (header + mapa + panel lateral + bottom controls)
- [ ] **T-121** Verificar que `npm run setup` funciona desde cero (sin DB previa) en macOS/Linux/Windows
- [ ] **T-122** Verificar que `npm run dev` levanta ambos servidores y http://localhost:5173 muestra el mapa
- [ ] **T-123** Verificar que al seleccionar un departamento y mes aparecen sus enfermedades con datos
- [ ] **T-124** Verificar que `npm run sync` actualiza datos y emite el evento WebSocket
- [ ] **T-125** Ejecutar todos los tests (`npm run test`) y corregir fallos
- [ ] **T-126** Escribir `README.md` completo en español con: requisitos, pasos exactos de setup, cómo probar desde móvil en misma WiFi, cómo agregar enfermedad/fuente, cómo importar CSV manual, solución de problemas

---

## Criterios de Éxito

1. `npm run setup && npm run dev` funciona sin errores en macOS/Linux (Node 20+).
2. `http://localhost:5173` muestra el mapa del Perú con los 25 departamentos coloreados.
3. Al seleccionar cualquier departamento y mes, el panel muestra ≥ 5 enfermedades con datos.
4. `npm run sync` termina con `✓ Sincronización completada` y los clientes conectados reciben el evento WebSocket.
5. Los tests unitarios pasan (SE, canal endémico, tasas, normalización).
6. La aplicación es usable en móvil (Chrome Mobile, Safari iOS).
7. Cada dato muestra la insignia "Datos oficiales" o "Datos de demostración" según su origen.
