# Simi Learning Hub

Simi Learning Hub is a Next.js learning-management app backed by Supabase. Head admins approve tutors and manage users; approved tutors manage subjects and lessons; members browse published lessons.

## Local setup

Requirements: Node.js 20+ and npm.

```bash
npm ci
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS/Linux
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` for real authentication and persistence. For a UI-only preview, set `NEXT_PUBLIC_DEMO_MODE=true`; demo data is not persistent and must not be used in production.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Configure email auth and the Google provider if Google sign-in is required.
4. Add the deployed `/auth/callback` URL to the Supabase OAuth redirect allowlist.
5. Create the first user through Supabase Auth, then promote that user's profile to `head` using a controlled admin-only SQL operation. Do not commit passwords or service-role keys.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
# or: make test
```

## Production deployment

Deploy the app to a Node-compatible host such as Vercel. Configure the two Supabase public variables and set `NEXT_PUBLIC_DEMO_MODE=false`. Never expose a Supabase service-role key in browser variables.

### Docker

```bash
docker build -t simi-learning-hub .
docker run --rm -p 3000:3000 --env-file .env.local simi-learning-hub
```
