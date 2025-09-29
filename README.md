
# Novus Academy — Vercel v1.3

## One-time setup
1) In Vercel Project → Settings → Environment Variables:
   - `DATABASE_URL` = your Neon Postgres connection string
   - `JWT_SECRET` = long random string
2) Deploy.
3) Visit `/api/migrate` once to create tables.

## Test endpoints
- `/api/health` → `{ ok: true }`
- `/api/debug` → shows which env vars are set
- `/api/register` → create account
- `/api/login` → login
