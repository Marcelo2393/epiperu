# EpiPerú – Requisitos del Sistema
## Vigilancia Epidemiológica por Departamento

**Versión:** 1.0  
**Fecha:** 2026-10-31  
**Equipo:** Full-stack + Salud Pública  

---

## Contexto del Proyecto

EpiPerú es una aplicación web de vigilancia epidemiológica que muestra, en un mapa interactivo del Perú dividido en sus 25 circunscripciones (24 departamentos + Provincia Constitucional del Callao), el estado sanitario de cada región para un período dado. Los datos provienen de los datasets abiertos del MINSA/CDC Perú publicados en datosabiertos.gob.pe, con datos de demostración como respaldo cuando las fuentes no estén disponibles.

---

## Historias de Usuario (formato EARS)

### ÉPICA 1: Visualización del Mapa Epidemiológico

**HU-01** – Mapa coropleta por nivel de alerta  
*CUANDO* el usuario accede a la aplicación,  
*EL SISTEMA DEBE* mostrar un mapa interactivo del Perú con los 25 departamentos/Callao coloreados según el nivel de alerta global (verde, amarillo, naranja, rojo) para el mes y año actualmente seleccionados.  
*CRITERIOS DE ACEPTACIÓN:*  
- Los 25 polígonos del GeoJSON se renderizan correctamente.  
- El color refleja el nivel de alerta más alto de cualquier enfermedad en ese departamento.  
- La carga inicial no supera 3 s en una conexión de 10 Mbps.  
- El mapa es accesible (ARIA, no depende solo del color: añade textura/patrón).

**HU-02** – Tooltip al pasar el mouse  
*CUANDO* el usuario pasa el cursor sobre un departamento del mapa,  
*EL SISTEMA DEBE* mostrar un tooltip con: nombre del departamento, enfermedad principal, número de casos del mes y nivel de alerta.

**HU-03** – Selector de período  
*MIENTRAS* el usuario esté en la aplicación,  
*EL SISTEMA DEBE* mostrar un selector siempre visible de Año y Mes (y semana epidemiológica opcional). El valor por defecto es el mes y año actuales.  
*CRITERIOS:*  
- Rango de años: 2010–año actual.  
- Al cambiar el período, el mapa y todos los paneles se actualizan sin recargar la página.

**HU-04** – Filtro por enfermedad  
*CUANDO* el usuario selecciona una enfermedad específica en el filtro,  
*EL SISTEMA DEBE* re-colorear el mapa usando solo los datos de esa enfermedad (casos o tasa por 100 000 hab.).  
*CRITERIOS:*  
- La opción "Todas" muestra el nivel de alerta global.  
- El filtro persiste al navegar entre departamentos.

### ÉPICA 2: Panel de Detalle por Departamento

**HU-05** – Panel de detalle al hacer clic  
*CUANDO* el usuario hace clic en un departamento,  
*EL SISTEMA DEBE* abrir un panel lateral (escritorio) o panel inferior deslizable (móvil) con:  
- Nombre y población aproximada del departamento.  
- Semana epidemiológica actual.  
- Lista de enfermedades activas ordenadas por casos descendente.  
- Por cada enfermedad: casos del mes, acumulado del año, tasa por 100 000 hab., variación % vs mismo mes del año anterior, y nivel de alerta.  
- Enfermedad predominante destacada con icono y color.

**HU-06** – Gráfico de tendencia  
*CUANDO* el usuario visualiza el panel de detalle,  
*EL SISTEMA DEBE* mostrar un gráfico de línea con la evolución de la(s) enfermedad(es) en las últimas 12 semanas epidemiológicas o 12 meses.  
*CRITERIOS:*  
- El gráfico incluye etiquetas de ejes y leyenda.  
- Es accesible (descripción alternativa de los datos).

**HU-07** – Recomendaciones de prevención  
*CUANDO* el usuario visualiza el panel de detalle,  
*EL SISTEMA DEBE* mostrar, por cada enfermedad activa, un texto educativo breve con al menos una medida de prevención y un enlace a la fuente oficial (CDC Perú o MINSA).

**HU-08** – Canal endémico  
*CUANDO* el usuario visualiza la tendencia de una enfermedad en un departamento,  
*EL SISTEMA DEBE* superponer las bandas del canal endémico (éxito / seguridad / alerta / brote) calculadas a partir de los percentiles de los mismos períodos de los 5 años históricos disponibles.  
*CRITERIOS:*  
- Un ícono "¿Cómo se calcula?" explica la metodología.  
- Solo se muestra si hay al menos 3 años de datos históricos.

### ÉPICA 3: Búsqueda y Filtros

**HU-09** – Buscador de departamento y enfermedad  
*CUANDO* el usuario escribe en el buscador,  
*EL SISTEMA DEBE* filtrar la lista de departamentos o enfermedades y resaltar la coincidencia en el mapa o en la lista.

**HU-10** – Ranking nacional  
*CUANDO* el usuario accede a la sección de ranking,  
*EL SISTEMA DEBE* mostrar el top 5 de departamentos con mayor incidencia y el top 5 de enfermedades a nivel nacional para el período seleccionado.

**HU-11** – Comparador de departamentos  
*CUANDO* el usuario selecciona 2 o 3 departamentos para comparar,  
*EL SISTEMA DEBE* mostrar un gráfico comparativo con sus enfermedades en el mismo eje temporal.

**HU-12** – Línea de tiempo animada  
*CUANDO* el usuario pulsa el botón "Reproducir",  
*EL SISTEMA DEBE* recorrer los meses del año seleccionado mostrando cómo cambia el mapa, con pausa/avance/retroceso.

### ÉPICA 4: Actualización de Datos y Tiempo Casi Real

**HU-13** – Proceso automático de sincronización  
*EL SISTEMA DEBE* ejecutar automáticamente cada 6 horas un proceso de sincronización que:  
1. Consulta los datasets del MINSA/CDC Perú (CKAN API de datosabiertos.gob.pe).  
2. Descarga, normaliza y persiste los datos en SQLite.  
3. Notifica a los clientes conectados vía WebSocket.  
4. Si la fuente no está disponible, continúa operando con los datos existentes sin error visible.

**HU-14** – Indicador de frescura de datos  
*MIENTRAS* el usuario usa la aplicación,  
*EL SISTEMA DEBE* mostrar siempre:  
- Fecha y hora de la última actualización.  
- Semana epidemiológica actual.  
- Estado de la fuente: "Al día", "Retrasada" o "Fuera de línea".

**HU-15** – Notificación de datos nuevos (WebSocket)  
*CUANDO* el backend detecta datos nuevos tras una sincronización,  
*EL SISTEMA DEBE* enviar un evento Socket.IO que:  
- Muestra un aviso no intrusivo "Hay datos nuevos disponibles".  
- Permite al usuario actualizar el mapa sin recargar la página.

**HU-16** – Insignia de origen de datos  
*CUANDO* la aplicación muestra datos,  
*EL SISTEMA DEBE* indicar claramente si cada registro es "Datos oficiales" (origen: official) o "Datos de demostración" (origen: demo), con una insignia visible.

### ÉPICA 5: Capa Climática

**HU-17** – Temperatura y precipitación por departamento  
*CUANDO* el usuario activa la capa climática,  
*EL SISTEMA DEBE* consultar Open-Meteo (sin API key) para obtener temperatura media y precipitación del mes seleccionado para la capital de cada departamento, y mostrar estos datos en el panel de detalle junto a las enfermedades vectoriales.

### ÉPICA 6: Alertas y Exportación

**HU-18** – Sección de alertas activas  
*EL SISTEMA DEBE* mostrar una sección con los departamentos en nivel "alerta" o "brote", ordenados por criticidad, con enlace a la fuente oficial del CDC Perú.

**HU-19** – Exportación de datos  
*CUANDO* el usuario solicita exportar,  
*EL SISTEMA DEBE* permitir:  
- Descargar los datos filtrados en formato CSV.  
- Descargar el mapa como imagen PNG.

### ÉPICA 7: UX, Accesibilidad y PWA

**HU-20** – Modo oscuro  
*CUANDO* el usuario activa el modo oscuro o el sistema operativo lo prefiere,  
*EL SISTEMA DEBE* aplicar un tema oscuro coherente en toda la interfaz.

**HU-21** – Diseño responsive  
*EL SISTEMA DEBE* funcionar correctamente en dispositivos móviles (≥320 px), tabletas y escritorio. El mapa ocupa el espacio principal; el panel de detalle es una hoja inferior deslizable en móvil.

**HU-22** – PWA básica  
*EL SISTEMA DEBE* incluir un Web App Manifest y un Service Worker básico para permitir instalación en pantalla de inicio y funcionamiento offline con los últimos datos cargados.

**HU-23** – Accesibilidad (WCAG 2.1 AA)  
*EL SISTEMA DEBE* cumplir:  
- Contraste de color ≥ 4.5:1.  
- Navegación completa por teclado.  
- Etiquetas ARIA en mapa, gráficos y paneles.  
- No depender únicamente del color para transmitir información (usar íconos o patrones).

**HU-24** – Geolocalización sugerida  
*CUANDO* el usuario da permiso de geolocalización,  
*EL SISTEMA DEBE* detectar su departamento aproximado y seleccionarlo automáticamente en el mapa.

**HU-25** – Aviso ético permanente  
*MIENTRAS* el usuario usa la aplicación,  
*EL SISTEMA DEBE* mostrar en un lugar visible el aviso:  
*"Información con fines informativos basada en datos abiertos del MINSA/CDC Perú. No sustituye el diagnóstico médico ni los comunicados oficiales. Ante síntomas acude a tu establecimiento de salud o llama a INFOSALUD 113."*

### ÉPICA 8: Administración y Operaciones

**HU-26** – Comando npm run setup  
*CUANDO* el desarrollador ejecuta `npm run setup`,  
*EL SISTEMA DEBE* instalar dependencias, crear la base SQLite, cargar el GeoJSON y los datos semilla, y ejecutar una primera sincronización (sin fallar si la fuente no está disponible).

**HU-27** – Comando npm run sync  
*CUANDO* el desarrollador ejecuta `npm run sync`,  
*EL SISTEMA DEBE* forzar una sincronización inmediata con las fuentes reales y registrar el resultado.

**HU-28** – Importación manual de CSV  
*CUANDO* el administrador coloca un archivo CSV en `/server/data/imports/`,  
*EL SISTEMA DEBE* procesarlo en la siguiente sincronización o manualmente con un comando, normalizando departamentos y enfermedades.

---

## Reglas de Negocio

**RN-01 – Niveles de alerta**  
Calculados por comparación con el canal endémico del mismo departamento/enfermedad:
- **Verde (éxito):** casos < percentil 25 histórico.  
- **Amarillo (seguridad):** casos entre p25 y media geométrica.  
- **Naranja (alerta):** casos entre media geométrica y p75.  
- **Rojo (brote/epidemia):** casos > p75 histórico.  
Sin datos históricos suficientes (< 3 años): nivel por defecto "sin datos" (gris).

**RN-02 – Semana epidemiológica**  
Calendario del CDC Perú: semana de domingo a sábado. La SE 1 es la semana que contiene el primer miércoles de enero (ISO similar al estándar CDC). Máximo 52 o 53 semanas por año.

**RN-03 – Tasa de incidencia**  
`tasa = (casos / población) × 100_000`, usando la población proyectada del INEI por departamento para el año correspondiente.

**RN-04 – Variación porcentual interanual**  
`variacion = ((casos_año_actual - casos_año_anterior) / casos_año_anterior) × 100`. Si `casos_año_anterior = 0`, mostrar "N/D".

**RN-05 – Origen de datos**  
Toda fila en la tabla `cases` tiene campo `origen` con valor `'official'` o `'demo'`. La UI muestra la insignia según el origen de los datos visualizados.

**RN-06 – Normalización de nombres**  
Los nombres de departamentos del MINSA usan variantes (e.g., "LIMA REGION", "LIMA METROPOLITANA", "LA LIBERTAD"). El sistema tiene una tabla de sinónimos canónica mapeada a los 25 ubigeos de departamento.

---

## Restricciones

- No se muestran datos de pacientes individuales, solo datos agregados.  
- No se presentan estimaciones como datos oficiales.  
- Todas las fuentes, fechas y origen (oficial/demo) se muestran siempre.  
- La aplicación funciona en Windows, macOS y Linux con Node.js 20+, sin Docker.  
- Sin APIs de pago ni con API key obligatoria.
