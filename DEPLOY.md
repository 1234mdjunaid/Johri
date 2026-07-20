# Deploying PocketBase for real

This gets the backend running on real, persistent infrastructure that's reachable
from the internet — what the frontend on Vercel actually needs to talk to. It's
fully automated: the moment PocketBase boots for the first time, it imports the
schema, creates the admin login (`johriretailers@gmail.com` /
`JohriGolds@123` by default — change these, see below), and adds starter offers.
No manual clicking in the PocketBase dashboard required.

This has been tested locally (the exact schema-import + admin-account-creation
logic in `pb_migrations/1700000000_setup.js`, against the exact PocketBase version
pinned in the `Dockerfile`) but the Docker image itself hasn't been built in this
environment — no Docker daemon was available here, and this environment's network
policy blocks the GitHub download the `Dockerfile` needs. Build it on your own
machine or your VPS, both of which will have normal internet access.

## 1. Get a server

Any small VPS running Ubuntu works. If you don't have one:

- [DigitalOcean](https://www.digitalocean.com), [Hetzner](https://www.hetzner.com), or
  [Vultr](https://www.vultr.com) all offer a $4–6/month "droplet" — pick the
  cheapest Ubuntu 22.04/24.04 option, ~1GB RAM is plenty for this app.
- You'll get a public **IP address** (e.g. `142.93.x.x`) — note it down.
- If you want a real domain like `api.johrijewellers.com` for HTTPS (recommended,
  see step 4), point an **A record** for that subdomain at the server's IP now —
  DNS changes take a few minutes to an hour to propagate.

## 2. SSH in and install Docker

```bash
ssh root@YOUR_SERVER_IP

curl -fsSL https://get.docker.com | sh
```

## 3. Get the app onto the server and start it

```bash
git clone https://github.com/1234mdjunaid/Johri.git
cd Johri

# Optional: override the default admin credentials / business info before
# first boot (the migration only creates these once, so set them now if you
# want something other than the defaults baked into the Dockerfile).
cat > .env << 'EOF'
PB_ADMIN_EMAIL=johriretailers@gmail.com
PB_ADMIN_PASSWORD=JohriGolds@123
PB_BUSINESS_NAME=Johri Jewellers
PB_WHATSAPP_NUMBER=919161191676
EOF

docker compose up -d --build
```

Give it a minute to build, then confirm it's alive:

```bash
curl http://localhost:8090/api/health
# {"message":"API is healthy.",...}
```

At this point PocketBase is running and fully seeded. Confirm the admin login
works from the server itself:

```bash
curl -X POST http://localhost:8090/api/collections/admins/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"johriretailers@gmail.com","password":"JohriGolds@123"}'
# should return a token, not an error
```

## 4. Put it behind HTTPS (recommended before going live)

Browsers block a Vercel site (HTTPS) from calling an HTTP-only API — you need
PocketBase reachable over `https://`. The easiest way, if you pointed a domain at
this server in step 1:

```bash
# edit docker-compose.yml:
#  - remove the `ports: ["8090:8090"]` line from the pocketbase service
#  - uncomment the whole `caddy:` service block and the `caddy_data:` volume
export PB_DOMAIN=api.johrijewellers.com   # your actual subdomain
docker compose up -d
```

Caddy automatically requests and renews a free Let's Encrypt certificate for
`PB_DOMAIN` and proxies HTTPS traffic to PocketBase. After ~30 seconds:

```bash
curl https://api.johrijewellers.com/api/health
```

No domain yet? You can go live on plain `http://YOUR_SERVER_IP:8090` to test end
to end, but plan to add a domain + HTTPS before sharing the link with real
customers.

## 5. Point the frontend at it

In Vercel → your project → Settings → Environment Variables, set:

```
VITE_POCKETBASE_URL=https://api.johrijewellers.com
```

(or `http://YOUR_SERVER_IP:8090` if you're still on step 4's HTTP fallback), then
redeploy. The wheel should now load real offers, and `/admin` should log in with
the credentials above.

## 6. Lock it down

Once confirmed working:

- **Change the admin password** — either edit the `admins` record directly in
  PocketBase's own dashboard (`https://api.johrijewellers.com/_/`, after creating
  a PocketBase superuser there — different from the app's admin login, see
  README), or set `PB_ADMIN_PASSWORD` in `.env` and re-create the record.
- **Restrict CORS** in PocketBase's dashboard (Settings → General) to your actual
  Vercel domain, once you're done testing.
- **Set up backups** — PocketBase's dashboard has a built-in backup feature
  (Settings → Backups), or just periodically copy the `pb_data` Docker volume.

## Updating later

```bash
cd Johri
git pull
docker compose up -d --build
```

The setup migration only runs its seeding logic once (it checks for existing
records first), so pulling updates and rebuilding won't touch your live data,
offers, or admin account.
