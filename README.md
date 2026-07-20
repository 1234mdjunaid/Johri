# Johri Jewellers — Spin & Win

A single-page luxury promotional campaign: guests watch a cinematic splash, spin an
animated wheel, win an offer, claim it with their name and mobile number, get a
gold-embossed coupon they can download as a PDF or send straight to the store on
WhatsApp — and the owner runs the whole campaign from a password-protected `/admin`
console.

Built with React + Vite + TypeScript + Tailwind CSS + Framer Motion + GSAP +
React Router + PocketBase + React Hook Form + Zod + React Hot Toast + jsPDF +
Lucide/React Icons + TanStack Query.

## Contents

- [How it's put together](#how-its-put-together)
- [Local development](#local-development)
- [PocketBase setup](#pocketbase-setup)
- [Environment variables](#environment-variables)
- [Security model](#security-model)
- [Deploying to Vercel](#deploying-to-vercel)
- [Project structure](#project-structure)

## How it's put together

- **Guest flow** (`/`) — `src/pages/CampaignPage.tsx` is a small state machine that
  walks `intro → wheel → win → coupon`. Each screen is its own component under
  `src/components/{splash,wheel,coupon}`.
- **Admin console** (`/admin`) — code-split behind `React.lazy`, protected by
  `ProtectedRoute`, and backed by a real PocketBase auth session (see below).
- **Backend** — PocketBase for storage, plus one custom JS hook
  (`pb_hooks/main.pb.js`) that is the *only* way a coupon is ever created. This is
  what makes "one coupon per mobile number" a server-enforced guarantee instead of
  a client-side promise.

## Local development

```bash
npm install

# 1. Run PocketBase (separately — see "PocketBase setup" below)
./pocketbase serve

# 2. Copy the env template and point it at your PocketBase instance
cp .env.example .env
# edit .env: VITE_POCKETBASE_URL=http://127.0.0.1:8090

# 3. Run the app
npm run dev
```

Open `http://localhost:5173`. The wheel will show "No active offers" until you've
imported the schema and added at least one active offer (below).

## PocketBase setup

The app expects a self-hosted PocketBase instance (any PocketBase ≥ v0.23) because
the "one coupon per mobile" guarantee and the admin login both rely on server-side
logic that only runs with PocketBase's own binary — a managed/hosted PocketBase
that doesn't allow custom `pb_hooks` won't work for the claim flow (see the note at
the end of this section).

1. **Download PocketBase** from [pocketbase.io/docs](https://pocketbase.io/docs) for
   your platform and place the binary at the repo root (or anywhere — just adjust
   the paths below).
2. **Copy the hooks folder** — `pb_hooks/main.pb.js` in this repo must sit next to
   the PocketBase binary in a `pb_hooks/` directory; PocketBase auto-loads it on
   `serve`.
3. **Start PocketBase** and open the admin UI it prints (defaults to
   `http://127.0.0.1:8090/_/`) to create the PocketBase *superuser* account (this is
   separate from the campaign's own admin login — it's PocketBase's own dashboard
   account).
4. **Import the schema** — in the PocketBase dashboard, go to
   *Settings → Import collections*, paste the contents of `pb_schema.json` from this
   repo, and confirm. This creates the `offers`, `customers`, `coupons`, `settings`,
   `spins`, and `admins` collections with the API rules already wired up.
   - If your PocketBase version's import format has drifted from this file, create
     the six collections by hand using the field list in
     [`pb_schema.json`](./pb_schema.json) as a reference — it's plain JSON, easy to
     read even if you don't import it directly.
5. **Create the owner's admin login** — go to the new `admins` collection → *New
   record* → set an email and password. This is what the jewellery owner types into
   `/admin`. (There is intentionally no self-registration screen.)
6. **Seed a settings record** — add one record to `settings` with your
   `businessName`, `whatsappNumber` (digits only, with country code, e.g.
   `919161191676`), colors, and terms text. The app also has sane fallbacks from
   `.env` for the very first run.
7. **Add offers** — either add a couple of rows directly in the `offers` collection,
   or just log into `/admin → Offers` in the app and use "+ New offer" once the
   admin login is created.

### Why coupon creation goes through `pb_hooks` instead of a public collection rule

`customers` and `coupons` are locked to admin-only reads/writes in `pb_schema.json`.
Every guest-facing write goes through `POST /api/spin/claim` in
`pb_hooks/main.pb.js`, which runs with full server privileges, checks for an
existing coupon on that mobile number, and only then creates one — inside a
transaction, with a unique DB index on `coupons.mobile` as the final backstop
against a race between two near-simultaneous submissions. A public collection rule
can't express "look up first, create only if missing" atomically, which is why this
needed a real server route rather than just permissive PocketBase rules.

### Deploying without custom hooks

If you deploy to a managed PocketBase host that doesn't support `pb_hooks` (custom
JS hooks require the actual `pocketbase serve` process), the claim flow won't work
as shipped. You have two options: self-host PocketBase (a small VM or a Docker
container running the official binary works fine and is the recommended path), or
adapt `src/lib/api.ts` to call `pb.collection(...).create()` directly and relax the
`customers`/`coupons` API rules — but then you lose the atomic "one coupon per
mobile" guarantee and would need to accept eventual, client-checked uniqueness
instead.

## Environment variables

See [`.env.example`](./.env.example). All are `VITE_`-prefixed and therefore public
in the shipped bundle — **no secret ever lives here**. The one thing that looks like
a credential, `VITE_ADMIN_EMAIL`, is only a display hint; the real password is
stored (hashed) inside PocketBase's own `admins` collection, set up in step 5 above.

| Variable | Purpose |
| --- | --- |
| `VITE_POCKETBASE_URL` | Your PocketBase server URL, no trailing slash. |
| `VITE_ADMIN_EMAIL` | Optional — documents which email the owner should use; not read by the login form. |
| `VITE_WHATSAPP_NUMBER` | Fallback WhatsApp number until `settings.whatsappNumber` exists. |
| `VITE_BUSINESS_NAME` | Fallback display name until `settings.businessName` exists. |
| `VITE_APP_URL` | Used in metadata only. |

## Security model

- **One coupon per mobile number** — enforced server-side by `pb_hooks/main.pb.js`
  (lookup-or-create inside a transaction) plus a unique DB index on
  `coupons.mobile`. The browser cannot bypass this by any request it sends.
- **Admin auth** — a real PocketBase auth session (`admins` collection), not a
  password baked into client JS. Anyone can view the frontend bundle's source; there
  is nothing secret in it to find.
- **API rules** — `customers`, `coupons`, and `spins` (except its intentionally
  public, PII-free `create`) are admin-only in PocketBase; `offers` only exposes
  `active = true` rows publicly; `settings` is public-read (non-sensitive business
  config) and admin-write.
- **Returning-guest guard** — device fingerprint (`@fingerprintjs/fingerprintjs`) +
  `localStorage` + a cookie fallback skip a browser straight to its own coupon
  instead of letting it spin again. This is a UX shortcut, not the security
  boundary — the mobile-number uniqueness above is what actually prevents a second
  coupon.
- **Rate limiting** — a best-effort in-memory limiter in the claim hook (8 attempts
  / 10 minutes / IP) as a spam speed bump. It resets on server restart and isn't
  distributed — treat it as a courtesy layer, not a guarantee.
- **Input validation** — Zod on the client (`src/lib/validation.ts`), mirrored with
  a regex check server-side in the hook, so a request that skips the browser
  entirely still gets validated.
- **CSV export** — cells are quote-escaped and formula-injection-guarded (a
  customer name starting with `=`, `+`, `-`, `@` is neutralized before it's written
  to the file), since exported CSVs are usually opened directly in Excel/Sheets.

## Deploying to Vercel

The frontend is a static Vite build; PocketBase is a separate, self-hosted process.

1. Deploy PocketBase somewhere it can run continuously (a small VM, Fly.io,
   Railway, a DigitalOcean droplet, etc. — anywhere you can run the actual
   `pocketbase serve` binary with the `pb_hooks/` folder next to it) and note its
   public URL. Put it behind HTTPS.
2. In Vercel, import this repository. Framework preset: **Vite**.
3. Add the environment variables from `.env.example` under Project Settings →
   Environment Variables, pointing `VITE_POCKETBASE_URL` at your deployed
   PocketBase's public HTTPS URL.
4. Deploy. `vercel.json` in this repo already adds the SPA rewrite (so `/admin`
   doesn't 404 on refresh) and a few baseline security headers.
5. On the PocketBase side, restrict CORS/allowed origins to your Vercel domain in
   PocketBase's settings once you've confirmed everything works.

## Project structure

```
pb_hooks/main.pb.js     Custom PocketBase route: atomic coupon claim + lookup
pb_schema.json          Importable collection schema (offers, customers, coupons,
                         settings, spins, admins)
src/
  components/
    splash/              Intro screen
    wheel/                Spin wheel, win/claim form
    coupon/               Coupon card, PDF/WhatsApp screen
    admin/                Offer editor, stat cards, chart
    shared/                Particles, confetti, sparkles, mute toggle, logo
  pages/
    CampaignPage.tsx       Guest flow state machine
    admin/                 Login, layout, dashboard, offers, coupons, settings
  hooks/                   TanStack Query hooks + admin auth context
  lib/                     PocketBase client, API calls, PDF, WhatsApp, wheel math,
                           audio, fingerprint, validation, CSV export
  types/                   Shared TypeScript types
  config/env.ts            Typed env var access
```

## Design note

The color palette and screen designs implemented here follow the approved Claude
Design project ("Johri Jewellers luxury web application" → `Johri Spin.dc.html`):
a deep-purple/lavender/gold luxury palette rather than the flat `#C8A24D` /
`#101010` swatches mentioned in the original brief. If you'd rather match the brief's
literal swatches, the whole palette is centralized in `src/index.css` under
`@theme` — swap the `--color-*` custom properties and every screen updates.
