'use client';

import { ChevronLeft, ChevronRight, Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import type { AvailabilityRule } from '@/types/sessionpro';

type CalBooking = {
  id: string; startsAt: string; endsAt: string; status: string;
  clientName: string; clientEmail: string; serviceName: string;
};
type CalRequest = {
  id: string; startsAt: string; endsAt: string; status: string;
  clientName: string; clientEmail: string; serviceName: string;
};
type CalBlocked = {
  id: string; startsAt: string; endsAt: string; label: string | null;
};

type Props = {
  proId: string;
  timezone: string;
  bookings: CalBooking[];
  requests: CalRequest[];
  blockedTimes: CalBlocked[];
  availabilityRules: AvailabilityRule[];
};

type View = 'month' | 'week' | 'day';
type EventKind = 'booking' | 'request' | 'blocked';
type SelectedEvent = {
  kind: EventKind;
  data: CalBooking | CalRequest | CalBlocked;
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6am–9pm

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toLocalDate(iso: string, tz: string) {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return new Date(
    parseInt(parts.year), parseInt(parts.month) - 1, parseInt(parts.day),
    parseInt(parts.hour) % 24, parseInt(parts.minute)
  );
}

function fmtTime(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtDate(iso: string, tz: string) {
  return new Date(iso).toLocaleDateString('en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function ProCalendar({ proId, timezone, bookings, requests, blockedTimes, availabilityRules }: Props) {
  const [view, setView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()));
  const [selected, setSelected] = useState<SelectedEvent | null>(null);
  const [localBookings, setLocalBookings] = useState(bookings);
  const [localRequests, setLocalRequests] = useState(requests);
  const [localBlocked, setLocalBlocked] = useState(blockedTimes);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockDate, setBlockDate] = useState('');
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockLabel, setBlockLabel] = useState('');
  const [blockSaving, setBlockSaving] = useState(false);
  // Reschedule sub-form
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [rescheduleEnd, setRescheduleEnd] = useState('');
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

  // ── Navigation ──────────────────────────────────────────────────
  function navigate(delta: number) {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + delta);
    else if (view === 'week') d.setDate(d.getDate() + delta * 7);
    else d.setDate(d.getDate() + delta);
    setCurrentDate(startOfDay(d));
  }

  function navTitle() {
    if (view === 'month') return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === 'week') {
      const end = new Date(currentDate); end.setDate(end.getDate() + 6);
      const sameMonth = currentDate.getMonth() === end.getMonth();
      return sameMonth
        ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getDate()}–${end.getDate()}, ${currentDate.getFullYear()}`
        : `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getDate()} – ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${DAY_NAMES[currentDate.getDay()]}, ${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  }

  // ── Events for a day ────────────────────────────────────────────
  function eventsForDay(day: Date) {
    const events: { kind: EventKind; data: CalBooking | CalRequest | CalBlocked; time: string }[] = [];
    for (const b of localBookings) {
      const ld = toLocalDate(b.startsAt, timezone);
      if (isSameDay(ld, day)) events.push({ kind: 'booking', data: b, time: fmtTime(b.startsAt, timezone) });
    }
    for (const r of localRequests) {
      if (r.status !== 'pending') continue;
      const ld = toLocalDate(r.startsAt, timezone);
      if (isSameDay(ld, day)) events.push({ kind: 'request', data: r, time: fmtTime(r.startsAt, timezone) });
    }
    for (const bl of localBlocked) {
      const ld = toLocalDate(bl.startsAt, timezone);
      if (isSameDay(ld, day)) events.push({ kind: 'blocked', data: bl, time: fmtTime(bl.startsAt, timezone) });
    }
    return events.sort((a, b) => a.time.localeCompare(b.time));
  }

  // ── Actions ─────────────────────────────────────────────────────
  async function acceptRequest(requestId: string) {
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch(`/api/booking-requests/${requestId}/accept`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to accept');
      }
      setLocalRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: 'accepted' } : r));
      setSelected(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error');
    }
    setActionLoading(false);
  }

  async function declineRequest(requestId: string) {
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch(`/api/booking-requests/${requestId}/decline`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to decline');
      }
      setLocalRequests((prev) => prev.filter((r) => r.id !== requestId));
      setSelected(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error');
    }
    setActionLoading(false);
  }

  async function removeBlocked(id: string) {
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch(`/api/blocked-times/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove');
      setLocalBlocked((prev) => prev.filter((b) => b.id !== id));
      setSelected(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error');
    }
    setActionLoading(false);
  }

  async function saveBlockedTime() {
    if (!blockDate || !blockStart || !blockEnd) return;
    setBlockSaving(true);
    const startsAt = new Date(`${blockDate}T${blockStart}`).toISOString();
    const endsAt = new Date(`${blockDate}T${blockEnd}`).toISOString();
    try {
      const res = await fetch('/api/blocked-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startsAt, endsAt, label: blockLabel || null }),
      });
      if (!res.ok) throw new Error('Failed to block time');
      const { blockedTime } = await res.json();
      setLocalBlocked((prev) => [...prev, blockedTime]);
      setShowBlockForm(false);
      setBlockDate(''); setBlockStart(''); setBlockEnd(''); setBlockLabel('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error');
    }
    setBlockSaving(false);
  }

  async function proposeReschedule(bookingId: string) {
    if (!rescheduleDate || !rescheduleStart || !rescheduleEnd) return;
    setRescheduleSaving(true);
    const newStartsAt = new Date(`${rescheduleDate}T${rescheduleStart}`).toISOString();
    const newEndsAt = new Date(`${rescheduleDate}T${rescheduleEnd}`).toISOString();
    try {
      const res = await fetch('/api/reschedule-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, newStartsAt, newEndsAt }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to propose reschedule');
      }
      setShowReschedule(false);
      setSelected(null);
      setActionError('');
      alert('Reschedule request sent to client.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error');
    }
    setRescheduleSaving(false);
  }

  // ── Month grid ──────────────────────────────────────────────────
  function renderMonthView() {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startPad = firstDay.getDay();
    const totalCells = startPad + lastDay.getDate();
    const weeks = Math.ceil(totalCells / 7);
    const today = startOfDay(new Date());

    const cells: (Date | null)[] = Array(startPad).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), d));
    }
    while (cells.length < weeks * 7) cells.push(null);

    return (
      <div className="cal-month-grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="cal-month-header">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="cal-day-cell cal-day-cell--empty" />;
          const events = eventsForDay(day);
          const isToday = isSameDay(day, today);
          return (
            <div key={i} className={`cal-day-cell${isToday ? ' cal-day-cell--today' : ''}`}>
              <span className="cal-day-number">{day.getDate()}</span>
              <div className="cal-day-events">
                {events.slice(0, 3).map((ev, j) => (
                  <button
                    key={j}
                    className={`cal-event-pill cal-event-pill--${ev.kind}`}
                    onClick={() => { setSelected({ kind: ev.kind, data: ev.data }); setShowReschedule(false); }}
                  >
                    {ev.time} {ev.kind === 'booking' ? (ev.data as CalBooking).clientName.split(' ')[0] : ev.kind === 'request' ? `Request: ${(ev.data as CalRequest).clientName.split(' ')[0]}` : (ev.data as CalBlocked).label ?? 'Blocked'}
                  </button>
                ))}
                {events.length > 3 && <span className="cal-event-more">+{events.length - 3} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Week grid ───────────────────────────────────────────────────
  function renderWeekView() {
    const days: Date[] = [];
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay()); // go to Sunday
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      days.push(startOfDay(d));
    }
    const today = startOfDay(new Date());

    return (
      <div className="cal-week-grid">
        <div className="cal-time-gutter" />
        {days.map((day) => (
          <div key={day.toISOString()} className={`cal-week-header${isSameDay(day, today) ? ' cal-week-header--today' : ''}`}>
            <span>{DAY_NAMES[day.getDay()]}</span>
            <strong>{day.getDate()}</strong>
          </div>
        ))}
        {HOURS.map((hour) => (
          <>
            <div key={`h-${hour}`} className="cal-hour-label">
              {hour % 12 === 0 ? 12 : hour % 12}{hour < 12 ? 'am' : 'pm'}
            </div>
            {days.map((day) => {
              const dayEvents = eventsForDay(day).filter((ev) => {
                const ld = toLocalDate(ev.kind === 'blocked' ? (ev.data as CalBlocked).startsAt : (ev.data as CalBooking | CalRequest).startsAt, timezone);
                return ld.getHours() === hour;
              });
              return (
                <div key={`${day.toISOString()}-${hour}`} className="cal-hour-cell">
                  {dayEvents.map((ev, j) => (
                    <button
                      key={j}
                      className={`cal-week-event cal-event-pill--${ev.kind}`}
                      onClick={() => { setSelected({ kind: ev.kind, data: ev.data }); setShowReschedule(false); }}
                    >
                      {ev.kind === 'booking' ? (ev.data as CalBooking).clientName.split(' ')[0] : ev.kind === 'request' ? 'Request' : 'Blocked'}
                    </button>
                  ))}
                </div>
              );
            })}
          </>
        ))}
      </div>
    );
  }

  // ── Day view ────────────────────────────────────────────────────
  function renderDayView() {
    const today = startOfDay(new Date());
    return (
      <div className="cal-day-view-grid">
        {HOURS.map((hour) => {
          const dayEvents = eventsForDay(currentDate).filter((ev) => {
            const ld = toLocalDate(ev.kind === 'blocked' ? (ev.data as CalBlocked).startsAt : (ev.data as CalBooking | CalRequest).startsAt, timezone);
            return ld.getHours() === hour;
          });
          return (
            <div key={hour} className="cal-day-view-row">
              <div className="cal-hour-label">
                {hour % 12 === 0 ? 12 : hour % 12}{hour < 12 ? 'am' : 'pm'}
              </div>
              <div className="cal-day-view-events">
                {dayEvents.map((ev, j) => (
                  <button
                    key={j}
                    className={`cal-week-event cal-event-pill--${ev.kind}`}
                    onClick={() => { setSelected({ kind: ev.kind, data: ev.data }); setShowReschedule(false); }}
                  >
                    {ev.time} ·{' '}
                    {ev.kind === 'booking' ? (ev.data as CalBooking).serviceName : ev.kind === 'request' ? `Request: ${(ev.data as CalRequest).serviceName}` : (ev.data as CalBlocked).label ?? 'Blocked'}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Detail panel ─────────────────────────────────────────────────
  function renderDetailPanel() {
    if (!selected) return null;
    const { kind, data } = selected;

    let title = '';
    let rows: { label: string; value: string }[] = [];

    if (kind === 'booking') {
      const b = data as CalBooking;
      title = b.serviceName;
      rows = [
        { label: 'Client', value: `${b.clientName} (${b.clientEmail})` },
        { label: 'Date', value: fmtDate(b.startsAt, timezone) },
        { label: 'Time', value: `${fmtTime(b.startsAt, timezone)} – ${fmtTime(b.endsAt, timezone)}` },
        { label: 'Status', value: b.status },
      ];
    } else if (kind === 'request') {
      const r = data as CalRequest;
      title = `Request: ${r.serviceName}`;
      rows = [
        { label: 'Client', value: `${r.clientName} (${r.clientEmail})` },
        { label: 'Date', value: fmtDate(r.startsAt, timezone) },
        { label: 'Time', value: `${fmtTime(r.startsAt, timezone)} – ${fmtTime(r.endsAt, timezone)}` },
        { label: 'Status', value: r.status },
      ];
    } else {
      const bl = data as CalBlocked;
      title = bl.label ?? 'Blocked time';
      rows = [
        { label: 'Date', value: fmtDate(bl.startsAt, timezone) },
        { label: 'Time', value: `${fmtTime(bl.startsAt, timezone)} – ${fmtTime(bl.endsAt, timezone)}` },
      ];
    }

    return (
      <div className="cal-detail-panel">
        <div className="cal-detail-header">
          <h3>{title}</h3>
          <button className="cal-close-btn" onClick={() => { setSelected(null); setShowReschedule(false); setActionError(''); }}>
            <X size={18} />
          </button>
        </div>

        <div className="cal-detail-rows">
          {rows.map((r) => (
            <div key={r.label} className="cal-detail-row">
              <span>{r.label}</span>
              <strong>{r.value}</strong>
            </div>
          ))}
        </div>

        {actionError && <p className="booking-error" style={{ margin: '8px 0 0' }}>{actionError}</p>}

        {kind === 'request' && (data as CalRequest).status === 'pending' && !showReschedule && (
          <div className="cal-detail-actions">
            <button
              className="button button-primary"
              onClick={() => acceptRequest((data as CalRequest).id)}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 size={14} className="slots-spinner" /> : null}
              Accept &amp; send payment link
            </button>
            <button
              className="button"
              onClick={() => declineRequest((data as CalRequest).id)}
              disabled={actionLoading}
              style={{ color: 'var(--amber)' }}
            >
              Decline
            </button>
          </div>
        )}

        {kind === 'booking' && !showReschedule && (
          <div className="cal-detail-actions">
            <button className="button" onClick={() => { setShowReschedule(true); setActionError(''); }}>
              Propose reschedule
            </button>
          </div>
        )}

        {kind === 'booking' && showReschedule && (
          <div className="cal-reschedule-form">
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 10px' }}>
              Propose a new time. The client will receive an email to confirm.
            </p>
            <div className="cal-form-row">
              <label>New date</label>
              <input type="date" className="form-input" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
            </div>
            <div className="cal-form-row">
              <label>Start time</label>
              <input type="time" className="form-input" value={rescheduleStart} onChange={(e) => setRescheduleStart(e.target.value)} />
            </div>
            <div className="cal-form-row">
              <label>End time</label>
              <input type="time" className="form-input" value={rescheduleEnd} onChange={(e) => setRescheduleEnd(e.target.value)} />
            </div>
            <div className="cal-detail-actions">
              <button
                className="button button-primary"
                onClick={() => proposeReschedule((data as CalBooking).id)}
                disabled={rescheduleSaving || !rescheduleDate || !rescheduleStart || !rescheduleEnd}
              >
                {rescheduleSaving ? <Loader2 size={14} className="slots-spinner" /> : null}
                Send reschedule request
              </button>
              <button className="button" onClick={() => setShowReschedule(false)}>Cancel</button>
            </div>
          </div>
        )}

        {kind === 'blocked' && !showReschedule && (
          <div className="cal-detail-actions">
            <button
              className="button"
              onClick={() => removeBlocked((data as CalBlocked).id)}
              disabled={actionLoading}
              style={{ color: 'var(--amber)' }}
            >
              {actionLoading ? <Loader2 size={14} className="slots-spinner" /> : null}
              Remove blocked time
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="cal-shell">
      {/* Toolbar */}
      <div className="cal-toolbar">
        <div className="cal-toolbar-nav">
          <button className="cal-nav-btn" onClick={() => navigate(-1)}><ChevronLeft size={18} /></button>
          <span className="cal-nav-title">{navTitle()}</span>
          <button className="cal-nav-btn" onClick={() => navigate(1)}><ChevronRight size={18} /></button>
          <button className="button" style={{ fontSize: 13, minHeight: 34, padding: '0 12px' }} onClick={() => setCurrentDate(startOfDay(new Date()))}>
            Today
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="button"
            style={{ fontSize: 13, minHeight: 34, padding: '0 12px' }}
            onClick={() => { setShowBlockForm(!showBlockForm); setSelected(null); }}
          >
            <Plus size={14} /> Block time
          </button>
          <div className="cal-view-tabs">
            {(['month','week','day'] as View[]).map((v) => (
              <button
                key={v}
                className={`cal-view-tab${view === v ? ' cal-view-tab--active' : ''}`}
                onClick={() => setView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Block time form */}
      {showBlockForm && (
        <div className="cal-block-form">
          <strong style={{ fontSize: 13 }}>Block a time</strong>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 10 }}>
            <div className="cal-form-row" style={{ margin: 0 }}>
              <label>Date</label>
              <input type="date" className="form-input" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
            </div>
            <div className="cal-form-row" style={{ margin: 0 }}>
              <label>From</label>
              <input type="time" className="form-input" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} />
            </div>
            <div className="cal-form-row" style={{ margin: 0 }}>
              <label>To</label>
              <input type="time" className="form-input" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} />
            </div>
            <div className="cal-form-row" style={{ margin: 0 }}>
              <label>Label (optional)</label>
              <input type="text" className="form-input" placeholder="e.g. Out of town" value={blockLabel} onChange={(e) => setBlockLabel(e.target.value)} />
            </div>
            <button
              className="button button-primary"
              style={{ fontSize: 13, minHeight: 36, padding: '0 14px' }}
              onClick={saveBlockedTime}
              disabled={blockSaving || !blockDate || !blockStart || !blockEnd}
            >
              {blockSaving ? <Loader2 size={13} className="slots-spinner" /> : null}
              Save
            </button>
            <button className="button" style={{ fontSize: 13, minHeight: 36, padding: '0 12px' }} onClick={() => setShowBlockForm(false)}>
              Cancel
            </button>
          </div>
          {actionError && <p className="booking-error" style={{ marginTop: 8, marginBottom: 0 }}>{actionError}</p>}
        </div>
      )}

      {/* Legend */}
      <div className="cal-legend">
        <span className="cal-legend-item"><span className="cal-legend-dot cal-legend-dot--booking" />Confirmed</span>
        <span className="cal-legend-item"><span className="cal-legend-dot cal-legend-dot--request" />Pending request</span>
        <span className="cal-legend-item"><span className="cal-legend-dot cal-legend-dot--blocked" />Blocked</span>
      </div>

      <div className="cal-body">
        <div className="cal-main">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </div>
        {selected && (
          <div className="cal-detail-sidebar">
            {renderDetailPanel()}
          </div>
        )}
      </div>
    </div>
  );
}
