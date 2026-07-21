'use client';

import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import type { Service } from '@/types/sessionpro';

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise(resolve => { image.onload = resolve; });
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.92));
}

type Pro = {
  id: string;
  full_name: string;
  discipline: string;
  title: string | null;
  club_or_business: string | null;
  location_city: string | null;
  location_region: string | null;
  bio: string | null;
  years_experience: number | null;
  profile_photo_path: string | null;
  session_mode: 'in_person' | 'online' | 'hybrid';
  booking_mode: 'instant' | 'request';
};

type Props = {
  pro: Pro;
  services: Service[];
};

export function EditProfileForm({ pro, services }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ── Profile fields ──────────────────────────────────────────────
  const [fullName, setFullName] = useState(pro.full_name);
  const [discipline, setDiscipline] = useState(pro.discipline);
  const [title, setTitle] = useState(pro.title ?? '');
  const [club, setClub] = useState(pro.club_or_business ?? '');
  const [city, setCity] = useState(pro.location_city ?? '');
  const [region, setRegion] = useState(pro.location_region ?? '');
  const [bio, setBio] = useState(pro.bio ?? '');
  const [yearsExp, setYearsExp] = useState(pro.years_experience != null ? String(pro.years_experience) : '');
  const [sessionMode, setSessionMode] = useState(pro.session_mode);
  const [bookingMode, setBookingMode] = useState<'instant' | 'request'>(pro.booking_mode ?? 'request');

  const existingPhotoUrl = pro.profile_photo_path
    ? pro.profile_photo_path.startsWith('/')
      ? pro.profile_photo_path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pro-media/${pro.profile_photo_path}`
    : null;
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingPhotoUrl);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  // ── Pricing fields ──────────────────────────────────────────────
  type RefundTier = { hoursBefore: string; refundPercent: string };
  type LessonType = {
    name: string; price: string;
    cancellationWindowHours: string;
    cancellationRefundTiers: RefundTier[];
    rescheduleWindowHours: string;
    clientRescheduleLimit: string;
    noShowPolicy: 'forfeit' | 'credit';
  };
  const defaultPolicy = () => ({
    cancellationWindowHours: '24',
    cancellationRefundTiers: [{ hoursBefore: '0', refundPercent: '100' }],
    rescheduleWindowHours: '24',
    clientRescheduleLimit: '1',
    noShowPolicy: 'forfeit' as const,
  });
  const singles = services.filter(s => s.kind === 'single').sort((a, b) => a.sort_order - b.sort_order);
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>(
    singles.length > 0
      ? singles.map(s => ({
          name: s.level ?? s.name,
          price: String(s.price_cents / 100),
          cancellationWindowHours: String(s.cancellation_window_hours ?? 24),
          cancellationRefundTiers: (s.cancellation_refund_tiers?.length ? s.cancellation_refund_tiers : [{ hours_before: 0, refund_percent: 100 }])
            .map(t => ({ hoursBefore: String(t.hours_before), refundPercent: String(t.refund_percent) })),
          rescheduleWindowHours: String(s.reschedule_window_hours ?? 24),
          clientRescheduleLimit: String(s.client_reschedule_limit ?? 1),
          noShowPolicy: s.no_show_policy ?? 'forfeit',
        }))
      : [{ name: 'Beginner', price: '', ...defaultPolicy() }, { name: 'Advanced', price: '', ...defaultPolicy() }]
  );
  const [expandedPolicy, setExpandedPolicy] = useState<Record<number, boolean>>({});
  const [duration, setDuration] = useState(String(services[0]?.duration_minutes ?? 60));

  const [priceSaving, setPriceSaving] = useState(false);
  const [priceSaved, setPriceSaved] = useState(false);
  const [priceError, setPriceError] = useState('');

  // ── Photo handlers ──────────────────────────────────────────────
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropSrc(URL.createObjectURL(file));
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function applyCrop() {
    if (!cropSrc || !croppedAreaPixels) return;
    const blob = await getCroppedBlob(cropSrc, croppedAreaPixels);
    setPhotoFile(new File([blob], 'profile.jpg', { type: 'image/jpeg' }));
    setPhotoPreview(URL.createObjectURL(blob));
    setCropSrc(null);
  }

  // ── Save: profile ───────────────────────────────────────────────
  async function saveProfile() {
    setProfileError('');
    if (!fullName.trim() || !discipline.trim() || !city.trim() || !region.trim()) {
      setProfileError('Name, discipline, city, and state are required.');
      return;
    }
    setProfileSaving(true);

    const updates: Record<string, unknown> = {
      full_name: fullName.trim(),
      discipline: discipline.trim(),
      title: title.trim() || null,
      club_or_business: club.trim() || null,
      location_city: city.trim(),
      location_region: region.trim(),
      bio: bio.trim() || null,
      years_experience: yearsExp ? parseInt(yearsExp, 10) : null,
      session_mode: sessionMode,
      booking_mode: bookingMode,
    };

    if (photoFile) {
      const storagePath = `pros/${pro.id}/profile.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('pro-media')
        .upload(storagePath, photoFile, { upsert: true });
      if (uploadError) {
        setProfileError('Photo upload failed: ' + uploadError.message);
        setProfileSaving(false);
        return;
      }
      updates.profile_photo_path = storagePath;
    }

    const { error } = await supabase.from('pros').update(updates).eq('id', pro.id);
    if (error) {
      setProfileError(error.message);
    } else {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
    setProfileSaving(false);
  }

  // ── Save: pricing ───────────────────────────────────────────────
  async function savePricing() {
    setPriceError('');
    const durationMins = parseInt(duration, 10);

    for (const lt of lessonTypes) {
      if (!lt.name.trim()) { setPriceError('All lesson types need a name.'); return; }
      const p = parseInt(lt.price, 10);
      if (isNaN(p) || p <= 0) { setPriceError(`Enter a valid price for "${lt.name}".`); return; }
      const cancelWindow = parseInt(lt.cancellationWindowHours, 10);
      if (isNaN(cancelWindow) || cancelWindow < 0) { setPriceError(`Enter a valid cancellation window for "${lt.name}".`); return; }
      const rescheduleWindow = parseInt(lt.rescheduleWindowHours, 10);
      if (isNaN(rescheduleWindow) || rescheduleWindow < 0) { setPriceError(`Enter a valid reschedule window for "${lt.name}".`); return; }
      const rescheduleLimit = parseInt(lt.clientRescheduleLimit, 10);
      if (isNaN(rescheduleLimit) || rescheduleLimit < 0) { setPriceError(`Enter a valid reschedule limit for "${lt.name}".`); return; }
      if (lt.cancellationRefundTiers.length === 0) { setPriceError(`Add at least one refund tier for "${lt.name}".`); return; }
      for (const tier of lt.cancellationRefundTiers) {
        const hb = parseInt(tier.hoursBefore, 10);
        const rp = parseInt(tier.refundPercent, 10);
        if (isNaN(hb) || hb < 0) { setPriceError(`Enter a valid tier notice window for "${lt.name}".`); return; }
        if (isNaN(rp) || rp < 0 || rp > 100) { setPriceError(`Refund percent must be 0-100 for "${lt.name}".`); return; }
      }
    }
    if (isNaN(durationMins) || durationMins < 15 || durationMins > 480) {
      setPriceError('Session duration must be between 15 and 480 minutes.');
      return;
    }
    setPriceSaving(true);

    // Deactivate all existing services — historical booking records keep their UUID refs intact
    const { error: deactivateError } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('pro_id', pro.id);

    if (deactivateError) {
      setPriceError(deactivateError.message);
      setPriceSaving(false);
      return;
    }

    // Insert fresh services for each lesson type
    const rows = lessonTypes.flatMap((lt, i) => {
      const priceCents = parseInt(lt.price, 10) * 100;
      const sortBase = (i + 1) * 10;
      const name = lt.name.trim();
      const policy = {
        cancellation_window_hours: parseInt(lt.cancellationWindowHours, 10),
        cancellation_refund_tiers: lt.cancellationRefundTiers
          .map(t => ({ hours_before: parseInt(t.hoursBefore, 10), refund_percent: parseInt(t.refundPercent, 10) }))
          .sort((a, b) => b.hours_before - a.hours_before),
        reschedule_window_hours: parseInt(lt.rescheduleWindowHours, 10),
        client_reschedule_limit: parseInt(lt.clientRescheduleLimit, 10),
        no_show_policy: lt.noShowPolicy,
      };
      return [
        { pro_id: pro.id, kind: 'single',  name, level: name, session_count: 1,  duration_minutes: durationMins, buffer_minutes: 15, price_cents: priceCents,              compare_at_price_cents: null,          currency: 'usd', is_active: true, sort_order: sortBase,       ...policy },
        { pro_id: pro.id, kind: 'package', name: '5-Session Pack',  level: name, session_count: 5,  duration_minutes: durationMins, buffer_minutes: 15, price_cents: priceCents * 5  - 2500, compare_at_price_cents: priceCents * 5,  currency: 'usd', is_active: true, sort_order: sortBase + 100, ...policy },
        { pro_id: pro.id, kind: 'package', name: '10-Session Pack', level: name, session_count: 10, duration_minutes: durationMins, buffer_minutes: 15, price_cents: priceCents * 10 - 7500, compare_at_price_cents: priceCents * 10, currency: 'usd', is_active: true, sort_order: sortBase + 200, ...policy },
      ];
    });

    const { error: insertError } = await supabase.from('services').insert(rows);
    if (insertError) {
      setPriceError(insertError.message);
    } else {
      setPriceSaved(true);
      setTimeout(() => setPriceSaved(false), 3000);
    }
    setPriceSaving(false);
  }

  return (
    <>
      <div className="edit-page-header">
        <Link href="/dashboard" className="button" style={{ fontSize: 14, minHeight: 38, padding: '0 14px' }}>
          <ArrowLeft size={15} /> Dashboard
        </Link>
        <h1>Edit profile</h1>
      </div>

      {/* ── Profile ─────────────────────────────────────────────── */}
      <div className="dashboard-card" style={{ marginBottom: 16 }}>
        <h3>Profile info</h3>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label" htmlFor="ep-name">Full name *</label>
            <input id="ep-name" type="text" className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="ep-discipline">Discipline *</label>
            <input id="ep-discipline" type="text" className="form-input" value={discipline} onChange={e => setDiscipline(e.target.value)} />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label" htmlFor="ep-title">Title</label>
            <input id="ep-title" type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="ep-club">Club / Business</label>
            <input id="ep-club" type="text" className="form-input" value={club} onChange={e => setClub(e.target.value)} />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label" htmlFor="ep-city">City *</label>
            <input id="ep-city" type="text" className="form-input" value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="ep-region">State *</label>
            <input id="ep-region" type="text" className="form-input" value={region} onChange={e => setRegion(e.target.value)} />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label" htmlFor="ep-years">Years of experience</label>
            <input id="ep-years" type="number" min="0" max="60" className="form-input" value={yearsExp} onChange={e => setYearsExp(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Session format</label>
            <div className="session-mode-group">
              {(['in_person', 'online', 'hybrid'] as const).map(mode => (
                <label key={mode} className={`session-mode-option ${sessionMode === mode ? 'session-mode-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="session_mode"
                    value={mode}
                    checked={sessionMode === mode}
                    onChange={() => setSessionMode(mode)}
                    style={{ display: 'none' }}
                  />
                  {mode === 'in_person' ? 'In person' : mode === 'online' ? 'Online' : 'Both'}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Booking mode</label>
          <div className="session-mode-group">
            {(['request', 'instant'] as const).map(mode => (
              <label key={mode} className={`session-mode-option ${bookingMode === mode ? 'session-mode-option--active' : ''}`}>
                <input
                  type="radio"
                  name="booking_mode"
                  value={mode}
                  checked={bookingMode === mode}
                  onChange={() => setBookingMode(mode)}
                  style={{ display: 'none' }}
                />
                {mode === 'request' ? 'Request to book' : 'Instant book'}
              </label>
            ))}
          </div>
          <p style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-soft)' }}>
            {bookingMode === 'request'
              ? 'Clients request a time and you accept before payment is collected.'
              : 'Clients pay immediately without waiting for your approval.'}
          </p>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="ep-bio">Bio</label>
          <textarea id="ep-bio" className="form-input form-textarea" value={bio} onChange={e => setBio(e.target.value)} />
        </div>

        <div className="form-field">
          <label className="form-label">Profile photo</label>
          <div className="photo-upload-row">
            {photoPreview ? (
              <div className="photo-upload-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Preview" />
              </div>
            ) : (
              <div className="photo-upload-placeholder">
                {fullName ? fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
              </div>
            )}
            <div>
              <label htmlFor="ep-photo" className="button" style={{ cursor: 'pointer', fontSize: 14, minHeight: 38, padding: '0 16px' }}>
                {photoPreview ? 'Change photo' : 'Upload photo'}
              </label>
              <input id="ep-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} style={{ display: 'none' }} />
              <p style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-soft)' }}>JPEG, PNG or WebP · Max 5 MB</p>
            </div>
          </div>
        </div>

        {profileError && <div className="form-error">{profileError}</div>}

        <div className="edit-save-row">
          {profileSaved && (
            <span className="edit-saved-label">
              <CheckCircle2 size={15} /> Saved
            </span>
          )}
          <button className="button button-primary" onClick={saveProfile} disabled={profileSaving} style={{ minWidth: 130 }}>
            {profileSaving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>

      {/* ── Availability ─────────────────────────────────────────── */}
      <div className="dashboard-card" style={{ marginBottom: 16 }}>
        <h3>Availability</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: -4, marginBottom: 20 }}>
          Set your weekly hours and override specific dates from the Schedule page.
        </p>
        <Link href="/dashboard/schedule" className="button button-primary" style={{ display: 'inline-flex', fontSize: 14, minHeight: 38, padding: '0 16px' }}>
          Manage Schedule
        </Link>
      </div>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <div className="dashboard-card">
        <h3>Pricing</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: -4, marginBottom: 20 }}>
          5-session and 10-session packs are calculated automatically from the single lesson price.
        </p>

        <div className="form-field">
          <div className="lesson-types-header">
            <label className="form-label" style={{ margin: 0 }}>Lesson types</label>
            <span className="form-label" style={{ margin: 0, color: 'var(--ink-soft)', fontWeight: 400 }}>Price per session</span>
          </div>
          <div className="lesson-types-list">
            {lessonTypes.map((lt, i) => (
              <div key={i}>
                <div className="lesson-type-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Beginner, Intermediate…"
                    value={lt.name}
                    onChange={e => setLessonTypes(prev => prev.map((t, j) => j === i ? { ...t, name: e.target.value } : t))}
                  />
                  <div className="price-input-wrap lesson-type-price">
                    <span className="price-prefix">$</span>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      placeholder="0"
                      value={lt.price}
                      onChange={e => setLessonTypes(prev => prev.map((t, j) => j === i ? { ...t, price: e.target.value } : t))}
                    />
                  </div>
                  <button
                    type="button"
                    className="lesson-type-policy-toggle"
                    onClick={() => setExpandedPolicy(prev => ({ ...prev, [i]: !prev[i] }))}
                    aria-expanded={!!expandedPolicy[i]}
                  >
                    {expandedPolicy[i] ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Policy
                  </button>
                  <button
                    type="button"
                    className="lesson-type-remove"
                    onClick={() => setLessonTypes(prev => prev.filter((_, j) => j !== i))}
                    disabled={lessonTypes.length === 1}
                    aria-label="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {expandedPolicy[i] && (
                  <div className="lesson-type-policy-panel">
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label className="form-label">Cancellation window (hours before session)</label>
                        <input
                          type="number" min="0" className="form-input" value={lt.cancellationWindowHours}
                          onChange={e => setLessonTypes(prev => prev.map((t, j) => j === i ? { ...t, cancellationWindowHours: e.target.value } : t))}
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Client reschedule limit (per booking)</label>
                        <input
                          type="number" min="0" className="form-input" value={lt.clientRescheduleLimit}
                          onChange={e => setLessonTypes(prev => prev.map((t, j) => j === i ? { ...t, clientRescheduleLimit: e.target.value } : t))}
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-field">
                        <label className="form-label">Reschedule window (hours before session)</label>
                        <input
                          type="number" min="0" className="form-input" value={lt.rescheduleWindowHours}
                          onChange={e => setLessonTypes(prev => prev.map((t, j) => j === i ? { ...t, rescheduleWindowHours: e.target.value } : t))}
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label">No-show handling</label>
                        <div className="session-mode-group">
                          {(['forfeit', 'credit'] as const).map(policy => (
                            <label key={policy} className={`session-mode-option ${lt.noShowPolicy === policy ? 'session-mode-option--active' : ''}`}>
                              <input
                                type="radio" name={`no-show-${i}`} value={policy} checked={lt.noShowPolicy === policy}
                                onChange={() => setLessonTypes(prev => prev.map((t, j) => j === i ? { ...t, noShowPolicy: policy } : t))}
                                style={{ display: 'none' }}
                              />
                              {policy === 'forfeit' ? 'No refund' : 'Make-up credit'}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="form-label" style={{ marginBottom: 4 }}>Refund schedule</label>
                      <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: -2, marginBottom: 4 }}>
                        Refund % applied based on notice given. Highest matching threshold wins.
                      </p>
                      {lt.cancellationRefundTiers.map((tier, ti) => (
                        <div key={ti} className="policy-tier-row">
                          <span style={{ fontSize: 13, color: 'var(--ink-soft)', flexShrink: 0 }}>≥</span>
                          <input
                            type="number" min="0" className="form-input" placeholder="Hours before"
                            value={tier.hoursBefore}
                            onChange={e => setLessonTypes(prev => prev.map((t, j) => j === i
                              ? { ...t, cancellationRefundTiers: t.cancellationRefundTiers.map((tr, k) => k === ti ? { ...tr, hoursBefore: e.target.value } : tr) }
                              : t))}
                          />
                          <span style={{ fontSize: 13, color: 'var(--ink-soft)', flexShrink: 0 }}>hrs →</span>
                          <div className="price-input-wrap lesson-type-price">
                            <input
                              type="number" min="0" max="100" className="form-input" placeholder="100"
                              value={tier.refundPercent}
                              onChange={e => setLessonTypes(prev => prev.map((t, j) => j === i
                                ? { ...t, cancellationRefundTiers: t.cancellationRefundTiers.map((tr, k) => k === ti ? { ...tr, refundPercent: e.target.value } : tr) }
                                : t))}
                            />
                            <span className="price-prefix" style={{ left: 'auto', right: 10 }}>%</span>
                          </div>
                          <button
                            type="button"
                            className="lesson-type-remove"
                            onClick={() => setLessonTypes(prev => prev.map((t, j) => j === i
                              ? { ...t, cancellationRefundTiers: t.cancellationRefundTiers.filter((_, k) => k !== ti) }
                              : t))}
                            disabled={lt.cancellationRefundTiers.length === 1}
                            aria-label="Remove tier"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      {lt.cancellationRefundTiers.length < 4 && (
                        <button
                          type="button"
                          className="button"
                          style={{ marginTop: 4, fontSize: 13, minHeight: 32, padding: '0 12px', alignSelf: 'flex-start' }}
                          onClick={() => setLessonTypes(prev => prev.map((t, j) => j === i
                            ? { ...t, cancellationRefundTiers: [...t.cancellationRefundTiers, { hoursBefore: '', refundPercent: '' }] }
                            : t))}
                        >
                          <Plus size={13} /> Add tier
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {lessonTypes.length < 4 && (
            <button
              type="button"
              className="button"
              style={{ marginTop: 10, fontSize: 13, minHeight: 36, padding: '0 14px' }}
              onClick={() => setLessonTypes(prev => [...prev, { name: '', price: '', ...defaultPolicy() }])}
            >
              <Plus size={14} /> Add lesson type
            </button>
          )}
        </div>

        <div className="form-grid-2" style={{ marginTop: 8 }}>
          <div className="form-field">
            <label className="form-label" htmlFor="ep-duration">Session duration (minutes)</label>
            <input id="ep-duration" type="number" min="15" max="480" step="15" className="form-input" value={duration} onChange={e => setDuration(e.target.value)} />
          </div>
        </div>

        {lessonTypes.some(lt => parseInt(lt.price) > 0 && lt.name) && (
          <div className="slug-preview" style={{ lineHeight: 2, marginTop: 16 }}>
            <strong>Packages on save:</strong>
            {lessonTypes.map((lt, i) => {
              const p = parseInt(lt.price || '0');
              if (!p || !lt.name.trim()) return null;
              return <div key={i}>{lt.name}: 5-pack ${p * 5 - 25} · 10-pack ${p * 10 - 75} (save $25 / $75)</div>;
            })}
          </div>
        )}

        {priceError && <div className="form-error">{priceError}</div>}

        <div className="edit-save-row">
          {priceSaved && (
            <span className="edit-saved-label">
              <CheckCircle2 size={15} /> Saved
            </span>
          )}
          <button className="button button-primary" onClick={savePricing} disabled={priceSaving} style={{ minWidth: 130 }}>
            {priceSaving ? 'Saving…' : 'Save pricing'}
          </button>
        </div>
      </div>

      {/* ── Crop modal ───────────────────────────────────────────── */}
      {cropSrc && (
        <div className="crop-modal-overlay">
          <div className="crop-modal">
            <div className="crop-modal-header">Adjust your photo</div>
            <div className="crop-area">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="crop-controls">
              <div className="crop-zoom-row">
                <label>Zoom</label>
                <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(Number(e.target.value))} />
              </div>
              <div className="crop-actions">
                <button className="button" onClick={() => setCropSrc(null)}>Cancel</button>
                <button className="button button-primary" onClick={applyCrop}>Apply crop</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
