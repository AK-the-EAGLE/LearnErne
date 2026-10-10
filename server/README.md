# LernErne API

Node.js (ES modules), Express 5, Mongoose, and MongoDB-backed cookie sessions.
The API uses JavaScript and listens on port `5000` by default.

## Local setup

Prerequisites: Node.js 20.19+ (or 22.12+) and a local MongoDB server, or a
MongoDB connection URI you control.

```powershell
npm ci
Copy-Item .env.example .env
```

Edit `.env`. Set `MONGODB_URI` to the development database and replace
`SESSION_SECRET` with a random secret of at least 32 characters (for example,
generate one locally with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`).
Never commit `.env` or reuse a development secret in production.

Initialize indexes and sample courses, then start the server:

```powershell
npm run db:init
npm run dev
```

`GET http://localhost:5000/api/v1/health` returns HTTP 200 only when Mongoose
reports MongoDB connected; otherwise it reports a degraded 503 response.
Course initialization is idempotent and updates the seeded course documents
in place. Versioned schema/index migrations are under `migrations/` and run
through `migrate-mongo`. Use `npm run migrate:status`, `npm run migrate:up`,
and `npm run migrate:down` to inspect or manage migrations; back up production
data before applying schema changes.

## Scripts

- `npm run dev` — watch-mode local API.
- `npm start` — production-mode entry point (configure environment first).
- `npm test` — backend tests using `mongodb-memory-server`; does not use the
  configured development or production database.
- `npm run db:init` — apply migrations, then idempotently seed the sample
  published courses from `src/data/courseCatalog.js`. Edit that catalog and
  increment each edited course's `contentVersion`, then rerun `npm run db:init`
  to update the course document in place. The upsert is keyed by the stable slug;
  it does not delete courses or modify users' enrollment/progress documents.

## Configuration and security

See `.env.example` for `NODE_ENV`, `PORT`, `SESSION_SECRET`, `MONGODB_URI`, and
comma-separated exact `CORS_ORIGIN` values. The app uses Helmet, JSON/form
body limits, credentialed CORS allowlisting, authentication rate limiting,
HttpOnly SameSite=Lax sessions stored in MongoDB, secure cookies in
production, session ID regeneration on login/registration, and per-session
CSRF tokens for every mutation. The cookie architecture is intended for a
same-site frontend/API deployment, with HTTPS in production. Configure the
trusted reverse proxy before relying on forwarded HTTPS headers.

The in-process rate-limit store is suitable for local development and a
single instance; production horizontal scaling should use a shared limiter
store. No real production URL, Mongo credentials, session secret, or host is
included.
