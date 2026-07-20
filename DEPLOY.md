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

## 1. Get a server — for $0/month

PocketBase needs a real, always-on server with **persistent disk** (its database is
a SQLite file — if the host wipes local storage on every restart, you lose all
customers and coupons). That requirement rules out a lot of what gets called "free
hosting": researched this before writing it down, current as of mid-2026 —

| Option | Actually free? | Why / why not |
| --- | --- | --- |
| **Oracle Cloud "Always Free"** | ✅ Yes, forever | Real VM, real persistent disk (200GB), no time limit. Needs a card for identity verification (a $1 hold, never charged) — that's the only catch. **This is what the steps below use.** |
| PocketHost.io | ❌ Not for one app | Purpose-built for PocketBase and supports `pb_hooks`, but it's $5/instance for your first 5 instances — not free until you already have 5 paid ones. |
| Koyeb free tier | ❌ No | Genuinely no card required, but the free instance can't attach persistent storage and sleeps after an hour idle — your data wouldn't survive a restart. |
| Render free tier | ❌ No | Requires a card, and free-tier services have no persistent disk either. |
| Random "free VPS, no card" sites | ⚠️ Not recommended | These exist, but this app stores real customers' names and phone numbers — I'm not going to point you at a host I can't vouch for the reliability or trustworthiness of just to dodge a card-verification step. |

So: **Oracle Cloud Always Free**. It's a real cloud VM that costs nothing,
indefinitely, from a company that isn't going anywhere — the only friction is a
one-time signup with card verification (not a charge).

1. Sign up at [cloud.oracle.com/free](https://www.oracle.com/cloud/free/) (needs a
   card for verification only).
2. Create a Compute instance: **Create a VM instance** → name it anything → under
   *Image and shape*, pick **Ubuntu 24.04**, then **Change shape** → **Ampere
   (ARM)** → **VM.Standard.A1.Flex** → set 2 OCPU / 12GB RAM (the current free
   allocation) — this is genuinely more machine than this app needs.
3. Under *Networking*, let it create a new VCN (default settings are fine). Add or
   generate an SSH key pair and **save the private key** — you'll need it to log in.
4. Click **Create**. After a minute you'll have a public **IP address** — note it
   down.
5. **Open the firewall — two layers, both required.** Oracle blocks inbound
   traffic at two separate levels, and missing either one leaves the port
   closed with no error message:
   - **Cloud level**: instance → the VCN's **Security List** → *Add Ingress
     Rules* → add rules for ports `8090`, `80`, and `443` (source `0.0.0.0/0`,
     TCP).
   - **OS level**: Oracle's Ubuntu image also ships `iptables` rules that
     silently drop anything but SSH, independent of the cloud firewall above.
     Once you're SSH'd in (step 2 below), run:
     ```bash
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8090 -j ACCEPT
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
     sudo netfilter-persistent save
     ```
     (Skip this OS-level step entirely if you went with a plain DigitalOcean/
     Hetzner/Vultr VPS instead — they don't ship this extra layer.)
6. If you want a domain like `api.johrijewellers.com` for HTTPS (recommended, see
   step 4 below), point an **A record** at this IP now — DNS changes take a few
   minutes to an hour to propagate.

Prefer a traditional paid VPS instead (DigitalOcean, Hetzner, Vultr, ~$4–6/month)?
Same steps from here on — just skip the Oracle-specific parts above.

## 2. SSH in and install Docker

Oracle's Ubuntu images use the `ubuntu` user, not `root` (a plain VPS from
DigitalOcean/Hetzner/Vultr is usually `root` instead — use whichever applies):

```bash
ssh -i /path/to/the-private-key-you-downloaded ubuntu@YOUR_SERVER_IP

curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# log out and back in for the group change to take effect, then continue below
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
