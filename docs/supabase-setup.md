# SessionPro Supabase Setup

This is the Phase 1 backend setup for the full self-service SessionPro platform.

The current public site is static. These Supabase files are the foundation for the future app that will support:

- Pro accounts
- Dynamic pro pages at `sessionpro.io/[slug]`
- Services, packages, and pricing
- Weekly availability
- Booking holds
- Confirmed bookings
- Stripe payment records
- Reviews
- QR/link tracking
- Public profile images

## 1. Create the Supabase Project

1. Go to Supabase and create a new project.
2. Recommended project name: `sessionpro`
3. Save these values somewhere private:
   - Project URL
   - Anon public key
   - Service role key
   - Database password

Do not commit keys to this repo.

## 2. Run the Schema

Before running the schema, create a public storage bucket:

```text
Name: pro-media
Public bucket: enabled
File size limit: 5 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

Then open the Supabase SQL editor and run:

```sql
-- Paste the full contents of supabase/schema.sql
```

The schema creates:

- `pros`
- `services`
- `availability_rules`
- `availability_exceptions`
- `clients`
- `booking_holds`
- `bookings`
- `payments`
- `reviews`
- `pro_links`
- RLS policies for the `pro-media` storage bucket

It also enables row level security on every public table.

## 3. Important Security Notes

The schema allows public clients to create client records, booking holds, and pending bookings. That is useful for the no-account client booking flow, but the production app should move final booking creation behind a server route or Supabase RPC once Stripe checkout is wired in.

The intended production flow is:

1. Client selects a service and time.
2. App creates a short-lived `booking_holds` record.
3. App creates a Stripe Checkout session.
4. Stripe webhook confirms payment.
5. Server converts the hold into a confirmed booking.
6. Confirmation emails/SMS are sent.

Do not trust the browser to mark bookings as paid or confirmed.

## 4. Recommended Auth Settings

In Supabase Auth:

- Enable email/password login.
- Require email confirmation once real pros start signing up.
- Set the site URL to the deployed SessionPro app URL.
- Add local development redirect URLs once the Next.js app exists.

For now, this static landing page does not use Supabase Auth directly.

## 5. Storage

The schema creates a public `pro-media` bucket for profile images.

Recommended object paths:

```text
pros/{pro_id}/profile.jpg
pros/{pro_id}/gallery/{image_id}.jpg
```

The bucket is public because pro profile photos are meant to be visible on public booking pages.

Only the signed-in pro who owns `{pro_id}` can upload, update, or delete files inside `pros/{pro_id}/...`.

## 6. First Seed Record to Add Later

Once the full app exists, Kenyon should be the first seed pro:

```text
Name: Kenyon Matua
Slug: kenyonmatua
Discipline: Golf Instruction
Location: Highland, UT
Club: Alpine Country Club
Title: Assistant Golf Professional
Session mode: In person
Beginner lesson: $80
Advanced lesson: $100
5-session beginner pack: $375
5-session advanced pack: $475
10-session beginner pack: $725
10-session advanced pack: $925
Availability: Monday-Friday, 8:00 AM-6:00 PM
```

## 7. Next Backend Steps

After this schema is accepted, build in this order:

1. Create a Next.js app shell.
2. Add Supabase client/server helpers.
3. Implement pro signup and login.
4. Build onboarding that writes `pros`, `services`, and `availability_rules`.
5. Replace the static Kenyon page with a dynamic `[slug]` route.
6. Add the booking engine and hold expiration logic.
7. Add Stripe Connect.
