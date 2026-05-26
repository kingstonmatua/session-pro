'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type Props = {
  reviewId: string;
  isPublished: boolean;
};

export function PublishToggle({ reviewId, isPublished: initial }: Props) {
  const [published, setPublished] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const res = await fetch(`/api/reviews/${reviewId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !published }),
      });
      if (res.ok) setPublished(p => !p);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`review-toggle ${published ? 'review-toggle--published' : 'review-toggle--hidden'}`}
    >
      {published ? <Eye size={13} /> : <EyeOff size={13} />}
      {published ? 'Published' : 'Hidden'}
    </button>
  );
}
