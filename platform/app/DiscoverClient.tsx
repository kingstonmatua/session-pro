'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Search, CalendarCheck, CircleCheck } from 'lucide-react';
import { useState, useMemo } from 'react';

export type ProListing = {
  id: string;
  slug: string;
  full_name: string;
  discipline: string | null;
  location_city: string | null;
  location_region: string | null;
  profile_photo_path: string | null;
  rating_average: number | null;
  rating_count: number;
  starting_price_cents: number | null;
};

type PriceRange = 'any' | 'under-75' | '75-125' | '125-200' | '200+';

const PRICE_RANGES: { value: PriceRange; label: string }[] = [
  { value: 'any',      label: 'Any price' },
  { value: 'under-75', label: 'Under $75' },
  { value: '75-125',   label: '$75 – $125' },
  { value: '125-200',  label: '$125 – $200' },
  { value: '200+',     label: '$200+' },
];

function matchesPrice(cents: number | null, range: PriceRange): boolean {
  if (range === 'any') return true;
  if (cents === null) return false;
  const d = cents / 100;
  switch (range) {
    case 'under-75':  return d < 75;
    case '75-125':    return d >= 75 && d <= 125;
    case '125-200':   return d > 125 && d <= 200;
    case '200+':      return d > 200;
  }
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getPhotoUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('/')) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pro-media/${path}`;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

const HOW_IT_WORKS = [
  {
    icon: <Search size={22} strokeWidth={2} />,
    title: 'Find your instructor',
    description: 'Filter by discipline, location, and price to find the right fit for you.',
  },
  {
    icon: <CalendarCheck size={22} strokeWidth={2} />,
    title: 'Book in minutes',
    description: 'Pick a time that works, pay securely, and get an instant confirmation.',
  },
  {
    icon: <CircleCheck size={22} strokeWidth={2} />,
    title: 'Show up and learn',
    description: "We'll send reminders before your session. Just bring your A-game.",
  },
];

function HowItWorks() {
  return (
    <section className="hiw-strip">
      <div className="hiw-strip-inner">
        {HOW_IT_WORKS.map((step, i) => (
          <div key={i} className="hiw-strip-step">
            <div className="hiw-strip-icon">{step.icon}</div>
            <div className="hiw-strip-text">
              <p className="hiw-strip-title">{step.title}</p>
              <p className="hiw-strip-desc">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProCard({ pro }: { pro: ProListing }) {
  const photoUrl = getPhotoUrl(pro.profile_photo_path);
  const location = [pro.location_city, pro.location_region].filter(Boolean).join(', ');

  return (
    <Link href={`/${pro.slug}`} className="pro-card">
      <div className="pro-card__photo-wrap">
        {photoUrl ? (
          <Image src={photoUrl} alt={pro.full_name} width={400} height={300} className="pro-card__photo" />
        ) : (
          <div className="pro-card__photo-fallback">{getInitials(pro.full_name)}</div>
        )}
      </div>
      <div className="pro-card__body">
        <p className="pro-card__name">{pro.full_name}</p>
        {pro.discipline && <p className="pro-card__discipline">{pro.discipline}</p>}
        {location && (
          <p className="pro-card__location">
            <MapPin size={12} />
            {location}
          </p>
        )}
        <div className="pro-card__meta">
          {pro.rating_count > 0 ? (
            <span className="pro-card__rating">
              <Star size={12} fill="#f59e0b" color="#f59e0b" />
              {pro.rating_average?.toFixed(1)}{' '}
              <span className="pro-card__rating-count">({pro.rating_count})</span>
            </span>
          ) : <span />}
          {pro.starting_price_cents != null && (
            <span className="pro-card__price">From {formatPrice(pro.starting_price_cents)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function DiscoverClient({ pros }: { pros: ProListing[] }) {
  const [discipline, setDiscipline] = useState('any');
  const [location, setLocation]     = useState('any');
  const [priceRange, setPriceRange] = useState<PriceRange>('any');

  const disciplineOptions = useMemo(() => {
    const seen = new Set<string>();
    pros.forEach((p) => { if (p.discipline) seen.add(p.discipline); });
    return [
      { value: 'any', label: 'All disciplines' },
      ...Array.from(seen).sort().map((d) => ({ value: d, label: d })),
    ];
  }, [pros]);

  const locationOptions = useMemo(() => {
    const seen = new Set<string>();
    pros.forEach((p) => {
      const key = [p.location_city, p.location_region].filter(Boolean).join(', ');
      if (key) seen.add(key);
    });
    return [
      { value: 'any', label: 'Anywhere' },
      ...Array.from(seen).sort().map((l) => ({ value: l, label: l })),
    ];
  }, [pros]);

  const filtered = useMemo(() => {
    return pros.filter((p) => {
      if (discipline !== 'any' && p.discipline !== discipline) return false;
      if (location !== 'any') {
        const loc = [p.location_city, p.location_region].filter(Boolean).join(', ');
        if (loc !== location) return false;
      }
      if (!matchesPrice(p.starting_price_cents, priceRange)) return false;
      return true;
    });
  }, [pros, discipline, location, priceRange]);

  const hasActiveFilter = discipline !== 'any' || location !== 'any' || priceRange !== 'any';

  function clearFilters() {
    setDiscipline('any');
    setLocation('any');
    setPriceRange('any');
  }

  const disciplineLabel = discipline === 'any' ? 'All disciplines' : discipline;
  const locationLabel   = location   === 'any' ? 'Anywhere'        : location;
  const priceLabel      = PRICE_RANGES.find((r) => r.value === priceRange)?.label ?? 'Any price';

  return (
    <div className="discover-page">
      {/* Nav */}
      <nav className="discover-nav">
        <div className="discover-nav-inner">
          <Link href="/">
            <Image src="/images/logo-nav.png" alt="SessionPro" width={911} height={270} className="discover-nav-logo" priority />
          </Link>
          <div className="discover-nav-links">
            <Link href="/for-pros" className="discover-nav-pro-link">For pros</Link>
            <Link href="/auth/login" className="discover-nav-login">Log in</Link>
            <Link href="/auth/signup" className="discover-nav-cta">Claim your page</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="discover-hero">
        <div className="discover-hero-inner">
          <h1>Find your perfect instructor.</h1>
          <p>Browse coaches, trainers, and instructors — and book a session in minutes.</p>

          {/* Airbnb-style pill search bar */}
          <div className="discover-search-bar">

            <div className="discover-search-section">
              <span className="discover-search-label">Discipline</span>
              <span className={`discover-search-value${discipline === 'any' ? ' discover-search-value--empty' : ''}`}>
                {disciplineLabel}
              </span>
              <select
                className="discover-search-select"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                aria-label="Filter by discipline"
              >
                {disciplineOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="discover-search-divider" />

            <div className="discover-search-section">
              <span className="discover-search-label">Where</span>
              <span className={`discover-search-value${location === 'any' ? ' discover-search-value--empty' : ''}`}>
                {locationLabel}
              </span>
              <select
                className="discover-search-select"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                aria-label="Filter by location"
              >
                {locationOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="discover-search-divider" />

            <div className="discover-search-section">
              <span className="discover-search-label">Price</span>
              <span className={`discover-search-value${priceRange === 'any' ? ' discover-search-value--empty' : ''}`}>
                {priceLabel}
              </span>
              <select
                className="discover-search-select"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value as PriceRange)}
                aria-label="Filter by price"
              >
                {PRICE_RANGES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <button className="discover-search-btn" aria-label="Search" onClick={() => {}}>
              <Search size={18} color="white" strokeWidth={2.5} />
            </button>

          </div>
        </div>
      </section>

      <HowItWorks />

      {/* Results */}
      <div className="discover-body">
        <div className="discover-results-header">
          <p className="discover-count">
            {filtered.length} {filtered.length === 1 ? 'instructor' : 'instructors'} found
          </p>
          {hasActiveFilter && (
            <button className="discover-clear" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="discover-grid">
            {filtered.map((pro) => (
              <ProCard key={pro.id} pro={pro} />
            ))}
          </div>
        ) : (
          <div className="discover-empty">
            <h3>No instructors match your filters</h3>
            <p>
              Try broadening your search or{' '}
              <button className="discover-clear-inline" onClick={clearFilters}>clear all filters</button>.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="discover-footer">
        <div className="discover-footer-inner">
          <span>© 2026 SessionPro</span>
          <Link href="/for-pros">Are you a pro? Create your free page →</Link>
        </div>
      </footer>
    </div>
  );
}
