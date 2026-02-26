# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Install dependencies
cd backend && npm install

# Development (auto-reload via --watch)
npm run dev

# Build TypeScript to dist/
npm run build

# Production start (requires build first)
npm start

# Run tests
npm test
```

Tests use vitest. Config at `backend/vitest.config.ts`.

## Required Environment Variables

Create `backend/.env` with:

**Required:** `MONGODB_URI`, `JWT_SECRET`, `REDIS_URL`

**Optional with defaults:**
- `PORT` (default 4000)
- `JWT_EXPIRES_IN` (default 7d)
- `JWT_REFRESH_EXPIRES_IN` (default 30d)
- `JWT_ISSUER` (default child-care-api)
- `JWT_AUDIENCE` (default child-care-client)
- `CACHE_TTL_SECONDS` (default 86400)
- `NORMS_VERSION` (default 2025.01)
- `CORS_ORIGINS` (default `*`, comma-separated for production)
- `RATE_LIMIT_POINTS` (default 100 req/min)
- `RATE_LIMIT_DURATION` (default 60s)
- `AUTH_RATE_LIMIT_POINTS` (default 10 req/min for auth endpoints)
- `AUTH_RATE_LIMIT_DURATION` (default 60s)
- `MISTRAL_API_KEY` (optional — AI features return 503 if missing; used when `AI_PROVIDER=mistral`)
- `OPENAI_API_KEY` (optional — used when `AI_PROVIDER=openai`)
- `AI_PROVIDER` (default `mistral`; also accepts `openai`)
- `AI_MODEL` (optional — overrides provider default model)
- `OPENAI_MODEL` (default `gpt-4o` — used when `AI_PROVIDER=openai`)
- `AI_CACHE_TTL_SECONDS` (default 3600)
- `AI_CHAT_HISTORY_LIMIT` (default 20 — sliding window of messages kept in chat context)
- `DIGEST_SCHEDULE_HOUR` (default 3 — hour of day for digest generation)
- `NORMS_AI_CACHE_TTL_SECONDS` (default 7200)
- `AWS_REGION` (default `us-east-1`)
- `AWS_ACCESS_KEY_ID` (optional — S3 avatar upload returns 503 if missing)
- `AWS_SECRET_ACCESS_KEY` (optional — S3 avatar upload returns 503 if missing)
- `S3_BUCKET_NAME` (optional — required for avatar uploads)
- `S3_AVATAR_PREFIX` (default `avatars/`)
- `S3_PRESIGN_EXPIRES_SECONDS` (default 300)
- `BILLING_WEBHOOK_SECRET` (optional — HMAC secret for webhook signature verification)
- `SMTP_HOST` (optional — email notifications disabled if unset)
- `SMTP_PORT` (default 587)
- `SMTP_USER` (optional)
- `SMTP_PASS` (optional)
- `SMTP_FROM` (default `no-reply@childcare.app`)
- `FCM_SERVER_KEY` (optional — push notifications disabled if unset)

## Architecture

**Backend-only TypeScript project** using Express 5, Mongoose (MongoDB), and Redis for caching. Uses ESM modules (`"type": "module"`) with `tsx` for dev execution. Target is ES2022 with NodeNext module resolution.

### Module Structure (`backend/src/modules/`)

Each domain module follows the pattern: `model.ts` → `service.ts` → `routes.ts`. Some modules have a `controller.ts` (auth). Validation is done with Zod schemas inline in route files.

- **auth** — Register/login with bcrypt hashing and JWT tokens (with iss/aud claims). Refresh token rotation, password change, password reset flow. Auth endpoints have dedicated rate limiting.
- **users** — User profile CRUD (`GET /users/me`, `PATCH /users/me`). Roles: `user` | `admin`. Admin promotion endpoint (`POST /users/promote/:userId`). `passwordHash` is `select: false` — never returned unless explicitly requested with `+passwordHash`.
- **children** — Full CRUD for child profiles (create, list, update, delete). Creating a child auto-creates a ChildAccess record granting full permissions to the creator. Delete cascades to access records, events, digests, conversations, and S3 avatar. Avatar upload uses a 2-step presigned URL flow: `POST /children/:id/avatar/upload-url` → client PUTs to S3 → `PATCH /children/:id/avatar/confirm`.
- **upload** — S3 service (`modules/upload/s3.service.ts`) for presigned URL generation and object deletion. Requires `AWS_*` + `S3_BUCKET_NAME` env vars; gracefully returns 503 if not configured.
- **access** — Role-based per-child permission system. Roles: `father` | `mother` | `nanny` | `doctor`. Permissions: `canRead`, `canWrite`, `canInvite`. Invite by email, list access, revoke access. Cannot revoke own access.
- **events** — CareEvent CRUD (create, list, update, delete). Types: `sleep`, `feed`, `diaper`, `mood`. Pagination support (limit/offset). All operations check permissions via `utils/permissions.ts`. Creates/updates/deletes invalidate AI cache.
- **analytics** — MongoDB aggregation pipelines for sleep summaries, feeding patterns, and wake windows. Read-only, permission-gated. Supports `?from=YYYY-MM-DD&to=YYYY-MM-DD` date range filtering.
- **norms** — Admin-only CRUD for age-based developmental norms (sleep, feeds, wake windows).
- **ai** — AI-powered insights, recommendations, anomaly detection, daily digests, and **multi-turn chat**. Provider-agnostic via `AiProvider` interface (`ai.provider.ts`) with `generateCompletion`, `generateChatCompletion`, `transcribeAudio`, and `supportsCapability`. Supports Mistral (chat) and OpenAI (chat + transcription). Redis caching with configurable TTL. Graceful degradation when no API key set. Daily digest generation via cron-aware scheduler + worker threads. Chat history persisted in `AiConversation` model (one doc per user+child), sliding window of `AI_CHAT_HISTORY_LIMIT` messages injected into context. Chat is strictly scoped to child care topics via system prompt guardrails.

### Key Patterns

- **Permission model**: ChildAccess documents control who can read/write/invite for each child. Services call `requirePermission()` from `utils/permissions.ts` before data access.
- **Input validation**: All route params with ObjectIds are validated via `utils/validate.ts` returning 400 on invalid IDs. Request bodies validated with Zod; errors caught by error middleware.
- **Error handling**: Services throw errors with `statusCode` and `code` properties. The error middleware catches these + Zod errors and returns structured JSON with `requestId`. 500 errors never expose internal messages.
- **Request tracking**: Every request gets a UUID via `requestId` middleware, returned in error responses and `X-Request-Id` header.
- **Auth flow**: JWT Bearer tokens with `iss`/`aud` claims. Refresh tokens for token rotation. `requireAuth` middleware decodes token and sets `req.user` (`{ id, email }`). `requireAdmin` additionally checks `user.role === 'admin'`.
- **Rate limiting**: Global rate limiter applied to all routes. Separate stricter rate limiter for auth endpoints (login, register, password reset). Configurable via env vars.
- **Security**: Helmet for HTTP headers, configurable CORS origins, `passwordHash` excluded from queries by default, 500 error messages never leaked to client, body size limited to 256kb.
- **Graceful shutdown**: Server drains HTTP connections, then disconnects MongoDB and Redis on SIGTERM/SIGINT with 10s forced timeout.
- **Health check**: `GET /health` checks MongoDB and Redis connectivity, returns 503 if either is down.
- **Worker threads**: `workers/pool.ts` provides `runWorker()` for offloading tasks with timeout and abort support.
- **Logging**: Structured JSON logging via pino-http.

### API Routes

All routes are available at both `/v1/*` (versioned) and `/*` (backwards-compatible). Health check at `GET /health`.

| Prefix | Module |
|--------|--------|
| `/auth` | Auth (register, login, refresh, change-password, request-reset, reset-password) |
| `/users` | Users (profile CRUD, admin promote) |
| `/children` | Children (CRUD, avatar upload, voice input) |
| `/access` | Access (invite, list, revoke) |
| `/events` | Events (CRUD with pagination) |
| `/analytics` | Analytics (sleep, feeding, wake windows — with date range) |
| `/admin` | Norms (admin-only CRUD), billing management |
| `/ai` | AI (status, insights, recommendations, anomalies, digest, chat) |
| `/billing` | Plan info, trial start, payment webhook |
