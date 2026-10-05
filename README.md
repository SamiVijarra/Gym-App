# Gym App — API

REST API for a workout tracker: browse an exercise catalog, build routines, plan and log training sessions, and follow your progress on a calendar with weekly goals and a streak.

Frontend repository: `https://github.com/SamiVijarra/gym-app-frontend`

## Features

- **Authentication** with JWT (register, login, session check). Passwords are hashed with bcrypt.
- **Exercise catalog** with 873 seeded exercises and your own custom ones. Filter by name, muscle, muscle group or equipment.
- **Routines**: training days with exercises and target sets (weight, reps, rest).
- **Calendar**: plan a routine day or a free session (exercises chosen ahead, no sets yet), then complete it later. Done sessions are immutable history.
- **Muscle groups**: every calendar entry reports which groups it trains (chest, back, shoulders, arms, legs, glutes, core), so the client can color the calendar.
- **Progress**: monthly stats, weekly goals, a streak counted in weeks (a week counts if you met that week's goal), and per-exercise history.
- **Routine templates stay up to date**: finishing a routine session updates the routine's sets with what you actually lifted.

## Stack

NestJS 11, TypeScript, PostgreSQL, TypeORM, Passport (JWT), class-validator, Jest.

## Getting started

Requirements: Node.js 20+ and a PostgreSQL database.

```bash
npm install
cp .env.template .env      # then fill in the values
npm run seed               # loads the 873 exercises (safe to run again)
npm run start:dev
```

The API listens on `PORT` (default 3000).

### Environment variables

| Variable                                                      | Description                                                                                     |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL connection                                                                           |
| `PORT`                                                        | HTTP port                                                                                       |
| `JWT_SECRET`                                                  | Secret used to sign tokens                                                                      |
| `APP_TIMEZONE`                                                | Timezone used to decide what "today" and "this week" mean (default `America/Argentina/Cordoba`) |
| `NODE_ENV`                                                    | With `production`, TypeORM `synchronize` is turned off                                          |
| `CORS_ORIGIN`                                                 | Comma-separated list of allowed origins. If empty, any origin is allowed (development)          |

In production, set `NODE_ENV=production` and create the schema with migrations instead of relying on `synchronize`.

## Scripts

| Command                                | What it does              |
| -------------------------------------- | ------------------------- |
| `npm run start:dev`                    | Run with auto-reload      |
| `npm run build` / `npm run start:prod` | Compile and run the build |
| `npm run seed`                         | Load the exercise catalog |
| `npm test`                             | Unit tests                |
| `npm run lint`                         | ESLint                    |

## API overview

All routes except `auth/*` require `Authorization: Bearer <token>`.

| Area      | Endpoints                                                                                                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth      | `POST /auth/register`, `POST /auth/login`, `GET /auth/check-status`                                                                                                                                                               |
| Users     | `GET /users/:id`, `PATCH /users/:id`                                                                                                                                                                                              |
| Exercises | `GET /exercises?name=&muscle=&muscleGroup=&equipment=`, `GET/POST /exercises`, `GET/PATCH/DELETE /exercises/:id`                                                                                                                  |
| Routines  | `GET /routines`, `POST /routines/days`, `PATCH/DELETE /routines/days/:id`, `POST /routines/days/:dayId/exercises`, `PATCH/DELETE /routines/exercises/:id`, `POST /routines/exercises/:id/sets`, `PATCH/DELETE /routines/sets/:id` |
| Calendar  | `GET /calendar?year=&month=`, `POST /calendar/plan-day`, `DELETE /calendar/:id`, `GET /calendar/session-prefill`, `GET /calendar/planned/:id/prefill`, `POST /calendar/complete-session`                                          |
| History   | `GET /calendar/history/:id`, `GET /calendar/history/exercise/:exerciseId`, `PATCH /calendar/history-exercises/:id/notes`, `PATCH /calendar/history-sets/:id/notes`                                                                |
| Progress  | `GET /calendar/stats`, `GET/POST /calendar/weekly-goal`                                                                                                                                                                           |

Validation is strict: unknown fields are rejected, and invalid input returns `400` with a list of messages.

## Design decisions

- **Calendar dates are plain `YYYY-MM-DD` strings**, and date math is done in UTC (`src/common/utils/date.util.ts`). "Today" comes from `APP_TIMEZONE`. This avoids the classic bug where the week or the day shifts depending on the server's timezone.
- **History is immutable.** Deleting a routine day cancels its planned entries but never touches sessions already done.
- **Ownership checks** run on every read and write of user data.
- **The muscle-group mapping** lives in `src/common/muscle-groups.ts` and is the single source of truth for filtering and for coloring the calendar.
- **Streak in weeks**, not consecutive days, so rest days and holidays do not break it. Weeks are counted against the goal set for each week.

## Tests

`npm test` runs unit tests for the date helpers and the calendar service: weekly streak rules, planning (including the timezone edge case), completing a session, and the routine template sync. Tests run with `TZ=America/Argentina/Cordoba` on purpose, to catch timezone bugs.

## Project structure

```
src/
  auth/        JWT strategy, guards, login and register
  users/       user entity and profile
  exercises/   catalog, images, filters
  routines/    routine days, exercises and sets
  calendar/    planning, history, stats, weekly goals
  common/      date utils and muscle groups
  seed/        exercise catalog loader
```
