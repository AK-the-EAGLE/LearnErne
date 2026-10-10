# LernErne REST API v1

Base path: `/api/v1`. JSON responses use `{ "success": true, "data": ... }` or
`{ "success": false, "error": { "code": "...", "message": "..." } }`.

## Session and CSRF

Authentication uses an HttpOnly `learnerne.sid` cookie backed by MongoDB via
`connect-mongo`. The cookie is `SameSite=Lax` and becomes `Secure` in
production. Passwords are bcrypt-hashed; neither hashes nor session secrets
are returned. Every mutation requires the session's synchronizer token in
`X-CSRF-Token`. First request `GET /auth/csrf`; successful register/login
responses supply the rotated token. Mutations with a disallowed `Origin` are
rejected. Configure exact frontend origins through `CORS_ORIGIN`.

## Endpoints

| Method and path | Access | Behavior |
| --- | --- | --- |
| `GET /health` | Public | Reports actual Mongoose database readiness; responds 503 if disconnected. |
| `GET /auth/csrf` | Public | Creates/returns the session CSRF token. |
| `POST /auth/register` | Public + CSRF | Validates and creates a learner; starts a regenerated session. Body: `displayName`, `email`, `password` (8–128 chars). |
| `POST /auth/login` | Public + CSRF | Starts a regenerated session; invalid credentials have one generic response. |
| `POST /auth/logout` | Session + CSRF | Destroys the server session and clears the cookie. |
| `GET /auth/me` | Public | Returns current user or `user: null`. |
| `GET /users/me` | Session | Reads the account profile. |
| `PATCH /users/me` | Session + CSRF | Updates `displayName`, `bio`, `location`, and `interest`. |
| `GET /users/me/preferences` | Session | Reads account preferences. |
| `PUT /users/me/preferences` | Session + CSRF | Saves `darkMode`, `courseReminders`, `weeklyDigest`, and `progressHighlights`. Notification choices are stored only; no delivery service exists. |
| `GET /courses` | Session | Lists published structured courses with enrollment, lesson/checkpoint counts, and the next resume activity. |
| `GET /courses/:courseId` | Session | Reads a published course, including instructional modules, lessons, activities, quiz questions (without answer keys), checkpoints, and the current learner's progress. Accepts Mongo ID or slug. |
| `POST /courses/:courseId/enroll` | Session + CSRF | Creates or reactivates the current user's enrollment. |
| `POST /courses/:courseId/lessons/:lessonId/open` | Session + CSRF | Persists the current lesson for an enrolled learner; previous module checkpoints gate later modules. |
| `POST /courses/:courseId/lessons/:lessonId/quiz` | Session + CSRF | Validates and grades answers on the server, then persists the result and returns feedback. |
| `POST /courses/:courseId/lessons/:lessonId/complete` | Session + CSRF | Marks a lesson complete only after the learner passes its quiz. |
| `POST /courses/:courseId/checkpoints/:checkpointId/complete` | Session + CSRF | Saves an owner-scoped reflection after the module's lessons are complete. |
| `PATCH /courses/:courseId/progress` | Session + CSRF | Saves the legacy optional weekly task checklist; structured course completion is derived from lesson/checkpoint records. |
| `GET /dashboard` | Session | Returns the current user's profile, enrolled courses, progress, and activity. |

All user-specific records are scoped from the server session; request bodies
cannot select another user. Unknown endpoints return the common 404 envelope.
Authentication routes are rate limited. Body parsing is capped at 100 KB.

## Seed content and initialization

Run `npm run db:init` from `server/` after setting `MONGODB_URI`. This runs
versioned indexes through `migrate-mongo up`, then upserts the bundled,
published course catalog from `server/src/data/courseCatalog.js` idempotently.
Edit that source and increment `contentVersion` to publish course revisions.
The update is keyed by course slug and never deletes enrollments or learner
progress. Migrations live in
`server/migrations/`; inspect and back up production data before applying
schema migrations. `npm run migrate:status` reports migration state.

The bundled courses are product sample content, not externally authored,
accredited, or automatically generated content. Quiz grading and course
completion are server-derived. User learning and profile records are real
MongoDB data once configured.

## Deployment constraints

Use HTTPS and a strong, unique `SESSION_SECRET` (at least 32 characters).
The current cookie/CORS setup is intended for a same-site frontend/API
deployment, commonly through a reverse proxy. Set `CORS_ORIGIN` to exact
frontend origins and configure the proxy to preserve HTTPS forwarding. For
multi-instance deployments, replace the in-process auth rate-limit store with
a shared limiter store. The repository does not select a cloud provider or
contain production credentials.
