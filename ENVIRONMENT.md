# Environment Variables

ShiftSync's backend reads its configuration from `backend/.env`. Copy `.env.example` to `.env` and fill in the values below. Never commit the real `.env` - it holds database credentials and the JWT secret.

## Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Port the API listens on. Defaults to `3000`. |
| `DATABASE_URL` | Yes | Pooled Postgres connection string. Used by the app at runtime. |
| `DIRECT_URL` | Yes | Direct Postgres connection string. Used by Prisma for migrations. |
| `JWT_SECRET` | Yes | Secret for signing session tokens. Use a long random string. |
| `JWT_EXPIRES_IN` | Yes | How long a login lasts, e.g. `7d` or `24h`. |

## The two database URLs

This is the one piece of setup that isn't obvious, so it's worth explaining.

Neon (and most serverless Postgres providers) give you two ways to connect:

- A **pooled** connection, whose hostname contains `-pooler`. A connection pooler sits between your app and the database and lets many short-lived queries share a small number of real database connections. This is what a running web app wants, because it opens and closes connections constantly.
- A **direct** connection, without `-pooler`. This talks to the database straight, with no pooler in between.

ShiftSync uses both, for different jobs:

- **`DATABASE_URL`** → the pooled connection. The running app uses this for all its normal queries.
- **`DIRECT_URL`** → the direct connection. Prisma uses this only when running migrations.

Migrations need the direct connection because they do things a pooler interferes with - creating tables, altering columns, and running inside long transactions. Poolers are built for many quick queries, not for the kind of schema-changing work a migration does, so Prisma is pointed at the direct connection to avoid that mismatch.

In `schema.prisma`, the two are wired up like this:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Prisma automatically uses `directUrl` for migrations and `url` for everything else. You don't choose per-query - it's handled by which command you run.

## Getting the values from Neon

In the Neon dashboard, open your project and find the connection details. Neon shows a pooled and a direct connection string; the pooled one has `-pooler` in the host. Copy the pooled string into `DATABASE_URL` and the direct string into `DIRECT_URL`.

If you're using a different Postgres provider that doesn't offer pooling, you can set both variables to the same connection string - the app will work, you just won't get connection pooling.

## Generating a JWT secret

`JWT_SECRET` should be a long, unpredictable string. One quick way to generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output into `JWT_SECRET`.