# ShiftSync

A team scheduling and shift-swap platform. Managers publish schedules, employees request shift swaps through a multi-step approval flow, and everyone gets live notifications when a swap is requested, accepted, approved, or denied.

Built for retail, restaurant, and healthcare teams who currently juggle shift changes over group chats - with no approval trail and no way to catch double-bookings.

**Live:** [shiftsync-rosy.vercel.app](https://shiftsync-rosy.vercel.app) · installable as a PWA on mobile.

---

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL, Prisma, JWT (httpOnly cookies), Server-Sent Events
**Frontend:** React, Vite, React Query, Tailwind CSS, PWA

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
        ├── features/       # auth, teams, schedule, requests, notifications, landing
        └── shared/         # context, services, components, utils
```

The backend is a layered Express API - `routes → middleware → controllers → services → Prisma`. Controllers stay thin; business logic (the swap state machine, the shift-overlap check, notification delivery) lives in the service layer.

**Core entities:** `User`, `Team`, `Membership` (join table carrying per-team role), `Position`, `Shift`, `SwapRequest`, `Notification`.

---

## Key Features

- **Multi-step swap approval** - an employee asks a teammate to cover a shift; the teammate accepts; a manager gives final approval. The schedule only changes on that final approval.
- **Double-booking prevention** - shift-overlap conflicts are checked when a swap is requested and re-checked before it's approved.
- **Role-based views with a mode switch** - roles are per-team, on the membership. A manager can toggle between a manager view (team schedule, approvals, roster) and an employee view (their own shifts and requests), with the choice persisted.
- **Live notifications over SSE** - swap events push to the people involved in real time; the UI updates without a refresh.
- **Full audit trail** - every swap keeps a timeline of who asked, who agreed, and who approved, with timestamps.

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
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `15d`) |
| `NODE_ENV` | `development` locally, `production` when deployed |
| `FRONTEND_URL` | The frontend origin, for CORS (e.g. `http://localhost:5173`) |

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

## Deployment

The frontend is deployed on Vercel and the backend on Render, with PostgreSQL on Neon.

Because the frontend and backend live on different domains, the auth cookie would otherwise be treated as a third-party cookie and blocked by privacy-focused browsers. To avoid this, the frontend proxies `/api` requests to the backend through its own domain, so the cookie stays first-party. In production the auth cookie is set with `SameSite=None; Secure`, and CORS is restricted to the frontend origin.

---

## Known Limitations

- **Concurrent swaps on the same shift** - a shift can currently have more than one pending swap, and approving a second one after the first can overwrite the result. The planned fix splits swaps into targeted (a single chosen teammate, so no race) and broadcast (multiple candidates, resolved at approval time with the losing requests auto-declined).
- **Shift lifecycle vs. pending swaps** - deleting or manually reassigning a shift that has a pending swap isn't handled gracefully yet; the intended fix is to auto-cancel affected pending swaps.

---

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) - how the system fits together and the reasoning behind it
- [`API_CONTRACT.md`](./API_CONTRACT.md) - full endpoint reference: routes, request/response shapes, and error codes
- [`ENVIRONMENT.md`](./ENVIRONMENT.md) - environment variables and the Neon two-URL setup explained
