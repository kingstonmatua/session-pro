'use client';

import { ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { AvailabilityRule, AvailabilityException } from '@/types/sessionpro';

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

type DayRule = { on: boolean; start: string; end: string };

type ExceptionState =
  | { type: 'blocked'; id: string }
  | { type: 'override'; id: string; start: string; end: string };

type Props = {
  proId: string;
  timezone: string;
  initialRules: AvailabilityRule[];
  initialExceptions: AvailabilityException[];
};

const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS: Record<DayKey, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
const DAY_LONG: Record<DayKey, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
const DOW_TO_KEY: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_OPTIONS: { value: string; label: string }[] = [];
for (let h = 6; h <= 21; h++) {
  for (const m of ['00', '30']) {
    const ap = h < 12 ? 'AM' : 'PM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    TIME_OPTIONS.push({ value: `${String(h).padStart(2, '0')}:${m}`, label: `${h12}:${m} ${ap}` });
  }
}

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function utcToLocalDateStr(utcIso: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date(utcIso));
}

function utcToLocalTimeStr(utcIso: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(utcIso));
  const h = parts.find(p => p.type === 'hour')?.value ?? '00';
  const mn = parts.find(p => p.type === 'minute')?.value ?? '00';
  // Handle midnight shown as '24'
  return `${h === '24' ? '00' : h}:${mn}`;
}

function localToUTC(dateStr: string, timeStr: string, timezone: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  const fake = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = fmt.formatToParts(fake);
  const getP = (type: string) => parseInt(parts.find(p => p.type === type)!.value);
  const shownMs = Date.UTC(getP('year'), getP('month') - 1, getP('day'), getP('hour'), getP('minute'));
  const offset = fake.getTime() - shownMs;
  return new Date(fake.getTime() + offset).toISOString();
}

function fmt12(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ap = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

function buildTemplate(rules: AvailabilityRule[]): Record<DayKey, DayRule> {
  const tpl: Record<DayKey, DayRule> = {
    mon: { on: false, start: '09:00', end: '17:00' },
    tue: { on: false, start: '09:00', end: '17:00' },
    wed: { on: false, start: '09:00', end: '17:00' },
    thu: { on: false, start: '09:00', end: '17:00' },
    fri: { on: false, start: '09:00', end: '17:00' },
    sat: { on: false, start: '09:00', end: '17:00' },
    sun: { on: false, start: '09:00', end: '17:00' },
  };
  for (const r of rules) {
    tpl[r.day as DayKey] = { on: true, start: r.start_time.slice(0, 5), end: r.end_time.slice(0, 5) };
  }
  return tpl;
}

function buildExceptionMap(exceptions: AvailabilityException[], timezone: string): Record<string, ExceptionState> {
  const map: Record<string, ExceptionState> = {};
  for (const exc of exceptions) {
    const dateStr = utcToLocalDateStr(exc.starts_at, timezone);
    if (!exc.is_available) {
      map[dateStr] = { type: 'blocked', id: exc.id };
    } else {
      map[dateStr] = {
        type: 'override',
        id: exc.id,
        start: utcToLocalTimeStr(exc.starts_at, timezone),
        end: utcToLocalTimeStr(exc.ends_at, timezone),
      };
    }
  }
  return map;
}

export function ScheduleClient({ timezone, initialRules, initialExceptions }: Props) {
  const [template, setTemplate] = useState<Record<DayKey, DayRule>>(() => buildTemplate(initialRules));
  const [exceptions, setExceptions] = useState<Record<string, ExceptionState>>(() =>
    buildExceptionMap(initialExceptions, timezone)
  );

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  const [ruleSaving, setRuleSaving] = useState(false);
  const [ruleSaved, setRuleSaved] = useState(false);
  const [ruleError, setRuleError] = useState('');

  const [excSaving, setExcSaving] = useState(false);
  const [excError, setExcError] = useState('');

  // ── Weekly template save ──────────────────────────────────────────
  async function saveWeeklyTemplate() {
    setRuleError('');
    const activeRules = DAY_KEYS
      .filter(d => template[d].on)
      .map(d => ({ day: d, start_time: template[d].start, end_time: template[d].end }));

    if (activeRules.length === 0) {
      setRuleError('Select at least one day.');
      return;
    }

    setRuleSaving(true);
    const res = await fetch('/api/schedule/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules: activeRules }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      setRuleError(error ?? 'Failed to save.');
    } else {
      setRuleSaved(true);
      setTimeout(() => setRuleSaved(false), 3000);
    }
    setRuleSaving(false);
  }

  // ── Exception helpers ─────────────────────────────────────────────
  async function saveException(dateStr: string, type: 'blocked' | 'override', start?: string, end?: string) {
    setExcError('');
    setExcSaving(true);

    const existing = exceptions[dateStr];

    // Delete old exception if it exists
    if (existing?.id) {
      await fetch(`/api/schedule/exceptions/${existing.id}`, { method: 'DELETE' });
    }

    const starts_at = type === 'blocked'
      ? localToUTC(dateStr, '00:00', timezone)
      : localToUTC(dateStr, start!, timezone);
    const ends_at = type === 'blocked'
      ? localToUTC(dateStr, '23:59', timezone)
      : localToUTC(dateStr, end!, timezone);

    const res = await fetch('/api/schedule/exceptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starts_at, ends_at, is_available: type === 'override' }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      setExcError(error ?? 'Failed to save.');
      setExcSaving(false);
      return;
    }

    const { exception } = await res.json();
    setExceptions(prev => ({
      ...prev,
      [dateStr]: type === 'blocked'
        ? { type: 'blocked', id: exception.id }
        : { type: 'override', id: exception.id, start: start!, end: end! },
    }));
    setExcSaving(false);
  }

  async function deleteException(dateStr: string) {
    const exc = exceptions[dateStr];
    if (!exc?.id) return;
    setExcSaving(true);
    await fetch(`/api/schedule/exceptions/${exc.id}`, { method: 'DELETE' });
    setExceptions(prev => {
      const next = { ...prev };
      delete next[dateStr];
      return next;
    });
    setExcSaving(false);
  }

  async function bulkSaveException(dates: string[], type: 'blocked' | 'override' | 'restore', start?: string, end?: string) {
    setExcError('');
    setExcSaving(true);

    // Delete all existing exceptions for these dates first
    const deleteIds = dates.map(d => exceptions[d]?.id).filter(Boolean) as string[];
    await Promise.all(deleteIds.map(id => fetch(`/api/schedule/exceptions/${id}`, { method: 'DELETE' })));

    if (type === 'restore') {
      setExceptions(prev => {
        const next = { ...prev };
        dates.forEach(d => delete next[d]);
        return next;
      });
      setExcSaving(false);
      return;
    }

    // Create new exceptions for all dates
    const results = await Promise.all(dates.map(async dateStr => {
      const starts_at = type === 'blocked'
        ? localToUTC(dateStr, '00:00', timezone)
        : localToUTC(dateStr, start!, timezone);
      const ends_at = type === 'blocked'
        ? localToUTC(dateStr, '23:59', timezone)
        : localToUTC(dateStr, end!, timezone);

      const res = await fetch('/api/schedule/exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starts_at, ends_at, is_available: type === 'override' }),
      });
      if (!res.ok) return null;
      const { exception } = await res.json();
      return { dateStr, exception };
    }));

    setExceptions(prev => {
      const next = { ...prev };
      for (const r of results) {
        if (!r) continue;
        next[r.dateStr] = type === 'blocked'
          ? { type: 'blocked', id: r.exception.id }
          : { type: 'override', id: r.exception.id, start: start!, end: end! };
      }
      return next;
    });
    setExcSaving(false);
  }

  // ── Calendar helpers ──────────────────────────────────────────────
  function changeMonth(dir: number) {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
    setSelectedDates(new Set());
  }

  function toggleDate(dateStr: string) {
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
    setExcError('');
  }

  function clearSelection() {
    setSelectedDates(new Set());
    setExcError('');
  }

  // ── Calendar grid ─────────────────────────────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const firstDOW = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calDays: { dateStr: string; d: number; isPast: boolean; dow: DayKey }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    calDays.push({
      dateStr: toDateStr(currentYear, currentMonth + 1, d),
      d,
      isPast: dateObj < todayStart,
      dow: DOW_TO_KEY[dateObj.getDay()],
    });
  }

  // ── Render ────────────────────────────────────────────────────────
  const selCount = selectedDates.size;
  const selDates = [...selectedDates].sort();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>

      {/* ── Left: Weekly Template ──────────────────────────────── */}
      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Weekly Hours</span>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Repeats every week</span>
        </div>

        {DAY_KEYS.map(d => {
          const rule = template[d];
          return (
            <div
              key={d}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: '1px solid var(--border)' }}
            >
              <button
                type="button"
                onClick={() => setTemplate(prev => ({ ...prev, [d]: { ...prev[d], on: !prev[d].on } }))}
                style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer', border: 'none',
                  background: rule.on ? 'var(--green)' : 'transparent',
                  outline: rule.on ? 'none' : '2px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label={`Toggle ${DAY_LABELS[d]}`}
              >
                {rule.on && <CheckCircle2 size={12} color="white" strokeWidth={3} />}
              </button>

              <span style={{ fontWeight: 600, fontSize: 13, width: 32, flexShrink: 0 }}>{DAY_LABELS[d]}</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, opacity: rule.on ? 1 : 0.3, pointerEvents: rule.on ? 'auto' : 'none' }}>
                <select
                  className="form-input"
                  style={{ padding: '4px 6px', fontSize: 12, flex: 1 }}
                  value={rule.start}
                  onChange={e => setTemplate(prev => ({ ...prev, [d]: { ...prev[d], start: e.target.value } }))}
                >
                  {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>→</span>
                <select
                  className="form-input"
                  style={{ padding: '4px 6px', fontSize: 12, flex: 1 }}
                  value={rule.end}
                  onChange={e => setTemplate(prev => ({ ...prev, [d]: { ...prev[d], end: e.target.value } }))}
                >
                  {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
          );
        })}

        {ruleError && <div className="form-error" style={{ margin: '0 20px 8px' }}>{ruleError}</div>}

        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {ruleSaved && (
            <span style={{ fontSize: 13, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle2 size={14} /> Saved
            </span>
          )}
          <button
            className="button button-primary"
            style={{ marginLeft: 'auto', fontSize: 13, minHeight: 36, padding: '0 16px' }}
            onClick={saveWeeklyTemplate}
            disabled={ruleSaving}
          >
            {ruleSaving ? <><Loader2 size={14} className="spin" /> Saving…</> : 'Save Weekly Hours'}
          </button>
        </div>
      </div>

      {/* ── Right: Calendar ───────────────────────────────────── */}
      <div>
        <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <button
              type="button" onClick={() => changeMonth(-1)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}
            >
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{MONTH_NAMES[currentMonth]} {currentYear}</span>
            <button
              type="button" onClick={() => changeMonth(1)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Selection bar */}
          {selCount >= 2 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 20px', background: 'var(--blue-light)', borderBottom: '1px solid #bfdbfe', fontSize: 13 }}>
              <span style={{ color: 'var(--blue)', fontWeight: 600 }}>
                {selCount} days selected
              </span>
              <button type="button" onClick={clearSelection} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                Clear selection
              </button>
            </div>
          )}

          {/* Hint */}
          {selCount < 2 && (
            <div style={{ padding: '7px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-soft)' }}>
              Click days to select · Select multiple to bulk edit
            </div>
          )}

          {/* Grid */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(n => (
                <div key={n} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{n}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: firstDOW }, (_, i) => <div key={`e${i}`} />)}
              {calDays.map(({ dateStr, d, isPast, dow }) => {
                const isSelected = selectedDates.has(dateStr);
                const exc = exceptions[dateStr];
                let dotColor = '';
                if (!isPast) {
                  if (exc?.type === 'blocked') dotColor = 'var(--red)';
                  else if (exc?.type === 'override') dotColor = 'var(--amber)';
                  else if (template[dow].on) dotColor = 'var(--green)';
                }

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isPast}
                    onClick={() => toggleDate(dateStr)}
                    style={{
                      aspectRatio: '1', borderRadius: 8, cursor: isPast ? 'default' : 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      border: isSelected ? '2px solid var(--green)' : '2px solid transparent',
                      background: isSelected ? 'var(--green-light)' : 'transparent',
                      opacity: isPast ? 0.3 : 1,
                      transition: 'background 0.1s, border-color 0.1s',
                    }}
                    onMouseEnter={e => { if (!isPast && !isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1 }}>{d}</span>
                    {dotColor && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, marginTop: 4 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-soft)' }}>
            {[['var(--green)', 'Available'], ['var(--amber)', 'Custom hours'], ['var(--red)', 'Blocked']].map(([color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Detail / Bulk panel ──────────────────────────────── */}
        {selCount > 0 && (
          <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden', marginTop: 16 }}>
            {excSaving && (
              <div style={{ padding: '10px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={14} className="spin" /> Saving…
              </div>
            )}

            {selCount === 1
              ? <SingleDayPanel
                  dateStr={selDates[0]}
                  timezone={timezone}
                  template={template}
                  exceptions={exceptions}
                  onSaveException={saveException}
                  onDeleteException={deleteException}
                  onClose={clearSelection}
                  excError={excError}
                />
              : <BulkPanel
                  dates={selDates}
                  onRemove={d => { setSelectedDates(prev => { const n = new Set(prev); n.delete(d); return n; }); }}
                  onSave={bulkSaveException}
                  onClose={clearSelection}
                  excError={excError}
                />
            }
          </div>
        )}
      </div>

    </div>
  );
}

// ── Single day panel ─────────────────────────────────────────────────────────

type SingleDayProps = {
  dateStr: string;
  timezone: string;
  template: Record<DayKey, DayRule>;
  exceptions: Record<string, ExceptionState>;
  onSaveException: (dateStr: string, type: 'blocked' | 'override', start?: string, end?: string) => Promise<void>;
  onDeleteException: (dateStr: string) => Promise<void>;
  onClose: () => void;
  excError: string;
};

function SingleDayPanel({ dateStr, timezone, template, exceptions, onSaveException, onDeleteException, onClose, excError }: SingleDayProps) {
  const dateObj = new Date(dateStr + 'T12:00:00');
  const dow = DOW_TO_KEY[dateObj.getDay()];
  const rule = template[dow];
  const exc = exceptions[dateStr];

  const defaultStart = exc?.type === 'override' ? exc.start : rule?.start ?? '09:00';
  const defaultEnd = exc?.type === 'override' ? exc.end : rule?.end ?? '17:00';

  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  const dayName = DAY_NAMES_LONG[dateObj.getDay()];
  const monthName = MONTH_NAMES[dateObj.getMonth()];
  const dateLabel = `${dayName}, ${monthName} ${dateObj.getDate()}`;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{dateLabel}</span>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', fontSize: 20, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ padding: 20 }}>
        {/* Status */}
        <div style={{ marginBottom: 20 }}>
          {exc?.type === 'blocked' && (
            <StatusPill color="red" label="Blocked" sub="Overrides your weekly hours for this date" />
          )}
          {exc?.type === 'override' && (
            <StatusPill color="amber" label="Custom hours" sub={`${fmt12(exc.start)} – ${fmt12(exc.end)} (overrides weekly template)`} />
          )}
          {!exc && rule?.on && (
            <StatusPill color="green" label="Available" sub={`Using weekly hours: ${fmt12(rule.start)} – ${fmt12(rule.end)}`} />
          )}
          {!exc && !rule?.on && (
            <StatusPill color="none" label="Not available" sub="Not in your weekly schedule" />
          )}
        </div>

        {/* Blocked state */}
        {exc?.type === 'blocked' && (
          <button className="button button-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onDeleteException(dateStr)}>
            Restore to weekly hours
          </button>
        )}

        {/* Override or normal available — show time pickers */}
        {exc?.type !== 'blocked' && (
          <>
            {!exc && !rule?.on && (
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>Add one-off availability for just this date.</p>
            )}
            {!exc && rule?.on && (
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>Set custom hours just for this day, or block it entirely.</p>
            )}

            <div className="form-field" style={{ marginBottom: 16 }}>
              <label className="form-label">Hours for this day</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select className="form-input" value={start} onChange={e => setStart(e.target.value)} style={{ flex: 1 }}>
                  {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <span style={{ color: 'var(--ink-soft)', fontSize: 13 }}>to</span>
                <select className="form-input" value={end} onChange={e => setEnd(e.target.value)} style={{ flex: 1 }}>
                  {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <button
              className="button button-primary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
              onClick={() => onSaveException(dateStr, 'override', start, end)}
            >
              Save for this day
            </button>

            {exc?.type === 'override' && (
              <button
                className="button"
                style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
                onClick={() => onDeleteException(dateStr)}
              >
                Revert to weekly hours
              </button>
            )}

            <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0' }} />

            <button
              className="button"
              style={{ width: '100%', justifyContent: 'center', background: 'var(--red-light, #fee2e2)', color: 'var(--red, #dc2626)', border: '1px solid #fca5a5' }}
              onClick={() => onSaveException(dateStr, 'blocked')}
            >
              Mark unavailable this day
            </button>
          </>
        )}

        {excError && <div className="form-error" style={{ marginTop: 12 }}>{excError}</div>}
      </div>
    </>
  );
}

// ── Bulk panel ───────────────────────────────────────────────────────────────

type BulkPanelProps = {
  dates: string[];
  onRemove: (dateStr: string) => void;
  onSave: (dates: string[], type: 'blocked' | 'override' | 'restore', start?: string, end?: string) => Promise<void>;
  onClose: () => void;
  excError: string;
};

function BulkPanel({ dates, onRemove, onSave, onClose, excError }: BulkPanelProps) {
  const [bulkStart, setBulkStart] = useState('09:00');
  const [bulkEnd, setBulkEnd] = useState('17:00');

  function chipLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{dates.length} Days Selected</span>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', fontSize: 20, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ padding: 20 }}>
        {/* Day chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {dates.map(dateStr => (
            <span
              key={dateStr}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: 'var(--blue-light)', color: 'var(--blue)', border: '1px solid #bfdbfe' }}
            >
              {chipLabel(dateStr)}
              <button
                type="button"
                onClick={() => onRemove(dateStr)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', fontSize: 14, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center' }}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 20 }}>
          Apply the same change to all {dates.length} selected days at once.
        </p>

        {/* Set hours */}
        <div className="form-field" style={{ marginBottom: 14 }}>
          <label className="form-label">Set hours for all selected days</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select className="form-input" value={bulkStart} onChange={e => setBulkStart(e.target.value)} style={{ flex: 1 }}>
              {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <span style={{ color: 'var(--ink-soft)', fontSize: 13 }}>to</span>
            <select className="form-input" value={bulkEnd} onChange={e => setBulkEnd(e.target.value)} style={{ flex: 1 }}>
              {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <button
          className="button button-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}
          onClick={() => onSave(dates, 'override', bulkStart, bulkEnd)}
        >
          Set hours for {dates.length} days
        </button>

        <div style={{ borderTop: '1px solid var(--border)', marginBottom: 16 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            className="button"
            style={{ justifyContent: 'center', background: 'var(--red-light, #fee2e2)', color: 'var(--red, #dc2626)', border: '1px solid #fca5a5' }}
            onClick={() => onSave(dates, 'blocked')}
          >
            Mark all {dates.length} days unavailable
          </button>
          <button
            className="button"
            style={{ justifyContent: 'center' }}
            onClick={() => onSave(dates, 'restore')}
          >
            Revert all to weekly hours
          </button>
        </div>

        {excError && <div className="form-error" style={{ marginTop: 12 }}>{excError}</div>}
      </div>
    </>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ color, label, sub }: { color: 'green' | 'amber' | 'red' | 'none'; label: string; sub: string }) {
  const styles: Record<string, { background: string; color: string; border?: string }> = {
    green: { background: 'var(--green-light)', color: 'var(--green)' },
    amber: { background: 'var(--amber-light)', color: 'var(--amber)' },
    red:   { background: 'var(--red-light, #fee2e2)', color: 'var(--red, #dc2626)' },
    none:  { background: 'var(--bg)', color: 'var(--ink-soft)', border: '1px solid var(--border)' },
  };
  const s = styles[color];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, alignSelf: 'flex-start', ...s }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{sub}</span>
    </div>
  );
}
