'use client';

import { useEffect, useState } from 'react';

type Props = {
  proName: string;
  initials: string;
  photoSrc: string | null;
  ratingAverage: number | null;
  ratingCount: number;
  startingPrice: string | null;
};

export function StickyBookingBar({ proName, initials, photoSrc, ratingAverage, ratingCount, startingPrice }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById('hero-book-sentinel');
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`sticky-bar${visible ? ' sticky-bar--visible' : ''}`} aria-hidden={!visible}>
      <div className="sticky-bar-inner">
        <div className="sticky-bar-pro">
          {photoSrc ? (
            <img src={photoSrc} alt={proName} className="sticky-bar-photo" />
          ) : (
            <div className="sticky-bar-initials">{initials}</div>
          )}
          <div className="sticky-bar-info">
            <span className="sticky-bar-name">{proName}</span>
            {ratingAverage && ratingCount > 0 && (
              <span className="sticky-bar-rating">
                ★ {ratingAverage.toFixed(1)}
                <span className="sticky-bar-rating-count"> ({ratingCount})</span>
              </span>
            )}
          </div>
        </div>

        <div className="sticky-bar-right">
          {startingPrice && (
            <span className="sticky-bar-price">From {startingPrice}<span className="sticky-bar-per">/session</span></span>
          )}
          <a href="#booking" className="button button-primary sticky-bar-cta">
            Book a session
          </a>
        </div>
      </div>
    </div>
  );
}
