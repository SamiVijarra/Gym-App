# Gym App — API

REST API for a workout tracker: browse an exercise catalog, build routines, plan and log training sessions, and follow your progress on a calendar with weekly goals and a streak.

**Live app:** https://gym-app-4jtc.onrender.com
**Live API:** https://gym-app-api-gt5e.onrender.com (protected routes such as `/exercises` answer `401` without a token, which is expected)

> The API runs on Render's free tier and goes to sleep after 15 minutes without traffic. The first request after that can take about a minute while it wakes up.

Frontend repository: [gym-app-frontend](https://github.com/SamiVijarra/gym-app-frontend)

![Calendar with color marks per muscle group](https://raw.githubusercontent.com/SamiVijarra/gym-app-frontend/main/docs/screenshots/calendar.png)

## Features

- **Authentication** with JWT (register, login, session check). Passwords are hashed with bcrypt.
- **Exercise catalog** with 873 seeded exercises and your own custom ones. Filter by name, muscle, muscle group or equipment.
- **Routines**: training days with exercises and target sets (weight, reps, rest).
- **Calendar**: plan a routine day or a free session (exercises chosen ahead, no sets yet), then complete it later. Done sessions are immutable history.
- **Muscle groups**: every calendar entry reports which groups it trains (chest, back, shoulders, arms, legs, glutes, core), so the client can color the calendar. Monthly stats are also grouped by muscle group.
- **Progress**: monthly stats, weekly goals, a streak counted in weeks (a week counts if you met that week's goal), and per-exercise history.
- **Profile**: personal data, a default weekly goal and password change.
- **Routine templates stay up to date**: finishing a routine session updates the routine's sets with what you actually lifted.

## Stack

NestJS 11, TypeScript, PostgreSQL, TypeORM (with migrations), Passport (JWT), class-validator, Jest.

## Getting started

Requirements: Node.js 20+ (22 recommended) and a PostgreSQL database.

```bash
npm install
cp .env.template .env      # then fill in the values
npm run seed               # loads the 873 exercises (safe to run again)
npm run start:dev
```

The API listens on `PORT` (default 3000). While `NODE_ENV` is not `production`, TypeORM creates the tables by itself with `synchronize`.

### Environment variables

| Variable                                                      | Description                                                                                                    |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL connection                                                                                          |
| `DB_SSL`                                                      | `true` to connect with SSL (needed by most hosted databases, Neon included). Default `false`                   |
| `DB_SSL_REJECT_UNAUTHORIZED`                                  | Set to `false` only if your provider uses a certificate Node does not trust. Default `true`                    |
| `PORT`                                                        | HTTP port (Render sets it for you)                                                                             |
| `JWT_SECRET`                                                  | Secret used to sign tokens. Use a long random value                                                            |
| `APP_TIMEZONE`                                                | Timezone used to decide what "today" and "this week" mean (default `America/Argentina/Cordoba`)                |
| `NODE_ENV`                                                    | With `production`, `synchronize` is off and pending migrations run when the app starts                         |
| `CORS_ORIGIN`                                                 | Comma-separated list of allowed origins, without trailing slash. If empty, any origin is allowed (development) |

## Scripts

| Command                                | What it does                                                          |
| -------------------------------------- | --------------------------------------------------------------------- |
| `npm run start:dev`                    | Run with auto-reload                                                  |
| `npm run build` / `npm run start:prod` | Compile and run the build                                             |
| `npm run seed`                         | Load the exercise catalog (TypeScript, for development)               |
| `npm run seed:prod`                    | Load the exercise catalog from the compiled build (run `build` first) |
| `npm run migration:generate`           | Generate a migration from the entity changes                          |
| `npm run migration:run` / `:revert`    | Apply or undo migrations                                              |
| `npm run migration:show`               | List migrations and whether they were applied                         |
| `npm run migration:check`              | Fail if the entities and the migrations are out of sync               |
| `npm test`                             | Unit tests                                                            |
| `npm run lint`                         | ESLint                                                                |

## API overview

All routes except `auth/*` require `Authorization: Bearer <token>`.

| Area      | Endpoints                                                                                                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth      | `POST /auth/register`, `POST /auth/login`, `GET /auth/check-status`                                                                                                                                                               |
| Users     | `GET /users/:id`, `PATCH /users/:id`, `PATCH /users/:id/password`                                                                                                                                                                 |
| Exercises | `GET /exercises?name=&muscle=&muscleGroup=&equipment=`, `POST /exercises`, `GET/PATCH/DELETE /exercises/:id`                                                                                                                      |
| Routines  | `GET /routines`, `POST /routines/days`, `PATCH/DELETE /routines/days/:id`, `POST /routines/days/:dayId/exercises`, `PATCH/DELETE /routines/exercises/:id`, `POST /routines/exercises/:id/sets`, `PATCH/DELETE /routines/sets/:id` |
| Calendar  | `GET /calendar?year=&month=`, `POST /calendar/plan-day`, `DELETE /calendar/:id`, `GET /calendar/session-prefill`, `GET /calendar/planned/:id/prefill`, `POST /calendar/complete-session`                                          |
| History   | `GET /calendar/history/:id`, `GET /calendar/history/exercise/:exerciseId`, `GET /calendar/history/exercise/:exerciseId/last`, `PATCH /calendar/history-exercises/:id/notes`, `PATCH /calendar/history-sets/:id/notes`             |
| Progress  | `GET /calendar/stats`, `GET /calendar/stats/muscle-groups`, `GET/POST /calendar/weekly-goal`                                                                                                                                      |

Validation is strict: unknown fields are rejected, and invalid input returns `400` with a list of messages. Messages are in English.

Passwords need at least 6 characters, an uppercase letter, a lowercase letter and a number or symbol.

## Database and migrations

In production the schema is created by migrations (`src/database/migrations`), never by `synchronize`. With `NODE_ENV=production` the app runs the pending migrations on start, so the first deploy against an empty database creates all the tables. After changing an entity:

```bash
npm run migration:generate -- src/database/migrations/<Name>
npm run migration:check
```

`migration:check` fails if an entity change has no migration, so run it before committing.

## Deploying

The live demo uses [Neon](https://neon.com) (PostgreSQL) and [Render](https://render.com) (Web Service), both on free plans. Render's own free PostgreSQL expires after 30 days, which is why the database lives in Neon.

**1. Database (Neon).** Create a project, open **Connect**, turn **Connection pooling off** (you want the direct host, without `-pooler`) and copy the host, user, password and database name. Connections need SSL.

**2. API (Render).** Create a **Web Service** from this repository:

| Setting       | Value                                   |
| ------------- | --------------------------------------- |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npm run start:prod`                    |
| Instance Type | Free                                    |

`--include=dev` is needed because with `NODE_ENV=production` npm skips dev dependencies, and `nest build` needs the Nest CLI.

Environment variables: `NODE_VERSION=22`, `NODE_ENV=production`, `DB_HOST`, `DB_PORT=5432`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`, `JWT_SECRET`, `APP_TIMEZONE` and `CORS_ORIGIN` (the exact URL of the web client). On the first start the migrations create the tables.

**3. Exercise catalog.** The seed runs once from your computer, pointing at the Neon database (Render's free plan has no shell):

```bash
npm run build
NODE_ENV=production DB_HOST=... DB_PORT=5432 DB_USERNAME=... DB_PASSWORD=... \
DB_NAME=... DB_SSL=true JWT_SECRET=x npm run seed:prod
```

Run it after the API has started once, so the tables already exist. It inserts 873 exercises and can be repeated safely.

**4. Web client.** Deploy it as described in the [frontend README](https://github.com/SamiVijarra/gym-app-frontend#deploying), using this API's URL as `VITE_API_URL`.

Never commit real credentials. If a password or secret leaks, reset the password in Neon and replace `JWT_SECRET` in Render.

## Design decisions

- **Calendar dates are plain `YYYY-MM-DD` strings**, and date math is done in UTC (`src/common/utils/date.util.ts`). "Today" comes from `APP_TIMEZONE`. This avoids the classic bug where the week or the day shifts depending on the server's timezone.
- **History is immutable.** Deleting a routine day cancels its planned entries but never touches sessions already done.
- **Ownership checks** run on every read and write of user data.
- **The muscle-group mapping** lives in `src/common/muscle-groups.ts` and is the single source of truth for filtering and for coloring the calendar.
- **Streak in weeks**, not consecutive days, so rest days and holidays do not break it. Weeks are counted against the goal set for each week.
- **The catalog is stored in English.** The client turns what the user types into a muscle or muscle group filter, so the API does not need to know about languages.

## Tests

`npm test` runs unit tests for the date helpers, the muscle-group mapping, the database configuration, the users service and the calendar service: weekly streak rules, planning (including the timezone edge case), completing a session, and the routine template sync. Tests run with `TZ=America/Argentina/Cordoba` on purpose, to catch timezone bugs.

## Project structure

```
src/
  auth/        JWT strategy, guards, login and register
  users/       user entity, profile and password change
  exercises/   catalog, images, filters
  routines/    routine days, exercises and sets
  calendar/    planning, history, stats, weekly goals
  common/      date utils and muscle groups
  database/    TypeORM configuration and migrations
  seed/        exercise catalog loader
```
