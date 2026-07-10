# ShiftSync

A team scheduling and shift-swap platform. Managers publish schedules, employees request shift swaps through a two-step approval flow, and everyone gets live notifications the moment a swap is requested, approved, or denied.

Built for retail, restaurant, and healthcare teams who currently juggle shift changes over group chats — with no approval trail and no way to catch double-bookings.

---

## Why this project

Shift-swapping is a genuinely relational problem: a user belongs to a team, holds many shifts, and can propose swaps involving a teammate's shift — each of which moves through an approval state machine. That relational shape drove most of the technical decisions here:

- **A real state machine, not CRUD.** A swap request moves through five states (`PENDING_EMPLOYEE → PENDING_MANAGER → APPROVED / DENIED / CANCELLED`), with each transition restricted to one actor and one legal starting state. The rules live in one transition table, so illegal moves fail the same way everywhere.
- **Constraints the database actually enforces.** PostgreSQL with foreign keys and a per-team membership model — a shift can't reference a team that doesn't exist, and "no one is double-booked" is enforced by a range-overlap check at the service layer (since overlap isn't expressible as a simple unique constraint).
- **Atomic approvals.** Approving a swap reassigns one or two shifts and resolves the request in a single transaction — it all happens or none of it does.
- **Live updates without over-engineering.** Notifications are one-directional (server → client), so they're delivered over Server-Sent Events rather than reaching for WebSockets. Every event is persisted first, then pushed live if the user is connected — so offline users catch up on reconnect.

---

## Architecture

Layered Express API: `routes → middleware → controllers → services → Prisma`.

Controllers stay thin (parse the request, call a service, shape the response). All business logic — the overlap check, the swap state machine, notification fan-out — lives in the service layer, which keeps it unit-testable in isolation from HTTP.

```
request → route → auth/validation middleware → controller → service → Prisma → PostgreSQL
                                                                │
                                                                └→ SSE push (if user connected)
```

**Core entities:** `User`, `Team`, `Membership` (join table carrying per-team role), `Shift`, `SwapRequest`, `Notification`.

**Authorization** is per-team, not global — a user is a `MANAGER` or `EMPLOYEE` *within a team*, checked via middleware that reads the membership for the team in the request.

---

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL, Prisma, JWT (httpOnly cookies), Server-Sent Events, Jest
**Frontend:** React, React Query *(in progress)*

---

## Project Structure

```
shiftsync/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # data model + enums
│   │   └── migrations/          # version-controlled schema history
│   ├── src/
│   │   ├── config/              # Prisma client singleton
│   │   ├── routes/              # URL → controller mapping
│   │   ├── middleware/          # auth, validation, error handling
│   │   ├── controllers/         # thin request/response handlers
│   │   ├── services/            # business logic (state machine, overlap check, SSE)
│   │   ├── utils/               # AppError, asyncHandler
│   │   └── app.js               # Express app assembly
│   ├── tests/                   # unit + integration
│   └── server.js                # entry point
└── frontend/                    # React app (in progress)
```

---

## Getting Started

### Prerequisites

- Node.js 18.11+ (uses the built-in `--watch` flag)
- A PostgreSQL database (this project uses [Neon](https://neon.tech), but any Postgres works)

### Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (see [Environment Variables](#environment-variables) below), then run the initial migration to create the tables:

```bash
npx prisma migrate dev
```

Start the dev server:

```bash
npm run dev
```

The API runs at `http://localhost:3000`, versioned under `/api/v1`. Confirm it's up:

```bash
curl http://localhost:3000/api/v1/health
# { "status": "ok" }
```

### Frontend setup

*Coming soon — the React client is in progress.*

---

## Environment Variables

Create `backend/.env` with:

| Variable | Description |
|----------|-------------|
| `PORT` | Port the API listens on (default 3000) |
| `DATABASE_URL` | Pooled Postgres connection string (used by the app at runtime) |
| `DIRECT_URL` | Direct Postgres connection string (used by Prisma for migrations) |
| `JWT_SECRET` | Secret for signing JWTs — use a long random string |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |

A `.env.example` is included as a template. Never commit the real `.env`.

> **Note on the two database URLs:** Neon (and other serverless Postgres providers) offer a pooled connection for normal queries and a direct connection for migrations. Prisma's migration engine needs the direct one; the running app uses the pooled one. See `ENVIRONMENT.md` for details.

---

## Available Scripts

Run from `backend/`:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the server with auto-reload |
| `npm start` | Start the server (production) |
| `npm test` | Run the test suite |
| `npm run prisma:migrate` | Create and apply a migration |
| `npm run prisma:studio` | Open Prisma Studio to browse the database |

---

## API

Full endpoint reference — routes, request/response shapes, and error codes — is in [`API_CONTRACT.md`](./API_CONTRACT.md).

---