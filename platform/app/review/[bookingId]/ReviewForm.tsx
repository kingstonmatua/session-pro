'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

type Props = {
  bookingId: string;
  proName: string;
  defaultName: string;
  proSlug: string;
};

export function ReviewForm({ bookingId, proName, defaultName, proSlug }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [quote, setQuote] = useState('');
  const [reviewerName, setReviewerName] = useState(defaultName);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { setError('Please select a star rating.'); return; }

    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, rating, quote, reviewerName }),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="review-success">
        <div className="review-success-stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={28} fill={n <= rating ? '#D97706' : 'none'} color="#D97706" />
          ))}
        </div>
        <h2>Thanks for your feedback!</h2>
        <p>Your review has been submitted and will appear on {proName}&rsquo;s profile once approved.</p>
        <a href={`/${proSlug}`} className="button button-primary">
          Back to profile
        </a>
      </div>
    );
  }

  const display = hovered || rating;

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <div className="review-star-picker">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="review-star-btn"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n !== 1 ? 's' : ''}`}
          >
            <Star
              size={36}
              fill={n <= display ? '#D97706' : 'none'}
              color={n <= display ? '#D97706' : '#d1d5db'}
            />
          </button>
        ))}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="review-quote">
          Your review <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>(optional)</span>
        </label>
        <textarea
          id="review-quote"
          className="form-input"
          rows={4}
          placeholder={`How was your session with ${proName}?`}
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          maxLength={600}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="reviewer-name">Your name</label>
        <input
          id="reviewer-name"
          type="text"
          className="form-input"
          placeholder="Your name"
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          maxLength={80}
        />
      </div>

      {error && <p className="booking-error">{error}</p>}

      <button
        type="submit"
        className="button button-primary"
        disabled={submitting || !rating}
        style={{ width: '100%' }}
      >
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
}
