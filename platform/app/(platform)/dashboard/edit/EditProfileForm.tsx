'use client';

import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import type { AvailabilityRule, Service } from '@/types/sessionpro';

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

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

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
};

type Props = {
  pro: Pro;
  availability: AvailabilityRule[];
  services: Service[];
};

export function EditProfileForm({ pro, availability, services }: Props) {
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

  // ── Availability fields ─────────────────────────────────────────
  const [days, setDays] = useState<string[]>(availability.map(r => r.day));
  const [startTime, setStartTime] = useState(availability[0]?.start_time?.slice(0, 5) ?? '08:00');
  const [endTime, setEndTime] = useState(availability[0]?.end_time?.slice(0, 5) ?? '18:00');

  const [availSaving, setAvailSaving] = useState(false);
  const [availSaved, setAvailSaved] = useState(false);
  const [availError, setAvailError] = useState('');

  // ── Pricing fields ──────────────────────────────────────────────
  const beginnerService = services.find(s => s.sort_order === 10);
  const advancedService = services.find(s => s.sort_order === 20);
  const [beginnerPrice, setBeginnerPrice] = useState(
    beginnerService ? String(beginnerService.price_cents / 100) : ''
  );
  const [advancedPrice, setAdvancedPrice] = useState(
    advancedService ? String(advancedService.price_cents / 100) : ''
  );

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

  function toggleDay(day: string) {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
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
    };

    if (photoFile) {
      const storagePath = `pros/${pro.id}/profile.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('pro-media')
        .upload(storagePath, photoFile, { upsert: true });
      if (!uploadError) updates.profile_photo_path = storagePath;
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

  // ── Save: availability ──────────────────────────────────────────
  async function saveAvailability() {
    setAvailError('');
    if (days.length === 0) {
      setAvailError('Select at least one day.');
      return;
    }
    setAvailSaving(true);

    const { error: delError } = await supabase
      .from('availability_rules')
      .delete()
      .eq('pro_id', pro.id);

    if (delError) {
      setAvailError(delError.message);
      setAvailSaving(false);
      return;
    }

    const { error: insError } = await supabase
      .from('availability_rules')
      .insert(days.map(day => ({
        pro_id: pro.id,
        day,
        start_time: startTime,
        end_time: endTime,
        is_active: true,
      })));

    if (insError) {
      setAvailError(insError.message);
    } else {
      setAvailSaved(true);
      setTimeout(() => setAvailSaved(false), 3000);
    }
    setAvailSaving(false);
  }

  // ── Save: pricing ───────────────────────────────────────────────
  async function savePricing() {
    setPriceError('');
    const bPrice = parseInt(beginnerPrice, 10);
    const aPrice = parseInt(advancedPrice, 10);
    if (isNaN(bPrice) || isNaN(aPrice) || bPrice <= 0 || aPrice <= 0) {
      setPriceError('Enter valid prices for both session types.');
      return;
    }
    setPriceSaving(true);

    const bCents = bPrice * 100;
    const aCents = aPrice * 100;

    const serviceUpdates = [
      { sort_order: 10, price_cents: bCents,           compare_at_price_cents: null },
      { sort_order: 20, price_cents: aCents,           compare_at_price_cents: null },
      { sort_order: 30, price_cents: bCents * 5 - 2500, compare_at_price_cents: bCents * 5 },
      { sort_order: 40, price_cents: aCents * 5 - 2500, compare_at_price_cents: aCents * 5 },
      { sort_order: 50, price_cents: bCents * 10 - 7500, compare_at_price_cents: bCents * 10 },
      { sort_order: 60, price_cents: aCents * 10 - 7500, compare_at_price_cents: aCents * 10 },
    ];

    const results = await Promise.all(
      serviceUpdates.map(({ sort_order, price_cents, compare_at_price_cents }) =>
        supabase
          .from('services')
          .update({ price_cents, compare_at_price_cents })
          .eq('pro_id', pro.id)
          .eq('sort_order', sort_order)
      )
    );

    const firstError = results.find(r => r.error)?.error;
    if (firstError) {
      setPriceError(firstError.message);
    } else {
      setPriceSaved(true);
      setTimeout(() => setPriceSaved(false), 3000);
    }
    setPriceSaving(false);
  }

  const bNum = parseInt(beginnerPrice || '0');
  const aNum = parseInt(advancedPrice || '0');

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
          Changes take effect immediately on your public page.
        </p>

        <div className="form-field">
          <label className="form-label">Available days</label>
          <div className="day-checkboxes">
            {DAYS.map(d => (
              <div key={d.key} className="day-chip">
                <input
                  type="checkbox"
                  id={`ep-day-${d.key}`}
                  checked={days.includes(d.key)}
                  onChange={() => toggleDay(d.key)}
                />
                <label htmlFor={`ep-day-${d.key}`}>{d.label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label" htmlFor="ep-start">Start time</label>
            <input id="ep-start" type="time" className="form-input" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="ep-end">End time</label>
            <input id="ep-end" type="time" className="form-input" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>

        {availError && <div className="form-error">{availError}</div>}

        <div className="edit-save-row">
          {availSaved && (
            <span className="edit-saved-label">
              <CheckCircle2 size={15} /> Saved
            </span>
          )}
          <button className="button button-primary" onClick={saveAvailability} disabled={availSaving} style={{ minWidth: 155 }}>
            {availSaving ? 'Saving…' : 'Save availability'}
          </button>
        </div>
      </div>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <div className="dashboard-card">
        <h3>Pricing</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: -4, marginBottom: 20 }}>
          Package prices are recalculated automatically when you save.
        </p>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label" htmlFor="ep-beginner">Beginner lesson</label>
            <div className="price-input-wrap">
              <span className="price-prefix">$</span>
              <input id="ep-beginner" type="number" className="form-input" min="1" value={beginnerPrice} onChange={e => setBeginnerPrice(e.target.value)} />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="ep-advanced">Advanced lesson</label>
            <div className="price-input-wrap">
              <span className="price-prefix">$</span>
              <input id="ep-advanced" type="number" className="form-input" min="1" value={advancedPrice} onChange={e => setAdvancedPrice(e.target.value)} />
            </div>
          </div>
        </div>

        {bNum > 0 && aNum > 0 && (
          <div className="slug-preview" style={{ lineHeight: 1.9 }}>
            <strong>Packages updated on save:</strong><br />
            5-Session Pack: ${bNum * 5 - 25} Beginner · ${aNum * 5 - 25} Advanced (save $25)<br />
            10-Session Pack: ${bNum * 10 - 75} Beginner · ${aNum * 10 - 75} Advanced (save $75)
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
