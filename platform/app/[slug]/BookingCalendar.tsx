'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ALL_SLOTS = ['8:00 AM','9:15 AM','10:30 AM','11:45 AM','1:00 PM','2:15 PM','3:30 PM','4:45 PM'];

function getBookedSlots(date: Date): string[] {
  const seed = date.getDate() + date.getMonth();
  return [ALL_SLOTS[seed % ALL_SLOTS.length], ALL_SLOTS[(seed + 3) % ALL_SLOTS.length]];
}

export function BookingCalendar() {
  const todayRef = new Date();
  todayRef.setHours(0, 0, 0, 0);

  const [calYear, setCalYear] = useState(todayRef.getFullYear());
  const [calMonth, setCalMonth] = useState(todayRef.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  function navMonth(delta: number) {
    let m = calMonth + delta;
    let y = calYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCalMonth(m);
    setCalYear(y);
  }

  function pickDate(date: Date) {
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  // Build day cells — week starts Monday
  const firstDOW = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const lastDate = new Date(calYear, calMonth + 1, 0).getDate();

  const emptyCells = Array.from({ length: firstDOW }, (_, i) => (
    <div key={`e${i}`} className="cal-day cal-empty" />
  ));

  const dayCells = Array.from({ length: lastDate }, (_, i) => {
    const d = i + 1;
    const date = new Date(calYear, calMonth, d);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isPast = date < todayRef;
    const isToday = date.getTime() === todayRef.getTime();
    const isSelected = selectedDate?.getTime() === date.getTime();
    const disabled = isWeekend || isPast;

    const cls = [
      'cal-day',
      disabled ? 'cal-disabled' : 'cal-selectable',
      isToday ? 'cal-today' : '',
      isSelected ? 'cal-selected' : '',
    ].filter(Boolean).join(' ');

    return (
      <button
        key={d}
        type="button"
        className={cls}
        disabled={disabled}
        onClick={() => pickDate(new Date(calYear, calMonth, d))}
      >
        {d}
      </button>
    );
  });

  const bookedSlots = selectedDate ? getBookedSlots(selectedDate) : [];

  return (
    <div>
      <div className="cal-card">
        <div className="cal-header">
          <button className="cal-nav-btn" onClick={() => navMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <span className="cal-month-label">{MONTHS[calMonth]} {calYear}</span>
          <button className="cal-nav-btn" onClick={() => navMonth(1)} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="cal-grid">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} className="cal-dh">{d}</div>
          ))}
          {emptyCells}
          {dayCells}
        </div>
      </div>

      {selectedDate && (
        <div className="slots-section">
          <div className="slots-label">
            Available times &mdash; {DAYS_LONG[selectedDate.getDay()]}, {MONTHS_SHORT[selectedDate.getMonth()]} {selectedDate.getDate()}
          </div>
          <div className="slots-grid">
            {ALL_SLOTS.map(slot => {
              const isBooked = bookedSlots.includes(slot);
              const isSelected = slot === selectedSlot;
              const cls = [
                'slot-btn',
                isBooked ? 'slot-booked' : '',
                isSelected ? 'slot-selected' : '',
              ].filter(Boolean).join(' ');
              return (
                <button
                  key={slot}
                  type="button"
                  className={cls}
                  disabled={isBooked}
                  onClick={() => !isBooked && setSelectedSlot(slot)}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
