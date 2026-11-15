/**
 * Cálculo de semana epidemiológica en el frontend.
 */
export function getCurrentEpiWeek(): { week: number; year: number } {
  return getEpiWeek(new Date());
}

export function getEpiWeek(date: Date): { week: number; year: number } {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = d.getDay(); // 0=dom

  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - dayOfWeek);

  const year = weekStart.getFullYear();
  const se1Start = getSE1Start(year);

  if (weekStart < se1Start) {
    const prevYear = year - 1;
    const se1StartPrev = getSE1Start(prevYear);
    const diffMs = weekStart.getTime() - se1StartPrev.getTime();
    const week = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
    return { week, year: prevYear };
  }

  const diffMs = weekStart.getTime() - se1Start.getTime();
  const week = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;

  return { week, year };
}

function getSE1Start(year: number): Date {
  const jan1 = new Date(year, 0, 1);
  const jan1DayOfWeek = jan1.getDay();

  let daysToFirstWed: number;
  if (jan1DayOfWeek <= 3) {
    daysToFirstWed = 3 - jan1DayOfWeek;
  } else {
    daysToFirstWed = 10 - jan1DayOfWeek;
  }

  const firstWed = new Date(year, 0, 1 + daysToFirstWed);
  const se1Start = new Date(firstWed);
  se1Start.setDate(firstWed.getDate() - 3);
  return se1Start;
}

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export function formatPeriod(year: number, month: number): string {
  return `${MONTHS_ES[month - 1]} ${year}`;
}
