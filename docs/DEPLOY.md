# Hosting MathArena for free (Vercel + Neon + Resend)

Nothing runs on your PC afterwards. The app sleeps when idle, the database is hosted, and the
daily mails are sent by Vercel Cron. Local development keeps working unchanged (SQLite).

Time: about 30 minutes of clicking plus a one-time data upload (10–30 minutes, unattended).

## 0. What you'll create

| Service | Free tier | Used for |
|---|---|---|
| [Neon](https://neon.tech) | 0.5 GB Postgres | the database (problem bank ≈ 100 MB + her progress) |
| [Vercel](https://vercel.com) | Hobby plan | hosting + cron (2 daily jobs) |
| [Resend](https://resend.com) | 100 emails/day | the morning / evening / Sunday mails |

Sign up to each with your own email. You never paste credentials into chat; they go into the
Vercel project settings and into your local `.env` for the one-time upload.

## 1. Neon: create the database

1. New project → name it `matharena`, region closest to you.
2. On the project dashboard, open **Connection details**. Copy two URLs:
   - the **pooled** connection string (host contains `-pooler`) → this is `DATABASE_URL`
   - the **direct** connection string (no `-pooler`) → this is `DIRECT_URL`
   Both must end with `?sslmode=require`.

## 2. Upload the schema and her data (one time, from this PC)

In PowerShell, in the project folder:

```powershell
# 1) Export the local database (problem bank + profiles + progress) to data/export/db.json
npm.cmd run db:export

# 2) Point at Neon for the next commands (this shell only)
$env:DATABASE_URL = "<pooled url>"
$env:DIRECT_URL   = "<direct url>"

# 3) Create the tables in Neon, then generate the Postgres client
npx prisma db push --schema=prisma/schema.postgres.prisma
npx prisma generate --schema=prisma/schema.postgres.prisma

# 4) Load everything into Neon (17k problems + her profile; 10–30 min)
npm.cmd run db:import

# 5) Restore the local SQLite client so local dev keeps working
npx prisma generate
```

Re-running `db:import` later is safe (it upserts). To refresh the hosted problem bank after
re-seeding locally, repeat steps 1–5.

## 3. Resend: mail

1. Create an API key → `RESEND_API_KEY`.
2. Without a custom domain you can only send from `onboarding@resend.dev` **to the email you signed
   up with**. Easiest: sign up to Resend with the parent email, set both student and parent addresses
   in the app's Settings to that same address for now, or verify a domain you own (free) to send anywhere.

## 4. Vercel: deploy

1. **Add New → Project → Import** the GitHub repo `balajisreenivasa/matharena`. Framework: Next.js.
2. **Environment variables** (Production):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | pooled Neon URL |
   | `DIRECT_URL` | direct Neon URL |
   | `AUTH_SECRET` | any long random string (e.g. run `openssl rand -hex 32`, or mash the keyboard for 40+ chars) |
   | `CRON_SECRET` | another long random string |
   | `RESEND_API_KEY` | from Resend |
   | `MAIL_FROM` | `MathArena <onboarding@resend.dev>` (or your verified sender) |
   | `APP_TZ` | your timezone, e.g. `America/New_York` |
   | `APP_URL` | your Vercel URL once you know it, e.g. `https://matharena-xxx.vercel.app` (links in mails) |

3. Deploy. The build runs `npm run vercel-build`, which generates the Postgres client, syncs the
   schema (no-op after step 2) and builds Next.js.
4. Open the URL, sign in with her existing email/password (it came over with the import).

## 5. Cron

`vercel.json` defines two jobs, in UTC:

| Job | Schedule (UTC) | Eastern time |
|---|---|---|
| `/api/cron?mode=morning` | `0 10 * * *` | 6 AM EDT / 5 AM EST |
| `/api/cron?mode=evening` | `0 0 * * *` | 8 PM EDT / 7 PM EST (Sunday also sends the weekly digest) |

Hobby-plan cron fires "within the hour", not at the exact minute. Change the hours in
`vercel.json` for another timezone, then redeploy. Test by hand:

```powershell
curl -H "Authorization: Bearer <CRON_SECRET>" "https://<your-app>.vercel.app/api/cron?mode=morning&force=1"
```

Vercel → Project → **Settings → Cron Jobs** shows the run history.

## 6. Turn off the local scheduled tasks

```powershell
scripts\unregister-tasks.cmd
```

## Keeping the two in sync

- Code: `git push` to `main` redeploys automatically.
- Schema changes: edit `prisma/schema.prisma`, run `npm run schema:pg`, commit both files; the next
  deploy applies them to Neon.
- Data: her progress now lives only in Neon. Back it up occasionally: with the Neon URLs in the
  shell as in step 2, run `npx prisma generate --schema=prisma/schema.postgres.prisma && npm run db:export`
  (then `npx prisma generate` to restore local). The file lands in `data/export/db.json`.

## Privacy

Keep the URL within the family. The bank includes MAA-owned AMC problems for personal practice; the
app is login-only and should stay that way.

---

## Current state (set up 2026-09-20)

| Piece | Where |
|---|---|
| App | https://matharena-dun.vercel.app (Vercel project `matharena`, deployed from this folder with `vercel --prod`) |
| Database | Neon project `plain-rain-99154336`, branch `production`, database `neondb` |
| Mail | Resend, test sender `onboarding@resend.dev`; delivers only to jsbalaji@gmail.com until a domain is verified |
| Cron | Vercel: morning 10:00 UTC (6 AM EDT / 5 AM EST), evening 00:00 UTC (8 PM EDT / 7 PM EST; Sunday adds the digest) |
| Secrets | Vercel project env (Production). Local `.env` keeps `DATABASE_URL_NEON`, `DIRECT_URL_NEON`, `CRON_SECRET`, `RESEND_API_KEY`, `APP_URL_VERCEL` for scripts |
| Local fallback | Unchanged: `npm run dev` on this PC with `prisma/matharena.db` (SQLite). The two databases are independent copies |

## Maintenance

**Day to day: nothing.** The app sleeps between requests; cron sends the mails; Neon and Vercel free tiers need no upkeep.

**Weekly (2 minutes): back up her progress.**
```powershell
npm.cmd run db:backup      # writes data/backups/neon-<timestamp>.json (bank + profiles + progress)
```
Keep the last few. Restore into any database with `IMPORT_FILE=data/backups/<file>.json npm run db:import`
(pointing `DATABASE_URL` at the target; see step 2 above).

**When code changes (after any edit to this repo):**
```powershell
npm.cmd run typecheck; npm.cmd run verify     # gate
vercel --prod --yes                           # deploy (or connect GitHub in Vercel → Settings → Git for auto-deploys)
```
If `prisma/schema.prisma` changed: also `npm run schema:pg` and commit the generated Postgres schema; the deploy applies it.

**When the problem bank changes (re-seed locally, then push the new rows):**
```powershell
npm.cmd run db:export
$env:DATABASE_URL=(Get-Content .env | Select-String '^DATABASE_URL_NEON=').ToString().Split('"')[1]
$env:PRISMA_CLIENT_PATH="$PWD\node_modules\.prisma\client-pg"
npx tsx scripts/import-db.ts          # bulk tables only add what's missing; profiles are refreshed
```
Careful: this overwrites hosted profile/progress rows with the local copies. Run `db:backup` first, and don't do this
while she is mid-worksheet.

**Rotate a secret:** `vercel env rm NAME production --yes` then `printf '%s' "newvalue" | vercel env add NAME production`,
then `vercel --prod --yes`. (The Resend key was pasted in chat once; rotate it in Resend → API Keys when convenient.)

**Send mail to more addresses:** verify a domain in Resend (free, needs DNS access) and set `MAIL_FROM` to an address on
it; then her own email can be the student address in Settings.

**If Vercel ever goes away:** the local app still works and `data/backups/*.json` restores everything with `db:import`.

**Test the cron by hand:**
```powershell
curl -H "Authorization: Bearer <CRON_SECRET>" "https://matharena-dun.vercel.app/api/cron?mode=evening&force=1"
```
