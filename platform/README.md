# SessionPro Platform App

This is the first Next.js version of SessionPro. It lives in `platform/` so the current static landing page can stay live while the full self-service app is built.

## What Works Now

- Next.js app shell
- SessionPro brand styling
- Dynamic pro route at `/[slug]`
- Demo route at `/kenyonmatua`
- Supabase client wiring
- Fallback Kenyon data if Supabase environment variables are not set

## Local Setup

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
cp .env.example .env.local
```

Then fill in:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Run locally:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/kenyonmatua
```

## Supabase Behavior

If `.env.local` is missing, `/kenyonmatua` renders fallback demo data.

If `.env.local` is set, `/kenyonmatua` reads from these Supabase tables:

- `pros`
- `services`
- `availability_rules`

The seed record created by `../supabase/seed-kenyon.sql` uses slug:

```text
kenyonmatua
```

## Next Build Step

Build authentication and onboarding:

1. Pro signup
2. Pro login
3. Onboarding form
4. Writes to `pros`, `services`, and `availability_rules`

