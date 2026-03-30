import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, buildCalendarCells, startOfMonth, toLocalYmd } from './monthUtils';
import './MonthCalendar.css';

export type MonthCalMarker = { color: string; title?: string };

export interface MonthCalendarProps {
  visibleMonth: Date;
  onVisibleMonthChange: (next: Date) => void;
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  /** Local yyyy-mm-dd → markers (e.g. status dots) */
  markersByDay?: Record<string, MonthCalMarker[]>;
  maxDotsPerCell?: number;
}

const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  visibleMonth,
  onVisibleMonthChange,
  selectedDate,
  onSelectDate,
  markersByDay = {},
  maxDotsPerCell = 4,
}) => {
  const anchor = startOfMonth(visibleMonth);
  const cells = buildCalendarCells(anchor);
  const selectedKey = selectedDate ? toLocalYmd(selectedDate) : null;
  const todayKey = toLocalYmd(new Date());

  const title = anchor.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  return (
    <div className="month-cal">
      <div className="month-cal__header">
        <div className="month-cal__title">{title}</div>
        <div className="month-cal__nav">
          <button type="button" aria-label="Tháng trước" onClick={() => onVisibleMonthChange(addMonths(anchor, -1))}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" aria-label="Tháng sau" onClick={() => onVisibleMonthChange(addMonths(anchor, 1))}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="month-cal__weekdays">
        {weekdayLabels.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="month-cal__grid">
        {cells.map(({ date, inCurrentMonth }) => {
          const key = toLocalYmd(date);
          const markers = markersByDay[key] ?? [];
          const isSelected = selectedKey === key;
          const isToday = todayKey === key;
          const shown = markers.slice(0, maxDotsPerCell);
          const more = markers.length - shown.length;

          return (
            <button
              key={key + (inCurrentMonth ? '' : '-pad')}
              type="button"
              className={[
                'month-cal__cell',
                !inCurrentMonth ? 'month-cal__cell--muted' : '',
                isToday ? 'month-cal__cell--today' : '',
                isSelected ? 'month-cal__cell--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(date)}
            >
              <div className="month-cal__daynum">{date.getDate()}</div>
              <div className="month-cal__dots" aria-hidden>
                {shown.map((m, i) => (
                  <span key={i} className="month-cal__dot" style={{ background: m.color }} title={m.title} />
                ))}
                {more > 0 ? <span className="month-cal__more">+{more}</span> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
