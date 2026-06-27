# Deployment Guide

PayTrack has two deployable services:

- Frontend: Next.js app at the repository root.
- Backend: Django API/Admin in `backend/`.

Deploy them as separate services. Point the frontend to the backend API with `NEXT_PUBLIC_API_URL`.

## Required Production Environment

Frontend:

```env
NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com/api
NEXT_PUBLIC_REGISTRATION_ENABLED=false
```

Backend:

```env
DJANGO_DEBUG=false
DJANGO_SECRET_KEY=<long-random-secret>
JWT_SECRET=<different-long-random-secret>
DJANGO_ALLOWED_HOSTS=your-render-service.onrender.com
FRONTEND_URL=https://your-vercel-app.vercel.app
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-vercel-app.vercel.app
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
PAYTRACK_REGISTRATION_ENABLED=false
DJANGO_SECURE_SSL_REDIRECT=true
DJANGO_SESSION_COOKIE_SECURE=true
DJANGO_CSRF_COOKIE_SECURE=true
DJANGO_SECURE_HSTS_SECONDS=31536000
DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS=true
DJANGO_SECURE_HSTS_PRELOAD=true
PAYTRACK_ALLOW_DEFAULT_PASSWORDS=false
PAYTRACK_SEED_PASSWORD=<temporary-strong-password-if-seeding>
PAYTRACK_ADMIN_EMAIL=admin@yourbusiness.com
PAYTRACK_ADMIN_NAME=System Admin
PAYTRACK_ADMIN_PASSWORD=<strong-admin-password>
DJANGO_SUPERUSER_USERNAME=admin
```

Use separate values for `DJANGO_SECRET_KEY` and `JWT_SECRET`. Do not reuse the sample values from `.env.example`.

For local development, leave `DATABASE_URL` empty to use SQLite, set `DJANGO_DEBUG=true`, and keep `NEXT_PUBLIC_API_URL=http://localhost:4000/api`.

## Frontend Commands

Install:

```bash
npm ci
```

Build:

```bash
npm run build
```

Start:

```bash
npm run start
```

The production frontend listens on port `3000` unless your host sets `PORT`.

## Backend Commands

Install:

```bash
python -m pip install -r requirements.txt
```

Check production settings:

```bash
python backend/manage.py check --deploy
```

Run migrations:

```bash
python backend/manage.py migrate
```

Create or update the admin user from environment variables:

```bash
python backend/manage.py bootstrap_admin
```

Collect static files for Django Admin:

```bash
python backend/manage.py collectstatic --noinput
```

Start with Gunicorn:

```bash
gunicorn backend.wsgi:application --chdir backend --bind 0.0.0.0:${PORT:-4000}
```

## First Admin User

Frontend authentication uses username and password. A Django Admin superuser can also sign into the frontend with the same Django username and password; on first frontend login PayTrack syncs that account into the app with the `ADMIN` role.

For local development, `npm run django:seed` can create default demo users.

For production on Render free tier, prefer `bootstrap_admin` because it creates your real admin from environment variables during deploy. Add these variables in Render:

```env
PAYTRACK_ADMIN_EMAIL=admin@yourbusiness.com
PAYTRACK_ADMIN_NAME=System Admin
PAYTRACK_ADMIN_PASSWORD=<strong-admin-password>
DJANGO_SUPERUSER_USERNAME=admin
```

Then use this Render backend build command:

```bash
pip install -r requirements.txt && python backend/manage.py collectstatic --noinput && python backend/manage.py migrate && python backend/manage.py bootstrap_admin
```


If your Render service uses `Root Directory = backend`, use these commands instead:

```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py bootstrap_admin
```

```bash
gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-4000}
```
That creates both:

- Frontend PayTrack admin login with `DJANGO_SUPERUSER_USERNAME` and `PAYTRACK_ADMIN_PASSWORD`.
- Django Admin superuser with the same username and password.

## Vercel + Render Checklist

- Vercel `NEXT_PUBLIC_API_URL` must end with `/api`, for example `https://your-render-service.onrender.com/api`.
- Render `DJANGO_ALLOWED_HOSTS` must include the Render hostname. Render also provides `RENDER_EXTERNAL_HOSTNAME`, which PayTrack will accept automatically.
- Render `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` must include the exact Vercel frontend origin, with no trailing slash.
- Render `FRONTEND_URL` can be set to the same Vercel URL to keep CORS/CSRF aligned.
- Supabase passwords with special characters must be URL-encoded inside `DATABASE_URL`.


## Business Data Seed

This repository includes `backend/api/fixtures/kingstore_seed.json`, exported from the current local SQLite database. It contains the existing business records:

- 381 products
- 16 categories
- 4 customers
- 17 sales
- 3 debts
- 1 supplier
- 1 customer request

To load those records into Render/Supabase after migrations, temporarily set `PAYTRACK_ENABLE_BUSINESS_SEED=true`, then run:

```bash
python backend/manage.py seed_business_data --replace
```

If your Render service uses `Root Directory = backend`, run:

```bash
python manage.py seed_business_data --replace
```

Use `--replace` only when you want the online business records to match this local export. After the first online import, remove `PAYTRACK_ENABLE_BUSINESS_SEED` or set it to `false`; the command will safely skip in production without that flag.
## Security Checklist

- `DJANGO_DEBUG=false` in production.
- `DJANGO_ALLOWED_HOSTS` contains only real backend hostnames.
- `CORS_ALLOWED_ORIGINS` contains only the real frontend origin.
- Public registration stays disabled unless you intentionally need it.
- Production database uses managed PostgreSQL, not the local SQLite file.
- HTTPS is enabled at the hosting/load balancer layer.
- HSTS preload is enabled only after confirming the whole domain and subdomains are HTTPS-ready.
- Database backups are enabled before live use.
- Admin/default passwords are changed before accepting real sales data.
