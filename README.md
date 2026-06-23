# Data DNA

Open-source sales cockpit for founders, freelancers and indie hackers. Track outreach streaks, manage your pipeline, and share your wins — built in public.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_ORG/data-dna&env=DATABASE_URL,AUTH_SECRET,CEO_EMAIL,CEO_PASSWORD,CEO_USERNAME,CEO_DISPLAY_NAME&project-name=data-dna)

## Features

| Module | Description |
|--------|-------------|
| **Profil** | Avatar, bio, streaks, heatmap, activity log, public `/p/username` |
| **Klienci** | Kanban CRM with drag & drop |
| **Zasięgi** | Reach charts (calls, X, Meta Ads) |
| **Zyski** | Revenue from won deals |
| **Kalendarz** | Follow-ups synced from CRM |
| **Archiwum** | Searchable table with filters and reactivation |

## Stack

- Next.js 16, Auth.js, Drizzle ORM, Neon Postgres
- shadcn/ui + Tailwind CSS 4
- Multi-tenant schema (`organizationId` on all entities)

## Quick start

```bash
git clone https://github.com/YOUR_ORG/data-dna.git
cd data-dna
npm install
cp .env.example .env.local
```

1. Create a [Neon](https://neon.tech) project and set `DATABASE_URL`.
2. Generate `AUTH_SECRET`: `openssl rand -base64 32`
3. Set `CEO_EMAIL`, `CEO_PASSWORD`, optional `CEO_USERNAME` / `CEO_DISPLAY_NAME`.
4. Push schema and seed:

```bash
npm run db:push
npm run db:seed
```

5. Copy `Organization ID` from seed output into `WEBHOOK_ORG_ID`.
6. Start dev server: `npm run dev`

Open [http://localhost:3000/profil](http://localhost:3000/profil)

## Deploy (Vercel)

1. Push repo to GitHub and import in Vercel.
2. Set environment variables from `.env.example`.
3. **Do not** set `TZ` on Vercel — streaks use `Europe/Warsaw` in code.
4. After deploy, run `db:push` and `db:seed` against production `DATABASE_URL`.

## Public profile

Share your streaks without exposing CRM data:

```
https://your-app.vercel.app/p/your-handle
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | Neon pooled connection string |
| `DATABASE_URL_DIRECT` | optional | Direct connection for migrations |
| `AUTH_SECRET` | yes | `openssl rand -base64 32` |
| `AUTH_URL` | prod | e.g. `https://your-app.vercel.app` |
| `CEO_EMAIL` | seed | Owner login email |
| `CEO_PASSWORD` | seed | Plain password (dev only) |
| `CEO_USERNAME` | seed | Public profile handle |
| `CEO_DISPLAY_NAME` | seed | Display name on profile |
| `WEBHOOK_ORG_ID` | webhooks | UUID from `db:seed` output |
| `BLOB_READ_WRITE_TOKEN` | avatars | Auto from Vercel Blob store (see below) |

### Avatar uploads (Vercel Blob)

1. In Vercel project → **Storage** → **Create Database** → **Blob**.
2. Connect the store to your project — Vercel adds `BLOB_READ_WRITE_TOKEN` automatically.
3. Locally: `vercel env pull` or paste the token into `.env.local`.
4. Avatars upload on save from **Profil → Edytuj → Wybierz zdjęcie** (max 2 MB).

## License

MIT — see [LICENSE](LICENSE).
