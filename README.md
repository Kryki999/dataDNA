# DataDNA — Sales & Reach Dashboard

Weekend MVP (Faza 1): cold calling, The Wall heatmap, reach metrics, cel przychodu (20k PLN).

## Stack

- Next.js 16.2.9, Auth.js, Drizzle ORM, Neon Postgres
- Multi-tenant schema (`organizationId` on all entities)
- Webhook-ready: `/api/webhooks/[provider]`

## Setup

1. Copy env file:

```bash
cp .env.local.example .env.local
```

2. Create a [Neon](https://neon.tech) project and set `DATABASE_URL`.

3. Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

4. Push schema and seed CEO user:

```bash
npm run db:push
npm run db:seed
```

5. Copy `Organization ID` from seed output into `WEBHOOK_ORG_ID`.

6. Start dev server:

```bash
npm run dev
```

## Deploy (Vercel)

1. Push repo to GitHub and import in Vercel.
2. Set environment variables from `.env.local.example` (do **not** set `TZ`).
3. After first deploy, run `npm run db:push` and `npm run db:seed` locally against production `DATABASE_URL`, or use Neon SQL console.
4. Set `WEBHOOK_ORG_ID` to the seeded organization UUID.

## Webhook smoke test

```bash
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"evt_test_1\",\"type\":\"charge.succeeded\"}"
```

## Timezone

All streak/heatmap logic uses `Europe/Warsaw` via `lib/timezone.ts` — never set `TZ` on Vercel.
