'use client';

import { useState } from 'react';

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbz8VuGJV5GiUb-kVISEhRBvqMTgPYkIvMntXdQnyXvVRTX67qxMco1D5zkK6uAoGjZI/exec';

export default function WaitlistForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [city, setCity] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Please enter your full name.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = 'Please enter a valid email address.';
    if (!discipline) errs.discipline = 'Please select your discipline.';
    if (!city.trim()) errs.city = 'Please enter your city.';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          name: name.trim(),
          email: email.trim(),
          discipline,
          city: city.trim(),
        }),
      });
    } catch {
      // no-cors means we can't read the response — treat as success
    }

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="waitlist__success" role="alert" aria-live="polite">
        <div className="waitlist__success__icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3>You&rsquo;re on the list!</h3>
        <p>We&rsquo;ll be in touch within 24 hours to set up your page. In the meantime, share this page with other professionals who could use a better front door.</p>
      </div>
    );
  }

  return (
    <form className="waitlist__form" onSubmit={handleSubmit} noValidate aria-label="Waitlist signup form">
      <div className="form-field">
        <label htmlFor="field-name">Full Name</label>
        <input
          type="text"
          id="field-name"
          name="name"
          placeholder="Your full name"
          autoComplete="name"
          value={name}
          onChange={e => setName(e.target.value)}
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <span className="error-msg visible">{errors.name}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="field-email">Email Address</label>
        <input
          type="email"
          id="field-email"
          name="email"
          placeholder="your@email.com"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="error-msg visible">{errors.email}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="field-discipline">Your Discipline</label>
        <div className="select-wrap">
          <select
            id="field-discipline"
            name="discipline"
            aria-required="true"
            value={discipline}
            onChange={e => setDiscipline(e.target.value)}
            className={errors.discipline ? 'error' : ''}
          >
            <option value="" disabled>Select your discipline</option>
            <option value="Golf Pro">Golf Pro</option>
            <option value="Swim Instructor">Swim Instructor</option>
            <option value="Music Teacher">Music Teacher</option>
            <option value="Personal Trainer">Personal Trainer</option>
            <option value="Tennis Instructor">Tennis Instructor</option>
            <option value="Yoga Instructor">Yoga Instructor</option>
            <option value="Martial Arts Instructor">Martial Arts Instructor</option>
            <option value="Tutor">Tutor</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {errors.discipline && <span className="error-msg visible">{errors.discipline}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="field-city">City</label>
        <input
          type="text"
          id="field-city"
          name="city"
          placeholder="City, State"
          autoComplete="address-level2"
          value={city}
          onChange={e => setCity(e.target.value)}
          className={errors.city ? 'error' : ''}
        />
        {errors.city && <span className="error-msg visible">{errors.city}</span>}
      </div>

      <button type="submit" className="waitlist__submit" disabled={loading}>
        {loading ? 'Submitting…' : 'Claim your free page →'}
      </button>
      <p className="waitlist__fine">No subscription. No setup fee. 10% per booking &mdash; that&rsquo;s it.</p>
    </form>
  );
}
