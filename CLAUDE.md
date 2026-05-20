# finmy

## Overview
All-in-one Gulf digital wallet targeting Saudi Arabia first, Vision 2030 horizon. Unifies payments, automated investments, smart bill management, and subscriptions tracking in a single app — ending the chaos of juggling multiple financial apps. Year-1 target: ~10k users. Regulatory baseline: SAMA open-banking guidelines.

## Vision
Be the #1 comprehensive and trusted digital wallet in the Gulf by 2030 — the primary financial dependency for users across expenses, payments, and investments.

## Target users
| Segment | Pain point | finmy solves it with |
|---|---|---|
| Busy parents | Forgetting to send allowances to kids / staff | Automated allowance distribution (daily / weekly / monthly) |
| Beginner investors | Fear of entering markets, no time to monitor | Auto-investment with professional management |
| Students & limited-income employees | High fees, no loyalty rewards | Student/corporate tier with reduced fees and cashback |

## Product roadmap

### Must have (P0)
- **Auto-Investment** — schedule monthly deductions into sectors (US stocks, Saudi equities, real estate, sukuk). User sets amount and cadence; finmy executes. Tracked in an `investments` feature module.
- **Smart Bill Center** — auto-pay recurring obligations (rent, BNPL installments, utilities). Native Tabby and Tamara deep-link integration so users manage BNPL from one place. Tracked in a `bills` feature module.
- **Custom Card Issuance** — virtual and physical Mada / Visa / Mastercard / travel cards, each with spend limits and configurable settings. Tracked in a `cards` feature module.
- **Subscription Tracker** — auto-detect and list all active subscriptions (Netflix, Amazon Prime, gym, etc.). Users cancel or renew without leaving the app. Tracked in a `subscriptions` feature module.

### Should have (P1)
- **Allowance Distribution** — auto-distribute money to named dependents (children, domestic staff) on a configurable schedule with per-recipient limits. Extension of the `groups/` module.
- **User Tiers + Loyalty Points** — four tiers (Standard → Silver → Gold → Diamond) unlocked by cumulative deposit/spend/investment volume. Each tier earns loyalty points redeemable in the in-app store, plus tier-specific benefits: reduced admin fees, cashback, higher instant-withdrawal limits, exclusive investment windows. Tracked in a `loyalty` feature module.
- **AI Monthly Reports** — monthly spending digest with AI-generated tips to cut wasteful spend. Uses transaction categorisation data. Tracked in a `reports` feature module.
- **Student & Corporate Deals** — exclusive fee reductions and cashback for verified students and employees of partner companies. Managed via promo codes or email-domain verification.

### Could have (P2)
- **In-App Store** — sell gift cards and vouchers (Amazon, Sony, HungerStation, etc.) redeemable with loyalty points or SAR balance.
- **Crypto Wallet** — managed digital-currency portfolio for users who opt in; operated by a specialist team, not self-custody.

## Success metrics
- Ratio of automated operations to manual operations per active user (target: >60 % automated by month 6)
- 30-day and 90-day user retention rates
- Assets Under Management (AUM) via auto-investment feature

## Identity
- **Primary** `#7C3AED` (violet) — actions, links, brand
- **Secondary** `#EC4899` (pink) — accents, highlights
- **Accent** `#F0ABFC` (fuchsia) — gradient ends, used sparingly
- **Surface** `#F4F1FA` (light) / `#1A1426` (dark) — neumorphic card base
- **Background** `#FAFAFA` (light) / `#0F0B1A` (dark)
- **Headings**: Plus Jakarta Sans (600–700)
- **Body / UI**: Inter (400–600)
- **Visual style**: soft neumorphism — dual-shadow cards on tinted surface, 16–20px radius, subtle violet→pink gradient reserved for primary CTAs
- **Tone**: calm, trustworthy, plain-spoken. No exclamation marks in product copy. Numbers and money are always precise.

## Stack
- **pnpm + Turborepo** — workspace + cached builds; only sanctioned package manager.
- **Next.js 15 (App Router)** — web frontend; server components fetch from the Hono API.
- **Expo (React Native, SDK current)** — mobile frontend; shares feature logic with web.
- **Tailwind CSS v4 + NativeWind v4** — unified utility styling across web and mobile.
- **TanStack Query** — server-state cache on both clients.
- **Hono on Node.js** — single backend API; multi-runtime if we ever need edge.
- **Hono RPC client** — end-to-end type safety from server to web + mobile, no codegen.
- **Zod** — runtime validation + the source of truth for shared types.
- **Better Auth** — sessions, MFA, passkeys; DB-backed for instant revocation.
- **Drizzle ORM** — SQL-first, lightweight, edge-compatible.
- **Postgres on Neon** — serverless, scale-to-zero, branchable for safe schema iteration.
- **Plaid (official Node SDK)** — bank account linking and transaction sync.
- **Inngest** — durable jobs, scheduled syncs, Plaid webhook processing with retries.
- **Server-Sent Events** — one-way push for live balance / transaction updates.
- **Cloudflare R2** — receipt and attachment storage.
- **Resend + React Email** — transactional email.
- **Recharts** (web) / **Victory Native XL** (mobile) — charts.
- **Sentry** — error tracking on every app.
- **Biome** — lint + format; ESLint only for `eslint-plugin-next`.
- **TypeScript strict** everywhere.

## Architecture
- **Modular monolith.** One Hono server composed of feature modules with explicit boundaries. Right-sized for ~10k users and AI-driven development: a single coherent context to load, clear seams to extract later if needed.
- **Monorepo layout** (pnpm workspaces, Turbo pipeline):

```
finmy/
├── apps/
│   ├── api/                # Hono server (composes feature routes)
│   ├── web/                # Next.js 15 — imports feature UI into pages
│   └── mobile/             # Expo — imports feature UI into screens
├── packages/
│   ├── features/           # All business logic, scoped by domain
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── groups/         # shared expenses / IOU ledger + allowance distribution
│   │   ├── accounts/       # linked bank accounts (Plaid)
│   │   ├── investments/    # auto-investment schedules and portfolio tracking
│   │   ├── bills/          # smart bill center — auto-pay, Tabby/Tamara
│   │   ├── cards/          # virtual/physical card issuance and management
│   │   ├── subscriptions/  # subscription detection and management
│   │   ├── loyalty/        # user tiers, points, benefits
│   │   ├── reports/        # AI monthly spending reports
│   │   ├── store/          # in-app gift card / voucher store (P2)
│   │   ├── users/
│   │   └── notifications/
│   ├── db/                 # Drizzle schema, client, migrations — single source of truth
│   ├── auth/               # Better Auth setup + shared middleware
│   ├── lib/                # env loader, Plaid client, SSE helpers, shared types
│   └── config/             # tsconfig / tailwind / biome / nativewind presets
├── pnpm-workspace.yaml
├── turbo.json
├── .npmrc
└── package.json
```

- **Each feature folder owns**: `schema.ts` (Zod + types), `routes.ts` (Hono routes), `service.ts` (business logic), `hooks.ts` (TanStack Query hooks), `ui/` (cross-platform components).
- **Types live in `packages/features/<domain>/schema.ts` or `packages/db/schema.ts` only.** Apps import; never redefine.

## Deployment
This project targets a PaaS (Railway, Render, Fly.io, Vercel, or similar). No self-managed servers or custom infrastructure-as-code. Web on Vercel, mobile via Expo EAS, API on Railway or Fly, Postgres on Neon, jobs on Inngest Cloud, storage on Cloudflare R2.

## Working principles for AI agents
- Confirm requirements before assuming. If ambiguous, ask before coding rather than guess.
- Explain non-obvious decisions when suggesting changes. Routine edits don't need narration.
- Surface uncertainty. Flag tradeoffs and unknowns explicitly instead of papering over them.
- Match existing patterns. Mirror recent files in the same folder rather than inventing new shapes.
- Clean up when you touch a file. Remove unused imports, vars, params, and dead code.
- Use **pnpm only**. Reject npm, yarn, bun, or anything else.
- Block packages whose latest version was published less than 7 days ago. Wait for the dust to settle. Enforced via `minimumReleaseAge: 10080` in `pnpm-workspace.yaml` and `minimum-release-age=10080` in `.npmrc`.

## Environment & secrets
- All secrets in env vars. Never commit `.env`.
- Validate env at startup with Zod in `packages/lib/env.ts`. Fail fast on missing or malformed values.
- Keep a thorough `.gitignore` from day one: `.env*`, `node_modules/`, `.turbo/`, `.next/`, `dist/`, `build/`, `.expo/`, `ios/`, `android/`, `coverage/`, `*.log`, `.DS_Store`, `.idea/`, `.vscode/`, `*.pem`, `*.key`. Audit before every push.
- Plaid `CLIENT_ID` / `SECRET`, Better Auth secret, Neon connection string, Resend key, R2 credentials — server-only. Never expose to web or mobile bundles.

## Code standards
- TypeScript strict mode. No `any` without a written `// reason: ...` comment.
- Small, focused functions. Meaningful names. One export per concern.
- Reusable components live in `packages/features/<domain>/ui/` or `packages/lib/ui/`. Write once, not per consumer.
- Money is **never** a `number`. Use integer minor units (cents) or a `Decimal` type. Currency code always travels with the amount.
- Dates are stored UTC, rendered in the user's timezone at the edge.

## Database & queries
- Schema in **one place**: `packages/db/schema.ts`. Drizzle is the only ORM.
- Paginate every list endpoint. Default 25, max 100. Cursor-based for transaction feeds; offset for admin tables.
- Index every column used in WHERE / ORDER BY / JOIN. Composite indexes most-selective first (`user_id, occurred_at DESC` is the canonical transactions index).
- Select only the columns you need. Skip heavy text/JSON unless required.
- Avoid N+1. Use Drizzle relation loaders or explicit batched lookups.
- Parameterize all writes. Wrap multi-statement writes in transactions, especially anything touching balances or splits.
- Connection pooling on (Neon pooled endpoint). Least-privilege DB user in production — no superuser, no `DROP`.
- Migrations: `drizzle-kit generate` → review SQL diff → apply. Never edit a shipped migration.

## Auth & permissions
- Use **Better Auth** for all auth flows: email + password, magic link, passkeys, MFA, OAuth, password reset, session management.
- Cookies: `HttpOnly`, `Secure`, `SameSite=Strict`. Session lifetime ≤ 30 days, idle timeout 7 days.
- RBAC enforced **on the server**, in feature `routes.ts` via Better Auth middleware. Client-side checks are UX only.
- Membership-based authorization: every record touched in `groups/`, `transactions/`, `budgets/` must verify the requesting user belongs to the owning user or group. No implicit ownership from URL params.
- Never return password hashes, MFA secrets, Plaid `access_token`s, internal IDs the client doesn't need, or full bank account numbers — only last 4 digits.

## Input handling
- Validate every input server-side with Zod. Client validation is UX only.
- Sanitize any user-supplied HTML or markdown before storing or rendering (DOMPurify on parse; never `dangerouslySetInnerHTML` over raw input).
- File uploads (receipts): validate MIME type, cap at 10 MB, inspect magic bytes, strip EXIF location data. Store in R2; serve via signed URLs.
- Rate-limit aggressively: 5 req/min on auth endpoints, 30 req/min on writes, 120 req/min on reads, per user and per IP. Use a Redis or Upstash-backed limiter.
- Plaid webhooks: verify the `Plaid-Verification` JWT against Plaid's JWKs before processing. Reject anything else.

## Hardening
- Security headers via `hono/secure-headers` and the Next.js `headers()` config. Set CSP explicitly for the sources used (self, Plaid Link, Resend pixel-free, R2 signed URLs). No `unsafe-inline`.
- HTTPS-only in production. Redirect HTTP at the edge. HSTS with `includeSubDomains; preload`.
- Never log secrets, PII, full tokens, session IDs, Plaid `access_token`s, full request/response bodies, or full bank account numbers. Use a redacting logger.
- Encrypt at rest where applicable: Plaid `access_token` per-row encryption with a KMS-managed key (envelope encryption), never plaintext.
- Keep dependencies current with **Renovate**. Auto-merge patch updates after CI; manual review for minors/majors. Respect the 7-day cooldown above.
- Never use `eval()`, `Function(...)`, dynamic `import()` from user input, or unsanitized SQL.
- CSRF: Better Auth handles tokens for cookie-auth routes. Mobile uses bearer tokens and is exempt.
- Audit log: every money-adjacent action (transaction create/edit/delete, split create/settle, account link/unlink, investment schedule create/pause/cancel, bill auto-pay trigger, card issue/freeze/cancel, loyalty redemption) writes an immutable row to an `audit_log` table with actor, action, target, before/after, IP, user agent.
