# LernErne client

React 19 single-page application built with Vite and React Router.

## Install and run

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Vite proxies `/api` to `http://localhost:5000` during development. Start the API
from `../server` as described in its README. Run `npm run lint`, `npm test` for
the auth/session and course-navigation checks, and `npm run build` for
verification. `npm run preview` serves the generated `dist/` directory locally
and is not a deployment.

The optional `VITE_API_BASE_URL` defaults to `/api/v1`. For a separate API
origin, configure the frontend URL and backend `CORS_ORIGIN` together; the
frontend must send credentials and the API must be HTTPS in production.

## Canonical routes

| URL | Page | Access |
| --- | --- | --- |
| `/` | Home | Public |
| `/about` | About | Public |
| `/how-it-works` | How it works | Public |
| `/auth?mode=signin` or `?mode=signup` | Sign in / create account | Public |
| `/courses` | Learning library | Signed-in learner |
| `/dashboard` | Dashboard | Signed-in learner |
| `/profile` | Profile | Signed-in learner |
| `/settings` | Settings | Signed-in learner |
| `/courses/:courseSlug` | Course outline | Signed-in learner |
| `/courses/:courseSlug/lessons/:lessonId` | Lesson and quiz | Enrolled learner |
| `/courses/:courseSlug/checkpoints/:checkpointId` | Module checkpoint | Enrolled learner |

Unknown URLs render NotFound. The legacy `/sign-in` and `/sign-up` paths redirect
to the corresponding authentication mode. Private routes are gated by the
central `AuthProvider`, which restores the server session from `/auth/me`; the
browser never stores an authentication token or password.

## Production routing

The Vite base and React Router assume root deployment (`/`). The production
web server must route `/api/v1/*` to the Express service and serve the SPA
`index.html` for unknown client-side paths so refreshing `/courses` or another
nested route works. No hosting provider or deployment is configured here.
For production, keep the frontend and API on the same site (or same-origin via
a reverse proxy), use HTTPS, configure the API's exact frontend origin, and
verify the session cookie and CSRF flow against the chosen host.
