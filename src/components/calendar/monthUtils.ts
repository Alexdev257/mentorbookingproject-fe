/** Local calendar helpers (no UTC shift for day keys). */

export function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function isSameLocalDay(a: Date | string, b: Date | string): boolean {
  const da = typeof a === 'string' ? new Date(a) : a;
  const db = typeof b === 'string' ? new Date(b) : b;
  return toLocalYmd(da) === toLocalYmd(db);
}

/** 42 cells: Mon → Sun weeks, `inCurrentMonth` flags padding days. */
export function buildCalendarCells(anchorMonth: Date): { date: Date; inCurrentMonth: boolean }[] {
  const y = anchorMonth.getFullYear();
  const m = anchorMonth.getMonth();
  const first = new Date(y, m, 1);
  const dow = first.getDay();
  const mondayIndex = dow === 0 ? 6 : dow - 1;

  const start = new Date(y, m, 1 - mondayIndex);
  const cells: { date: Date; inCurrentMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ date: d, inCurrentMonth: d.getMonth() === m });
  }
  return cells;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

/** Inclusive grid range for MonthCalendar (42 cells): local start of first cell → end of last day. */
export function visibleGridUtcRange(anchorMonth: Date): { fromIso: string; toIso: string } {
  const cells = buildCalendarCells(startOfMonth(anchorMonth));
  const from = cells[0].date;
  const fromStart = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0);
  const last = cells[41].date;
  const toEnd = new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59, 999);
  return { fromIso: fromStart.toISOString(), toIso: toEnd.toISOString() };
}

/** True if this calendar day appears in the 6-week grid for `anchorMonth` (e.g. Feb when viewing March may be false). */
export function isDateInMonthGrid(d: Date, anchorMonth: Date): boolean {
  const key = toLocalYmd(d);
  for (const { date } of buildCalendarCells(startOfMonth(anchorMonth))) {
    if (toLocalYmd(date) === key) return true;
  }
  return false;
}
