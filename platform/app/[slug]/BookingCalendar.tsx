'use client';

import { ChevronLeft, ChevronRight, Globe, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { AvailabilityRule } from '@/types/sessionpro';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const DOW_TO_DAY: Record<number, AvailabilityRule['day']> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

type GroupSlotInfo = {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  booked: number;
  serviceId: string;
  serviceName: string;
  label: string | null;
};

function formatTimezone(tz: string): string {
  const now = new Date();
  const long = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'long' })
    .formatToParts(now).find(p => p.type === 'timeZoneName')?.value ?? tz;
  const short = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
    .formatToParts(now).find(p => p.type === 'timeZoneName')?.value ?? '';
  return short && short !== long ? `${long} (${short})` : long;
}

function calDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function utcToProDateSlot(utcIso: string, timezone: string): { dateStr: string; slotLabel: string } {
  const date = new Date(utcIso);
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);
  const hour = parts.find(p => p.type === 'hour')?.value ?? '';
  const minute = parts.find(p => p.type === 'minute')?.value ?? '';
  const period = parts.find(p => p.type === 'dayPeriod')?.value ?? '';
  return { dateStr, slotLabel: `${hour}:${minute} ${period}` };
}

function generateSlots(rule: AvailabilityRule, durationMinutes: number, bufferMinutes: number): string[] {
  const parseTime = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const formatSlot = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const period = h < 12 ? 'AM' : 'PM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };

  const start = parseTime(rule.start_time);
  const end = parseTime(rule.end_time);
  const interval = durationMinutes + bufferMinutes;
  const slots: string[] = [];

  for (let t = start; t + durationMinutes <= end; t += interval) {
    slots.push(formatSlot(t));
  }
  return slots;
}

type AvailException = {
  id: string;
  starts_at: string;
  ends_at: string;
  is_available: boolean;
};

type Props = {
  proId: string;
  timezone: string;
  availability: AvailabilityRule[];
  durationMinutes: number;
  bufferMinutes: number;
  onDateSelect: (date: Date | null) => void;
  onTimeSelect: (time: string | null, groupSlot?: GroupSlotInfo | null) => void;
};

export function BookingCalendar({ proId, timezone, availability, durationMinutes, bufferMinutes, onDateSelect, onTimeSelect }: Props) {
  const todayRef = new Date();
  todayRef.setHours(0, 0, 0, 0);

  const [calYear, setCalYear] = useState(todayRef.getFullYear());
  const [calMonth, setCalMonth] = useState(todayRef.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedByDate, setBookedByDate] = useState<Map<string, Set<string>>>(new Map());
  const [blockedRanges, setBlockedRanges] = useState<{ starts_at: string; ends_at: string }[]>([]);
  const [groupSlotsByDate, setGroupSlotsByDate] = useState<Map<string, GroupSlotInfo[]>>(new Map());
  const [exceptions, setExceptions] = useState<AvailException[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const ruleByDay = new Map<AvailabilityRule['day'], AvailabilityRule>();
  for (const rule of availability) {
    ruleByDay.set(rule.day, rule);
  }

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setSelectedSlot(null);
    onTimeSelect(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMinutes, bufferMinutes]);

  useEffect(() => {
    let cancelled = false;
    setLoadingSlots(true);

    fetch(`/api/availability/${proId}?year=${calYear}&month=${calMonth}`)
      .then(r => r.ok ? r.json() : { bookedStartTimes: [], blockedTimes: [], groupSlots: [] })
      .then(({ bookedStartTimes, blockedTimes, groupSlots, exceptions: excs }: {
        bookedStartTimes: string[];
        blockedTimes: { starts_at: string; ends_at: string }[];
        groupSlots: GroupSlotInfo[];
        exceptions: AvailException[];
      }) => {
        if (cancelled) return;

        // Build booked slots map
        const map = new Map<string, Set<string>>();
        for (const iso of bookedStartTimes) {
          const { dateStr, slotLabel } = utcToProDateSlot(iso, timezone);
          if (!map.has(dateStr)) map.set(dateStr, new Set());
          map.get(dateStr)!.add(slotLabel);
        }
        setBookedByDate(map);
        setBlockedRanges(blockedTimes ?? []);
        setExceptions(excs ?? []);

        // Build group slots map by date
        const gsMap = new Map<string, GroupSlotInfo[]>();
        for (const gs of groupSlots ?? []) {
          const { dateStr, slotLabel } = utcToProDateSlot(gs.startsAt, timezone);
          const enriched = { ...gs, _slotLabel: slotLabel } as GroupSlotInfo & { _slotLabel: string };
          if (!gsMap.has(dateStr)) gsMap.set(dateStr, []);
          gsMap.get(dateStr)!.push(enriched);
        }
        setGroupSlotsByDate(gsMap);
        setLoadingSlots(false);
      })
      .catch(() => { if (!cancelled) setLoadingSlots(false); });

    return () => { cancelled = true; };
  }, [proId, timezone, calYear, calMonth]);

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
    onDateSelect(date);
  }

  const firstDOW = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const lastDate = new Date(calYear, calMonth + 1, 0).getDate();

  const emptyCells = Array.from({ length: firstDOW }, (_, i) => (
    <div key={`e${i}`} className="cal-day cal-empty" />
  ));

  // Build a map of date string → exception for fast lookup
  const excByDate = new Map<string, AvailException>();
  for (const exc of exceptions) {
    const ds = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date(exc.starts_at));
    // Keep the most recent one per date if there are duplicates
    if (!excByDate.has(ds)) excByDate.set(ds, exc);
  }

  const dayCells = Array.from({ length: lastDate }, (_, i) => {
    const d = i + 1;
    const date = new Date(calYear, calMonth, d);
    const dow = date.getDay();
    const dateKey = calDateKey(date);
    const exc = excByDate.get(dateKey);

    // A day is available if: has a rule OR has an is_available exception, AND not blocked
    const hasRule = ruleByDay.has(DOW_TO_DAY[dow]);
    const isBlocked = exc && !exc.is_available;
    const hasOverride = exc && exc.is_available;
    const isPast = date < todayRef;
    const isToday = date.getTime() === todayRef.getTime();
    const isSelected = selectedDate?.getTime() === date.getTime();
    const disabled = (!hasRule && !hasOverride) || isBlocked || isPast;

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

  const selectedRule = selectedDate
    ? ruleByDay.get(DOW_TO_DAY[selectedDate.getDay()])
    : undefined;

  // If the selected date has an override exception, use those hours instead of the rule
  const selectedExc = selectedDate ? excByDate.get(calDateKey(selectedDate)) : undefined;

  function isoToLocalHHMM(iso: string): string {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(iso));
    const h = parts.find(p => p.type === 'hour')?.value ?? '00';
    const m = parts.find(p => p.type === 'minute')?.value ?? '00';
    return `${h === '24' ? '00' : h}:${m}`;
  }

  const effectiveRule: AvailabilityRule | undefined = selectedExc?.is_available
    ? {
        id: selectedExc.id,
        pro_id: '',
        day: DOW_TO_DAY[selectedDate!.getDay()] as AvailabilityRule['day'],
        is_active: true,
        start_time: isoToLocalHHMM(selectedExc.starts_at),
        end_time: isoToLocalHHMM(selectedExc.ends_at),
      }
    : selectedRule;

  const availableSlots = effectiveRule
    ? generateSlots(effectiveRule, durationMinutes, bufferMinutes)
    : [];

  const bookedSlots = selectedDate
    ? (bookedByDate.get(calDateKey(selectedDate)) ?? new Set<string>())
    : new Set<string>();

  // Build blocked slots set
  const blockedSlots = new Set<string>();
  if (selectedDate && selectedRule) {
    const dateKey = calDateKey(selectedDate);
    for (const slot of availableSlots) {
      const [time, ampm] = slot.split(' ');
      const [h, m] = time.split(':').map(Number);
      let hour = h;
      if (ampm === 'PM' && hour !== 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      const slotStart = new Date(`${dateKey}T${String(hour).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
      const slotEnd = new Date(slotStart.getTime() + (durationMinutes + bufferMinutes) * 60_000);
      for (const range of blockedRanges) {
        const blockStart = new Date(range.starts_at);
        const blockEnd = new Date(range.ends_at);
        if (slotStart < blockEnd && slotEnd > blockStart) {
          blockedSlots.add(slot);
          break;
        }
      }
    }
  }

  // Build group slot lookup by slot label for the selected date
  const groupSlotByLabel = new Map<string, GroupSlotInfo & { _slotLabel: string }>();
  if (selectedDate) {
    const dateKey = calDateKey(selectedDate);
    for (const gs of (groupSlotsByDate.get(dateKey) ?? [])) {
      const gsWithLabel = gs as GroupSlotInfo & { _slotLabel: string };
      if (gsWithLabel._slotLabel) {
        groupSlotByLabel.set(gsWithLabel._slotLabel, gsWithLabel);
      }
    }
  }

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

      <div className="cal-timezone-note">
        <Globe size={13} />
        Times shown in {formatTimezone(timezone)}
      </div>

      {selectedDate && (
        <div className="slots-section">
          <div className="slots-label">
            Available times &mdash; {DAYS_LONG[selectedDate.getDay()]}, {MONTHS_SHORT[selectedDate.getMonth()]} {selectedDate.getDate()}
          </div>
          {loadingSlots ? (
            <div className="slots-loading">
              <Loader2 size={15} className="slots-spinner" />
              Checking availability…
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="slots-loading">No available times for this day.</div>
          ) : (
            <div className="slots-grid">
              {availableSlots.map(slot => {
                const groupSlot = groupSlotByLabel.get(slot);
                const isFull = groupSlot ? groupSlot.booked >= groupSlot.capacity : false;
                const isUnavailable = bookedSlots.has(slot) || blockedSlots.has(slot) || isFull;
                const isSelected = slot === selectedSlot;

                if (groupSlot && !isFull) {
                  const spotsLeft = groupSlot.capacity - groupSlot.booked;
                  return (
                    <button
                      key={slot}
                      type="button"
                      className={`slot-btn slot-group${isSelected ? ' slot-selected' : ''}`}
                      onClick={() => {
                        setSelectedSlot(slot);
                        onTimeSelect(slot, groupSlot);
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{slot}</div>
                      <div style={{ fontSize: 11, marginTop: 2, opacity: 0.85 }}>
                        {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                      </div>
                    </button>
                  );
                }

                const cls = [
                  'slot-btn',
                  isUnavailable ? 'slot-booked' : '',
                  isSelected ? 'slot-selected' : '',
                ].filter(Boolean).join(' ');

                return (
                  <button
                    key={slot}
                    type="button"
                    className={cls}
                    disabled={isUnavailable}
                    onClick={() => {
                      if (!isUnavailable) {
                        setSelectedSlot(slot);
                        onTimeSelect(slot, null);
                      }
                    }}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
