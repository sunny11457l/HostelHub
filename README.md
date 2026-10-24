# HostelHub — Every complaint, on the clock

Hostel maintenance tickets with **SLA timers and automatic escalation**: every
complaint gets a resolution deadline by priority, a cron engine escalates
breaches to the wardens, and every ticket carries a full status timeline.

---

## Problem Statement

Hostel complaints live on sticky notes and WhatsApp and get forgotten. Water
leaks wait a week because nobody tracks who owns what or when it was promised.
HostelHub gives every ticket an SLA, auto-escalates breaches, and shows a
public timeline so students always know where their complaint stands.

## Target Users

- **Students** raising and tracking complaints about their rooms and facilities.
- **Wardens** triaging, assigning staff and being held to response times.
- **Admins** watching aggregate health: statuses, resolution speeds, breaches.

## Solution

Students raise tickets (priority auto-suggested by category — plumbing and
electrical default to high). Warden assignment starts the SLA clock: high 8h,
medium 24h, low 72h. A cron job scans every 5 minutes: deadlines inside 2
hours trigger reminders, breaches flip the ticket to `escalated` and notify
every warden. Students can reopen within 72h of resolution; the SLA restarts
shorter. Everything is stamped on an auditable timeline.

## Key Features

- **SLA engine** — priority-based deadlines; assignment starts the clock.
- **Auto-escalation (cron)** — `node-cron` every 5 min, same `runSLAScan()`
  exposed via `POST /api/jobs/run-sla` for demos/tests.
- **Status timeline** — every event (created, assigned, comments, resolved,
  reopened, escalated) recorded with actor, note and timestamp.
- **Reopen window** — 72h after resolution, with reason; restarts an 8h SLA.
- **Role-scoped views** — students see their tickets; wardens get a kanban
  board and all tickets; admins get aggregate stats.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 4, React Router 6, Axios |
| Backend | Node.js, Express 4, Mongoose 8, Zod, Multer (photos), node-cron |
| Auth | JWT (7-day), bcryptjs, `student`/`warden`/`admin` roles, rate-limited auth |
| Database | MongoDB (Atlas or local); `USE_MEMORY_DB=1` zero-config demo |
| Tests | `node:test` + `mongodb-memory-server` (20 checks incl. SLA-scan tests) |
| Deployment | Render (backend `render.yaml`) + Vercel (frontend `vercel.json`) |

## Architecture

```text
React SPA (Vercel) — list table + warden kanban + live SLA countdowns
   │  axios + JWT bearer
   ▼
Express API (Render)
   │   /api/tickets        create (multipart), role-scoped list/detail
   │   ├─ assign           starts SLA clock (priority → hours)
   │   ├─ status           in-progress / resolved (note required)
   │   ├─ comments/reopen/feedback
   │   /api/admin/stats    aggregate health (admin only)
   │   /api/notifications  per-user inbox
   ▼
jobs/scheduler.js — runSLAScan(): breach→escalate, <2h→remind
   │  (cron every 5 min; callable directly for tests)
   ▼
MongoDB: User · Ticket (timeline, SLA fields) · Notification
```

## Major Workflows

1. **Raise a ticket** — category auto-sets priority; optional photo; room and
   summary required; a human-readable code (HH-1042) is issued.
2. **Warden triage** — assign to staff with one action; the SLA deadline is
   computed and shown as a live countdown everywhere.
3. **Automatic escalation** — the scheduler escalates breaches and notifies
   wardens; approaching deadlines notify the student.
4. **Resolve & reopen** — resolution requires a note; students rate 1–5 and
   can reopen within 72h with a reason (SLA restarts at 8h).
5. **Admin analytics** — counts by status, breached count, average resolution
   hours per category.

## Local Setup

```bash
# 1. Backend
cd backend
npm install
npm test                       # 20-check suite (no database needed)

# Zero-config demo:
USE_MEMORY_DB=1 npm start      # API on http://localhost:5105 (SLA cron on)

# Or with a real MongoDB:
cp .env.example .env           # set MONGODB_URI + JWT_SECRET
npm run seed
npm start

# 2. Frontend
cd ../frontend
npm install
npm run dev                    # app on http://localhost:5305
```

**Demo credentials** (password `Demo@1234`): `dev@demo.com` (student),
`warden@demo.com`, `admin@demo.com`. Seed includes 8 tickets across every
status — one already escalated, one resolved awaiting feedback, one reopenable,
one past its reopen window. Trigger a live scan with
`curl -X POST localhost:5105/api/jobs/run-sla`.

## Environment Variables

### backend/.env

| Name | Purpose |
|---|---|
| `PORT` | API port (default 5105) |
| `MONGODB_URI` | MongoDB connection string (empty + `USE_MEMORY_DB=1` for demo mode) |
| `USE_MEMORY_DB` | `1` = ephemeral in-memory MongoDB, auto-seeded on boot |
| `JWT_SECRET` | Secret used to sign JWTs — long random string in production |
| `CLIENT_ORIGIN` | Frontend origin allowed by CORS (default http://localhost:5305) |

### frontend/.env

| Name | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL (default http://localhost:5105/api) |

## API Overview

| Method & path | Purpose |
|---|---|
| `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` | Auth (student/warden) |
| `POST /api/tickets` · `GET /api/tickets?status&category` · `GET /api/tickets/:id` | Tickets (role-scoped) |
| `PATCH /api/tickets/:id/assign` | Warden triage — starts SLA clock |
| `PATCH /api/tickets/:id/status` | in-progress / resolved (warden) |
| `POST /api/tickets/:id/comments` · `POST …/reopen` · `POST …/feedback` | Lifecycle |
| `GET /api/admin/stats` | Aggregate analytics (admin) |
| `GET /api/notifications` · `POST /api/notifications/read` | Notification inbox |
| `POST /api/jobs/run-sla` | Manual SLA scan (demo/test) |
| `GET /api/health` | Health probe |

## Deployment

- **Backend**: Render web service from `backend/render.yaml`; set `MONGODB_URI`,
  `JWT_SECRET`, `CLIENT_ORIGIN`; health check `/api/health`. The cron scheduler
  starts with the server — Render free web services stay warm enough for a
  5-minute cadence; for stricter timing use a cron job service calling
  `POST /api/jobs/run-sla` with an admin token.
- **Frontend**: Vercel from `frontend/` (SPA rewrite); set `VITE_API_URL`.

Live links: backend — [add URL] · frontend — [add URL]

## Error Handling & Security

- Zod validation on every route; status transitions are guarded (cannot assign
  a resolved ticket, cannot resolve without a note, cannot reopen past 72h).
- Role checks on every mutating route; students are query-scoped to their own
  tickets and 403 on others' details.
- bcrypt(12) hashing, no account enumeration, rate-limited auth, 7-day JWTs.
- Frontend handles loading/empty/error/success states; live countdown chips;
  toasts on every mutation; 401 auto-logout.

- **Announcement board** — wardens broadcast (pinnable) notices every student sees.
- **Ticket CSV export** — the full ledger, one click, spreadsheet-ready.
- **Satisfaction analytics** — average rating per category on top of resolution speed.

## Roadmap

- Staff accounts with their own queues.
- Push notifications (email/webhook) on escalation.
- Photo attachments on resolution for proof-of-work.
- Monthly warden scorecards from the analytics data.
