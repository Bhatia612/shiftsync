# ShiftSync

A team scheduling and shift-swap platform. Managers publish schedules, employees request shift swaps through a two-step approval flow, and everyone gets live notifications when a swap is requested, approved, or denied.

Built for retail, restaurant, and healthcare teams who currently juggle shift changes over group chats - with no approval trail and no way to catch double-bookings.

---

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL, Prisma, JWT (httpOnly cookies), Server-Sent Events
**Frontend:** React, Vite, React Query, Tailwind CSS

---

## Project Structure

```
shiftsync/
├── backend/          # Express API
│   ├── prisma/       # schema + migrations
│   └── src/
│       ├── routes/         # URL → controller mapping
│       ├── middleware/     # auth, validation, error handling
│       ├── controllers/    # request/response handlers
│       ├── services/       # business logic
│       ├── config/         # Prisma client
│       └── utils/          # shared helpers
└── frontend/         # React app
    └── src/
        ├── features/       # auth, teams, schedule, requests
        └── shared/         # context, services, components, utils
```

The backend is a layered Express API - `routes → middleware → controllers → services → Prisma`. Controllers stay thin; business logic (the swap state machine, the shift-overlap check, notification delivery) lives in the service layer.

**Core entities:** `User`, `Team`, `Membership` (join table carrying per-team role), `Position`, `Shift`, `SwapRequest`, `Notification`.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (this project uses [Neon](https://neon.tech), but any Postgres works)

### Backend

```bash
cd backend
npm install
```

Create `backend/.env` (see [Environment Variables](#environment-variables)), then create the tables and start the server:

```bash
npx prisma migrate dev
npm run dev
```

The API runs at `http://localhost:3000`, under `/api/v1`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and proxies `/api` to the backend, so start the backend first.

---

## Environment Variables

Create `backend/.env` with:

| Variable | Description |
|----------|-------------|
| `PORT` | Port the API listens on (default 3000) |
| `DATABASE_URL` | Pooled Postgres connection string (used at runtime) |
| `DIRECT_URL` | Direct Postgres connection string (used for migrations) |
| `JWT_SECRET` | Secret for signing JWTs - a long random string |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |

A `.env.example` is included as a template. Never commit the real `.env`.

**On the two database URLs:** Neon offers a pooled connection for normal queries and a direct connection for migrations. Prisma's migration engine needs the direct one; the running app uses the pooled one. See [`ENVIRONMENT.md`](./ENVIRONMENT.md) for the full explanation.

---

## Scripts

Run from `backend/`:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the server with auto-reload |
| `npm start` | Start the server |
| `npm run prisma:migrate` | Create and apply a migration |
| `npm run prisma:studio` | Browse the database in Prisma Studio |

---

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how the system fits together and the reasoning behind it
- [`API_CONTRACT.md`](./API_CONTRACT.md) — full endpoint reference: routes, request/response shapes, and error codes
- [`ENVIRONMENT.md`](./ENVIRONMENT.md) — environment variables and the Neon two-URL setup explained