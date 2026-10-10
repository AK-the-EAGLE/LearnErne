# LernErne

LernErne is a React + Vite learning platform with an Express API and MongoDB-backed accounts, enrollments, and progress.

## Current learning content

The source catalog contains three published learning paths:

- **Plan a learning goal** — 4 lessons and 2 checkpoints
- **Design foundations** — 4 lessons and 2 checkpoints
- **Research basics** — 4 lessons and 2 checkpoints

Course content is defined in `server/src/data/courseCatalog.js`. The API reads published course documents from MongoDB, so a fresh database must be initialized before courses appear in the authenticated Courses page.

## Run locally (Windows PowerShell)

Prerequisites: Node.js 20.19+ (or 22.12+) and a running MongoDB instance.

1. Open a terminal in `LernErne/server`.
2. Install dependencies and create your local environment file:

   ```powershell
   npm ci
   Copy-Item .env.example .env
   ```

3. Edit `server/.env`. Set `MONGODB_URI` to your local MongoDB database and replace `SESSION_SECRET` with a random secret of at least 32 characters. Do not commit `.env`.
4. Initialize database indexes and seed the learning catalog:

   ```powershell
   npm run db:init
   ```

5. Start the API in that terminal:

   ```powershell
   npm run dev
   ```

6. Open a second terminal in `LernErne/client`, then install and start the frontend:

   ```powershell
   npm ci
   npm run dev
   ```

7. Open the local URL printed by Vite (normally `http://localhost:5173`), create an account, sign in, and open **Courses**.

The Vite development server proxies `/api` requests to `http://localhost:5000`. If you change the API host or port, update `client/vite.config.js` or `VITE_API_BASE_URL` as appropriate.

## If courses do not appear

1. Confirm MongoDB is running and `server/.env` points to the intended development database.
2. From `LernErne/server`, run `npm run db:init` and wait for the success message indicating that three courses were upserted.
3. Start/restart the API with `npm run dev`.
4. Open `http://localhost:5000/api/v1/health`; a healthy API should return HTTP 200. A degraded response commonly indicates the database is not connected.
5. Sign in to LernErne and refresh `/courses`. Course APIs require authentication, so testing the endpoint in a logged-out browser may return an authentication error.

## Tests

Run these in each app folder after `npm ci`:

```powershell
npm test
npm run build   # client only
npm run lint
```

Backend tests use an isolated in-memory MongoDB and should not change your development database.

## Important files

- `client/src/routes/router.jsx` — page routes
- `client/src/pages/privatepages/` — course catalog, course detail, lessons, checkpoints, dashboard, profile, and settings
- `server/src/data/courseCatalog.js` — starter course and lesson content
- `server/src/routes/courses.routes.js` — course enrollment and progress API
- `server/src/scripts/seedCourses.js` — idempotent course seeding
- `docs/API.md` — API reference
