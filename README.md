# English Flow

English Flow is a Telegram-first backend learning engine for short English speaking reps. Milestone 1 implements the core skeleton and one working loop:

`/drill` → Russian prompt → English voice answer → Deepgram STT → OpenAI structured feedback → saved attempt.

User-facing bot messages are in Russian. English appears only as learning content: target phrases, better versions, examples, vocabulary, and patterns.

## Current Status

Milestone 1 is implemented:

- Fastify app with `GET /health`.
- grammY Telegram bot with `/start`, `/help`, `/drill`, text/voice handlers, and future command stubs.
- Prisma/PostgreSQL schema for `User`, `Drill`, `DrillSession`, `Attempt`, `UserState`, `AiLog`, `UsageLog`, and `EventLog`.
- Telegram allowlist via `ALLOWED_TELEGRAM_IDS`.
- Provider interfaces for AI, STT, and TTS.
- OpenAI drill generation and feedback validation through Zod.
- Deepgram STT with English language mode for `/drill`.
- Temporary audio deletion after STT.
- Mock providers for development/tests when real keys are absent.
- Docker Compose with `app`, `worker`, and `postgres`.

## Local Setup

Install dependencies:

```bash
npm install
```

Copy env file:

```bash
cp .env.example .env
```

Set at least:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/english_flow
TELEGRAM_BOT_TOKEN=123:abc
ALLOWED_TELEGRAM_IDS=123456789
OPENAI_API_KEY=...
DEEPGRAM_API_KEY=...
```

The Docker Compose Postgres container is exposed on host port `5433` to avoid conflicts with an existing local Postgres on `5432`. Inside Compose, `app` and `worker` use `postgres:5432`.

For local development without OpenAI/Deepgram keys, non-production mode uses mock providers.

## Database

Generate Prisma client:

```bash
npm run prisma:generate
```

Run a development migration:

```bash
npm run prisma:migrate
```

Deploy migrations in production:

```bash
npm run prisma:deploy
```

## Run Locally

Start API and polling bot:

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:3000/health
```

Run only the bot:

```bash
npm run bot
```

Run only the API:

```bash
npm run api
```

## Docker Compose

Create `.env`, then run:

```bash
docker compose up --build
```

Services:

- `app`: Fastify backend plus Telegram webhook or polling startup.
- `worker`: separate worker process placeholder for scheduled reps.
- `postgres`: PostgreSQL used by Prisma and future pg-boss jobs.

## Telegram Webhook

Set:

```env
TELEGRAM_WEBHOOK_URL=https://your-domain.example/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=long-random-secret
```

Then configure Telegram:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=$TELEGRAM_WEBHOOK_URL" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

If `TELEGRAM_WEBHOOK_URL` is empty, the app starts polling mode.

## Access Control

`ALLOWED_TELEGRAM_IDS` is a comma-separated list:

```env
ALLOWED_TELEGRAM_IDS=111111111,222222222
```

Unauthorized users receive: `Доступ запрещён.`

## Providers

OpenAI is used for:

- RU_TO_EN drill generation.
- structured feedback JSON.

Deepgram is used for:

- voice transcription.

Provider keys stay on the backend. Frontend and Mini App clients must never receive OpenAI or Deepgram keys.

## Tests

```bash
npm test
```

Tests use mocks and do not call OpenAI or Deepgram.

## Next Milestones

1. Scheduled reps with pg-boss.
2. Vocabulary and lesson import.
3. Spaced repetition and weak spots.
4. Thought transformer.
5. Shadowing with TTS.
6. Telegram Mini App API readiness.

## Backups

For production, configure daily PostgreSQL backups with at least seven days of retention, for example a server-level backup or scheduled `pg_dump`.
