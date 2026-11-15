/**
 * Cálculo de Semana Epidemiológica (SE) según el calendario CDC/MMWR.
 *
 * Reglas:
 * - La semana va de domingo a sábado.
 * - La SE 1 del año es la semana que contiene el primer miércoles de enero
 *   (equivalente al estándar ISO que usa el primer jueves, adaptado al CDC).
 * - Puede haber 52 o 53 semanas por año.
 *
 * Referencia: https://www.cdc.gov/nndss/document/MMWR_Week_overview.pdf
 */

/**
 * Calcula la Semana Epidemiológica para una fecha dada.
 * @param date - La fecha a evaluar
 * @returns Objeto con { week, year } donde year puede ser diferente al
 *          año calendario en las semanas límite de diciembre/enero.
 */
export function getEpiWeek(date: Date): { week: number; year: number } {
  // Fecha sin horas (UTC midnight)
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  // Número de día de la semana (0=domingo, 6=sábado)
  const dayOfWeek = d.getUTCDay();

  // Inicio de la semana epidemiológica que contiene esta fecha (domingo)
  const weekStart = new Date(d);
  weekStart.setUTCDate(d.getUTCDate() - dayOfWeek);

  // Inicio de la semana epidemiológica de la SE1 para el año del inicio de semana
  const year = weekStart.getUTCFullYear();
  const se1Start = getSE1Start(year);

  // Si la semana empieza antes de la SE1 del año, pertenece al año anterior
  if (weekStart < se1Start) {
    const prevYear = year - 1;
    const se1StartPrev = getSE1Start(prevYear);
    const diffMs = weekStart.getTime() - se1StartPrev.getTime();
    const week = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
    return { week, year: prevYear };
  }

  // Calcular el número de semana dentro del año
  const diffMs = weekStart.getTime() - se1Start.getTime();
  const week = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;

  // Si la semana calculada es > 52, verificar si pertenece al año siguiente
  if (week > 52) {
    const nextYear = year + 1;
    const se1StartNext = getSE1Start(nextYear);
    if (weekStart >= se1StartNext) {
      return { week: 1, year: nextYear };
    }
  }

  return { week, year };
}

/**
 * Obtiene el domingo de inicio de la SE1 para un año dado.
 * La SE1 es la semana que contiene el primer miércoles de enero.
 */
export function getSE1Start(year: number): Date {
  // Encontrar el primer miércoles de enero
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const jan1DayOfWeek = jan1.getUTCDay(); // 0=dom, 3=mié

  let daysToFirstWed: number;
  if (jan1DayOfWeek <= 3) {
    // Si jan 1 es dom-mié, el primer miércoles está en la primera semana
    daysToFirstWed = 3 - jan1DayOfWeek;
  } else {
    // Si jan 1 es jue-sáb, el primer miércoles es la siguiente semana
    daysToFirstWed = 10 - jan1DayOfWeek;
  }

  const firstWed = new Date(Date.UTC(year, 0, 1 + daysToFirstWed));

  // El domingo de esa semana (inicio de SE1)
  const se1Start = new Date(firstWed);
  se1Start.setUTCDate(firstWed.getUTCDate() - 3); // Miércoles - 3 días = domingo

  return se1Start;
}

/**
 * Retorna el número de semanas epidemiológicas en un año dado (52 o 53).
 */
export function getTotalEpiWeeks(year: number): number {
  const se1NextYear = getSE1Start(year + 1);
  const se1ThisYear = getSE1Start(year);
  const diffMs = se1NextYear.getTime() - se1ThisYear.getTime();
  return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Retorna la fecha de inicio (domingo) de una SE dada.
 */
export function getEpiWeekStart(year: number, week: number): Date {
  const se1 = getSE1Start(year);
  const start = new Date(se1);
  start.setUTCDate(se1.getUTCDate() + (week - 1) * 7);
  return start;
}

/**
 * Retorna la fecha de fin (sábado) de una SE dada.
 */
export function getEpiWeekEnd(year: number, week: number): Date {
  const start = getEpiWeekStart(year, week);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return end;
}

/**
 * Retorna la SE actual (usando la fecha de hoy).
 */
export function getCurrentEpiWeek(): { week: number; year: number } {
  return getEpiWeek(new Date());
}

/**
 * Convierte mes/año a un rango de semanas epidemiológicas.
 * Útil para agregar datos semanales en nivel mensual.
 */
export function monthToEpiWeeks(year: number, month: number): number[] {
  const weeks: Set<number> = new Set();
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const { week, year: epiYear } = getEpiWeek(date);
    if (epiYear === year) {
      weeks.add(week);
    }
  }

  return Array.from(weeks).sort((a, b) => a - b);
}
