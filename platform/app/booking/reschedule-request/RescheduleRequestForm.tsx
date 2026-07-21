'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { BookingCalendar } from '@/app/[slug]/BookingCalendar';
import type { AvailabilityRule } from '@/types/sessionpro';

type Props = {
  bookingId: string;
  proId: string;
  timezone: string;
  availability: AvailabilityRule[];
  durationMinutes: number;
  bufferMinutes: number;
};

export function RescheduleRequestForm({ bookingId, proId, timezone, availability, durationMinutes, bufferMinutes }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit() {
    if (!selectedDate || !selectedTime) return;
    setState('loading');
    const dateStr = [
      selectedDate.getFullYear(),
      String(selectedDate.getMonth() + 1).padStart(2, '0'),
      String(selectedDate.getDate()).padStart(2, '0'),
    ].join('-');
    try {
      const res = await fetch(`/api/bookings/${bookingId}/reschedule-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, timeSlot: selectedTime, reason: reason.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(body.error ?? 'Something went wrong. Please try again.');
        setState('error');
        return;
      }
      setState('sent');
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <p style={{ color: '#374151', margin: '16px 0' }}>
        Your reschedule request has been sent. You&rsquo;ll get an email once your instructor responds — your original time stays confirmed until then.
      </p>
    );
  }

  return (
    <div style={{ width: '100%', textAlign: 'left', margin: '16px 0' }}>
      <BookingCalendar
        proId={proId}
        timezone={timezone}
        availability={availability}
        durationMinutes={durationMinutes}
        bufferMinutes={bufferMinutes}
        onDateSelect={date => { setSelectedDate(date); setSelectedTime(null); }}
        onTimeSelect={time => setSelectedTime(time)}
      />

      <div className="form-field" style={{ marginTop: 12 }}>
        <label className="form-label" htmlFor="reschedule-reason">Reason (optional)</label>
        <textarea
          id="reschedule-reason"
          className="form-input form-textarea"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Let your instructor know why you need to reschedule…"
        />
      </div>

      {state === 'error' && (
        <p style={{ color: '#dc2626', fontSize: 14, marginTop: 8 }}>{errorMsg}</p>
      )}

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          className="button button-primary"
          onClick={handleSubmit}
          disabled={!selectedDate || !selectedTime || state === 'loading'}
        >
          {state === 'loading' ? <><Loader2 size={15} className="slots-spinner" /> Sending…</> : 'Request this time'}
        </button>
      </div>
    </div>
  );
}
