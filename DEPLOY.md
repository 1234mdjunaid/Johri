# Deploying PocketBase for real

This gets the backend running on real, persistent infrastructure that's reachable
from the internet — what the frontend on Vercel actually needs to talk to. It's
fully automated: the moment PocketBase boots for the first time, it imports the
schema, creates the admin login (`johriretailers@gmail.com` / `JohriGolds@123` by
default — change these, see below), and adds starter offers. No manual clicking in
the PocketBase dashboard required.

Two paths — pick one:

- **Option A: Railway** — fastest, connects straight to this GitHub repo, no
  server management at all. Free for 30 days ($5 trial credit), then ~$5/month to
  keep your data (Railway deletes the database volume 30 days after the trial
  credit runs out on a free account).
- **Option B: Your own server** — free forever if you use Oracle Cloud's Always
  Free tier, but you're the one running Docker, SSH, and firewall rules.

Both use the same `Dockerfile` and `pb_migrations/1700000000_setup.js` in this
repo — verified locally (the schema-import + admin-account-creation logic, against
the exact PocketBase version pinned in the `Dockerfile`), though the Docker image
itself hasn't been built anywhere with internet access yet, since neither was
available in the environment I built this in.

## Option A: Railway

1. Go to [railway.app](https://railway.com) and sign up with GitHub (no card
   needed to start the trial).
2. **New Project** → **Deploy from GitHub repo** → pick `1234mdjunaid/Johri`.
   Railway finds the `Dockerfile` at the repo root and builds it automatically.
3. Add persistent storage: on the new service → **Volumes** tab → **New Volume**
   → mount path `/pb/pb_data`. Without this step your data would be wiped on
   every redeploy.
4. Set environment variables: service → **Variables** tab → add:
   ```
   PB_ADMIN_EMAIL=johriretailers@gmail.com
   PB_ADMIN_PASSWORD=JohriGolds@123
   PB_BUSINESS_NAME=Johri Jewellers
   PB_WHATSAPP_NUMBER=919161191676
   ```
5. Set the port: service → **Settings** → **Networking** → set the target port to
   `8090` (what the `Dockerfile` listens on).
6. Get a public HTTPS URL: same **Networking** section → **Generate Domain**.
   Railway gives you a free `*.up.railway.app` domain with HTTPS already handled
   — no separate Caddy/Let's Encrypt step needed, unlike Option B.
7. Wait for the deploy to finish, then confirm:
   ```bash
   curl https://YOUR-APP.up.railway.app/api/health
   curl -X POST https://YOUR-APP.up.railway.app/api/collections/admins/auth-with-password \
     -H "Content-Type: application/json" \
     -d '{"identity":"johriretailers@gmail.com","password":"JohriGolds@123"}'
   # the second call should return a token, not an error
   ```

That's it — skip straight to [Point the frontend at it](#point-the-frontend-at-it)
below.

## Option B: Your own server (free forever via Oracle Cloud)

PocketBase needs a real, always-on server with **persistent disk** (its database
is a SQLite file — if the host wipes local storage on restart, you lose all
customers and coupons). Researched current (mid-2026) free options with that
requirement: Oracle Cloud's "Always Free" tier is the only one that's genuinely
free forever with real persistent storage — PocketHost isn't free until you have
5 paid instances, Koyeb's and Render's free tiers can't attach persistent storage.

1. Sign up at [cloud.oracle.com/free](https://www.oracle.com/cloud/free/) (needs a
   card for identity verification — a $1 hold, never charged).
2. Create a Compute instance: **Create a VM instance** → under *Image and shape*,
   pick **Ubuntu 24.04** → **Change shape** → **Ampere (ARM)** →
   **VM.Standard.A1.Flex** → 2 OCPU / 12GB RAM (the free allocation).
3. Under *Networking*, accept the default new VCN. Generate an SSH key pair and
   **save the private key**.
4. Click **Create**. Note the public **IP address** once it's up.
5. **Open the firewall — two layers, both required**, or the port stays closed
   with no error message:
   - Cloud level: instance → the VCN's **Security List** → *Add Ingress Rules* →
     ports `8090`, `80`, `443` (source `0.0.0.0/0`, TCP).
   - OS level: Oracle's Ubuntu image ships `iptables` rules that silently drop
     anything but SSH. Once logged in (next step), run:
     ```bash
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8090 -j ACCEPT
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
     sudo netfilter-persistent save
     ```
6. If you have a domain (e.g. `api.johrijewellers.com`), point an **A record** at
   this IP now — DNS propagation takes a few minutes to an hour.
7. SSH in and install Docker:
   ```bash
   ssh -i /path/to/the-private-key ubuntu@YOUR_SERVER_IP
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER
   # log out and back in for the group change to apply
   ```
8. Get the app and start it:
   ```bash
   git clone https://github.com/1234mdjunaid/Johri.git
   cd Johri
   cat > .env << 'EOF'
   PB_ADMIN_EMAIL=johriretailers@gmail.com
   PB_ADMIN_PASSWORD=JohriGolds@123
   PB_BUSINESS_NAME=Johri Jewellers
   PB_WHATSAPP_NUMBER=919161191676
   EOF
   docker compose up -d --build
   ```
9. Confirm it's alive:
   ```bash
   curl http://localhost:8090/api/health
   curl -X POST http://localhost:8090/api/collections/admins/auth-with-password \
     -H "Content-Type: application/json" \
     -d '{"identity":"johriretailers@gmail.com","password":"JohriGolds@123"}'
   ```
10. HTTPS (needed before going live — browsers block a Vercel/HTTPS site from
    calling an HTTP-only API): if you set up a domain in step 6, edit
    `docker-compose.yml` — remove `ports: ["8090:8090"]` from the `pocketbase`
    service, uncomment the whole `caddy:` block and `caddy_data:` volume — then:
    ```bash
    export PB_DOMAIN=api.johrijewellers.com
    docker compose up -d
    curl https://api.johrijewellers.com/api/health   # after ~30s
    ```
    No domain yet? `http://YOUR_SERVER_IP:8090` works for testing, but get a
    domain + HTTPS before sharing the link with real customers.

## Point the frontend at it

In Vercel → your project → Settings → Environment Variables, set:

```
VITE_POCKETBASE_URL=https://YOUR-APP.up.railway.app
```

(or your Oracle domain/IP), then redeploy. The wheel should now load real offers,
and `/admin` should log in with the credentials above.

## Lock it down

Once confirmed working:

- **Change the admin password** — edit the `admins` record in PocketBase's own
  dashboard (`/_/`, after creating a PocketBase superuser there — separate from
  the app's admin login, see README), or change `PB_ADMIN_PASSWORD` and re-create
  the record.
- **Restrict CORS** (PocketBase dashboard → Settings → General) to your actual
  Vercel domain once you're done testing.
- **Set up backups** — PocketBase's dashboard has a built-in backup feature
  (Settings → Backups), or periodically snapshot the volume.

## Updating later

Railway redeploys automatically on every push to the branch it's connected to.
For Option B:

```bash
cd Johri && git pull && docker compose up -d --build
```

Either way, the setup migration only seeds data once (it checks for existing
records first) — updates never touch your live offers, coupons, or admin account.
