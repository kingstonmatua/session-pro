'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1 — Profile
  const [fullName, setFullName] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [title, setTitle] = useState('');
  const [club, setClub] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Step 2 — Availability
  const [days, setDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');

  // Step 3 — Pricing
  const [beginnerPrice, setBeginnerPrice] = useState('');
  const [advancedPrice, setAdvancedPrice] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const slug = generateSlug(fullName);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function toggleDay(day: string) {
    setDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  function nextStep() {
    setError('');

    if (step === 1) {
      if (!fullName.trim() || !discipline.trim() || !city.trim() || !region.trim()) {
        setError('Please fill in your name, discipline, and location.');
        return;
      }
      if (slug.length < 3) {
        setError('Your name must be at least 3 characters to generate a valid profile URL.');
        return;
      }
    }

    if (step === 2) {
      if (days.length === 0) {
        setError('Select at least one availability day.');
        return;
      }
    }

    setStep(s => s + 1);
  }

  async function handleSubmit() {
    setError('');

    const bPrice = parseInt(beginnerPrice, 10);
    const aPrice = parseInt(advancedPrice, 10);

    if (!beginnerPrice || !advancedPrice || isNaN(bPrice) || isNaN(aPrice) || bPrice <= 0 || aPrice <= 0) {
      setError('Enter valid prices for both session types.');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Session expired. Please log in again.');
      setLoading(false);
      return;
    }

    // Insert pro profile
    const { data: pro, error: proError } = await supabase
      .from('pros')
      .insert({
        user_id: user.id,
        slug,
        full_name: fullName.trim(),
        discipline: discipline.trim(),
        title: title.trim() || null,
        club_or_business: club.trim() || null,
        bio: bio.trim() || null,
        location_city: city.trim(),
        location_region: region.trim(),
        status: 'active',
      })
      .select('id')
      .single();

    if (proError) {
      setError(proError.message.includes('duplicate') ? 'That profile URL is already taken. Try a different name.' : proError.message);
      setLoading(false);
      return;
    }

    const proId = pro.id;

    // Upload profile photo if provided
    if (photoFile) {
      const ext = photoFile.name.split('.').pop() ?? 'jpg';
      const storagePath = `pros/${proId}/profile.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('pro-media')
        .upload(storagePath, photoFile, { upsert: true });

      if (!uploadError) {
        await supabase.from('pros').update({ profile_photo_path: storagePath }).eq('id', proId);
      }
    }

    // Insert availability rules
    const availabilityRows = days.map(day => ({
      pro_id: proId,
      day,
      start_time: startTime,
      end_time: endTime,
      is_active: true,
    }));

    const { error: availError } = await supabase.from('availability_rules').insert(availabilityRows);
    if (availError) {
      setError(availError.message);
      setLoading(false);
      return;
    }

    // Insert services — single sessions + packages
    const bCents = bPrice * 100;
    const aCents = aPrice * 100;

    const services = [
      { pro_id: proId, kind: 'single', name: 'Beginner lesson', level: 'Beginner', session_count: 1, duration_minutes: 60, buffer_minutes: 15, price_cents: bCents, compare_at_price_cents: null, sort_order: 10 },
      { pro_id: proId, kind: 'single', name: 'Advanced lesson', level: 'Advanced', session_count: 1, duration_minutes: 60, buffer_minutes: 15, price_cents: aCents, compare_at_price_cents: null, sort_order: 20 },
      { pro_id: proId, kind: 'package', name: '5-Session Pack', level: 'Beginner', session_count: 5, duration_minutes: 60, buffer_minutes: 15, price_cents: bCents * 5 - 2500, compare_at_price_cents: bCents * 5, sort_order: 30 },
      { pro_id: proId, kind: 'package', name: '5-Session Pack', level: 'Advanced', session_count: 5, duration_minutes: 60, buffer_minutes: 15, price_cents: aCents * 5 - 2500, compare_at_price_cents: aCents * 5, sort_order: 40 },
      { pro_id: proId, kind: 'package', name: '10-Session Pack', level: 'Beginner', session_count: 10, duration_minutes: 60, buffer_minutes: 15, price_cents: bCents * 10 - 7500, compare_at_price_cents: bCents * 10, sort_order: 50 },
      { pro_id: proId, kind: 'package', name: '10-Session Pack', level: 'Advanced', session_count: 10, duration_minutes: 60, buffer_minutes: 15, price_cents: aCents * 10 - 7500, compare_at_price_cents: aCents * 10, sort_order: 60 },
    ];

    const { error: servicesError } = await supabase.from('services').insert(services);
    if (servicesError) {
      setError(servicesError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  const steps = [
    { n: 1, label: 'Your profile' },
    { n: 2, label: 'Availability' },
    { n: 3, label: 'Pricing' },
  ];

  return (
    <div className="onboarding-shell">
      <div className="onboarding-inner">

        {/* Steps indicator */}
        <div className="steps-bar">
          {steps.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className={`step-dot ${step === s.n ? 'active' : step > s.n ? 'done' : ''}`}>
                  {step > s.n ? <Check size={13} /> : s.n}
                </div>
                <span className={`step-label ${step === s.n ? 'active' : ''}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`step-connector ${step > s.n ? 'done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Profile */}
        {step === 1 && (
          <div className="onboarding-card">
            <h2>Tell us about yourself</h2>
            <p>This appears on your public booking page.</p>

            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-label" htmlFor="fullName">Full name *</label>
                <input id="fullName" type="text" className="form-input" placeholder="Kenyon Matua" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="discipline">Discipline *</label>
                <input id="discipline" type="text" className="form-input" placeholder="Golf Instruction" value={discipline} onChange={e => setDiscipline(e.target.value)} />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-label" htmlFor="title">Title</label>
                <input id="title" type="text" className="form-input" placeholder="PGA Teaching Professional" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="club">Club / Business</label>
                <input id="club" type="text" className="form-input" placeholder="Alpine Country Club" value={club} onChange={e => setClub(e.target.value)} />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-label" htmlFor="city">City *</label>
                <input id="city" type="text" className="form-input" placeholder="Highland" value={city} onChange={e => setCity(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="region">State *</label>
                <input id="region" type="text" className="form-input" placeholder="UT" value={region} onChange={e => setRegion(e.target.value)} />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="bio">Bio</label>
              <textarea id="bio" className="form-input form-textarea" placeholder="Tell clients about your background and coaching style…" value={bio} onChange={e => setBio(e.target.value)} />
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
                  <label htmlFor="photo" className="button" style={{ cursor: 'pointer', fontSize: 14, minHeight: 38, padding: '0 16px' }}>
                    {photoPreview ? 'Change photo' : 'Upload photo'}
                  </label>
                  <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} style={{ display: 'none' }} />
                  <p style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-soft)' }}>JPEG, PNG or WebP · Max 5 MB · Optional</p>
                </div>
              </div>
            </div>

            {fullName.length >= 3 && (
              <div className="slug-preview">
                Your public URL: <strong>sessionpro.io/{slug}</strong>
              </div>
            )}

            {error && <div className="form-error">{error}</div>}

            <div className="onboarding-actions">
              <span />
              <button className="button button-primary" onClick={nextStep}>
                Next: Availability &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Availability */}
        {step === 2 && (
          <div className="onboarding-card">
            <h2>When are you available?</h2>
            <p>Set the days and hours clients can book with you.</p>

            <div className="form-field">
              <label className="form-label">Available days</label>
              <div className="day-checkboxes">
                {DAYS.map(d => (
                  <div key={d.key} className="day-chip">
                    <input
                      type="checkbox"
                      id={`day-${d.key}`}
                      checked={days.includes(d.key)}
                      onChange={() => toggleDay(d.key)}
                    />
                    <label htmlFor={`day-${d.key}`}>{d.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-label" htmlFor="startTime">Start time</label>
                <input id="startTime" type="time" className="form-input" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="endTime">End time</label>
                <input id="endTime" type="time" className="form-input" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="onboarding-actions">
              <button className="button" onClick={() => setStep(1)}>&larr; Back</button>
              <button className="button button-primary" onClick={nextStep}>
                Next: Pricing &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Pricing */}
        {step === 3 && (
          <div className="onboarding-card">
            <h2>Set your session prices</h2>
            <p>We&rsquo;ll automatically create single session and package options for you.</p>

            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-label" htmlFor="beginnerPrice">Beginner lesson</label>
                <div className="price-input-wrap">
                  <span className="price-prefix">$</span>
                  <input id="beginnerPrice" type="number" className="form-input" placeholder="80" min="1" value={beginnerPrice} onChange={e => setBeginnerPrice(e.target.value)} />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="advancedPrice">Advanced lesson</label>
                <div className="price-input-wrap">
                  <span className="price-prefix">$</span>
                  <input id="advancedPrice" type="number" className="form-input" placeholder="100" min="1" value={advancedPrice} onChange={e => setAdvancedPrice(e.target.value)} />
                </div>
              </div>
            </div>

            {beginnerPrice && advancedPrice && (
              <div className="slug-preview" style={{ lineHeight: 1.8 }}>
                <strong>Packages generated automatically:</strong><br />
                5-Session Pack: ${parseInt(beginnerPrice || '0') * 5 - 25} Beginner / ${parseInt(advancedPrice || '0') * 5 - 25} Advanced (save $25)<br />
                10-Session Pack: ${parseInt(beginnerPrice || '0') * 10 - 75} Beginner / ${parseInt(advancedPrice || '0') * 10 - 75} Advanced (save $75)
              </div>
            )}

            {error && <div className="form-error">{error}</div>}

            <div className="onboarding-actions">
              <button className="button" onClick={() => setStep(2)}>&larr; Back</button>
              <button className="button button-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Setting up your page…' : 'Launch my page →'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
