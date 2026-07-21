'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { BookingFlow } from '@/app/[slug]/BookingFlow';
import type { AvailabilityRule, Pro, Service } from '@/types/sessionpro';

type ClubPro = Pro & { services: Service[]; availability: AvailabilityRule[] };

type Props = { pros: ClubPro[]; demoPaymentLink?: string };

export function ClubBookingSelector({ pros, demoPaymentLink }: Props) {
  const [selectedProId, setSelectedProId] = useState<string | null>(pros.length === 1 ? pros[0].id : null);
  const selectedPro = pros.find((p) => p.id === selectedProId) ?? null;

  if (pros.length === 0) {
    return (
      <div className="container">
        <p className="muted">No pros are available to book right now.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="section-heading">
        <span>01</span>
        <div>
          <h2>Choose your pro</h2>
          <p>Select who you&rsquo;d like to book a private lesson with.</p>
        </div>
      </div>

      <div className="service-grid">
        {pros.map((pro) => {
          const photoSrc = pro.profile_photo_path
            ? pro.profile_photo_path.startsWith('/')
              ? pro.profile_photo_path
              : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pro-media/${pro.profile_photo_path}`
            : null;
          const initials = pro.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
          return (
            <article
              key={pro.id}
              className={`service-card club-pro-card ${selectedProId === pro.id ? 'selected' : ''}`}
              onClick={() => setSelectedProId(pro.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedProId(pro.id)}
            >
              <div className="club-pro-avatar">
                {photoSrc ? (
                  <Image src={photoSrc} alt={pro.full_name} width={56} height={56} />
                ) : (
                  <div className="photo-initials">{initials}</div>
                )}
              </div>
              <div>
                <div className="service-name">{pro.full_name}</div>
                <div className="service-detail">{pro.discipline}</div>
              </div>
              {selectedProId === pro.id && <CheckCircle2 size={18} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
            </article>
          );
        })}
      </div>

      {selectedPro && (
        <div style={{ marginTop: 32 }}>
          <BookingFlow
            pro={selectedPro}
            services={selectedPro.services}
            availability={selectedPro.availability}
            bookingMode={selectedPro.booking_mode ?? 'instant'}
            demoPaymentLink={demoPaymentLink}
          />
        </div>
      )}
    </div>
  );
}
