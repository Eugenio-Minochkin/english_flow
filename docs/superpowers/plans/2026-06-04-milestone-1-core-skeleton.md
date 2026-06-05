# English Flow Milestone 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Milestone 1: a reusable backend learning engine with Telegram as the first client.

**Architecture:** Telegram handlers stay thin and call core services. OpenAI, Deepgram, and Telegram files sit behind provider/service interfaces. Prisma/PostgreSQL is the source of truth, while Fastify exposes health and future API structure.

**Tech Stack:** TypeScript, Node.js, grammY, Fastify, Prisma/PostgreSQL, Zod, OpenAI, Deepgram, Vitest, Docker Compose.

---

### Task 1: Project Scaffold

- [x] Create package scripts, TypeScript config, Vitest config, Docker files, `.env.example`, and README.
- [x] Add env validation, logger, time, allowlist, cost/rate limit helpers, and Russian message templates.

### Task 2: Database And Core Types

- [x] Create Prisma schema with Milestone 1 models and future enum values.
- [x] Add Prisma client wrapper, DTOs, drill types, provider interfaces, mock providers, and Zod AI schemas.

### Task 3: Services

- [x] Add user, state, events, cost limit, and drill services.
- [x] Implement drill generation, drill session creation, text/voice attempt submission, feedback validation, attempt saving, AI/usage logging, and repeat-state transition.

### Task 4: Interfaces

- [x] Add grammY bot commands `/start`, `/drill`, `/help`, placeholder future commands, text/voice handlers, callback handler, and webhook/polling bootstrap.
- [x] Add Fastify server with `/health` and `/api/me` placeholder auth route.
- [x] Add worker skeleton and pg-boss-ready separation.

### Task 5: Tests And Verification

- [x] Add tests for allowlist, quiet hours, cost limits, AI schema validation, user state transitions, and Russian message template coverage.
- [x] Run `npm install`, Prisma generate, and tests.
