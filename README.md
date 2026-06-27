# PayTrack Business Management

PayTrack is a Next.js + Django business system for retail and service businesses. Django owns the database and backend API; Next.js is the frontend workspace for inventory, sales, debts, suppliers, expenses, reports, receipts, and notifications.

## Stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: Python, Django, Django Admin
- Database: SQLite for local development through Django ORM
- Auth: Django API login with JWT tokens for the frontend, plus Django Admin for database administration

## Setup

1. Install frontend dependencies:

```bash
npm install
```

2. Create and install the Python environment:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

3. Run Django migrations and seed login users:

```bash
npm run django:migrate
npm run django:seed
```

4. Start the app:

```bash
npm run dev
```

The frontend runs on `http://localhost:3000`.
The Django API and Admin run on `http://localhost:4000`.

## Login

Frontend login:

- Admin: `admin@kingsstore.local`
- Staff: `staff@kingsstore.local`
- Password: `password123`

Django Admin:

- URL: `http://localhost:4000/admin/`
- Username: `admin`
- Password: `password123`

Use these demo credentials only for local development. Production deployments must set strong secrets and passwords; see [DEPLOYMENT.md](DEPLOYMENT.md).

## Data Ownership

Business records are saved in Django models: products, categories, customers, sales, sale items, debts, suppliers, deliveries, expenses, payments, inventory logs, requests, reports, and notifications. Browser storage is not used as the business database.
