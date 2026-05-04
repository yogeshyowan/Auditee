# Deploying Auditee to a Hetzner VPS with Docker

This guide takes you from a fresh Hetzner Cloud server to a running production
deployment in about 30 minutes. The whole stack runs as three Docker containers
managed by `docker compose`:

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   web       │      │     api      │      │      db      │
│ nginx:alp   │◄─────┤ node:22-slim │◄─────┤ postgres:16  │
│ port 80     │      │ port 8080    │      │ port 5432    │
└─────────────┘      └──────────────┘      └──────────────┘
```

---

## 1. Provision the server

Recommended starting size: **CX22** (2 vCPU, 4 GB RAM, 40 GB disk, ~€4/mo).
Bigger if you expect heavy AI usage.

1. In the Hetzner Cloud console create a new server.
2. Image: **Ubuntu 24.04**.
3. Add your SSH key during creation.
4. Optional but recommended: attach a Hetzner Cloud Firewall that opens only
   TCP 22, 80, 443.

After it boots, SSH in:

```bash
ssh root@<your-server-ip>
```

## 2. Install Docker

```bash
apt-get update
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

docker --version
docker compose version
```

## 3. Get the code onto the server

```bash
cd /opt
git clone https://github.com/yogeshyowan/Eltegra-Rebuild.git auditee
cd auditee
```

If the repo is private, use a deploy key or HTTPS with a Personal Access Token.

## 4. Configure environment

```bash
cp .env.example .env
nano .env
```

Fill in **at minimum** these required values:

| Variable | Where to get it |
| --- | --- |
| `SITE_URL` | The full https URL the app will live at, e.g. `https://auditee.yourdomain.com` |
| `POSTGRES_PASSWORD` | Generate: `openssl rand -hex 32` |
| `CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API keys |
| `CLERK_SECRET_KEY` | Clerk dashboard → API keys |
| `SESSION_SECRET` | Generate: `openssl rand -hex 64` |
| `OPENAI_API_KEY` | platform.openai.com → API keys |

Optional values (notifications, GitHub push-back, alternative AI providers)
can stay blank — those features just turn off.

## 5. Set up DNS

Point an A record at the server's public IP:

```
auditee.yourdomain.com.   A   <hetzner-ip>
```

Wait for it to propagate (`dig auditee.yourdomain.com` should return your IP).

## 6. Update Clerk's allowed origins

In the Clerk dashboard, open your application → **Domains** and add the URL
from `SITE_URL`. Without this step, sign-in will silently fail because Clerk
refuses cookies from unknown origins.

## 7. Launch the stack

```bash
cd /opt/auditee
docker compose up -d --build
```

The first build takes 5–10 minutes (it installs all pnpm dependencies and
bundles the API server with esbuild, plus three Vite frontends: the marketing
site, the tutorial videos, and the investor deck). Subsequent rebuilds are
much faster thanks to layer caching.

Check health:

```bash
docker compose ps
docker compose logs -f api    # database migrations + server boot
docker compose logs -f web
```

You should see in the api log:

```
[entrypoint] applying database schema (drizzle-kit push)...
... drizzle-kit output ...
[entrypoint] starting API server on port 8080...
{"level":30,"msg":"Server listening","port":8080}
```

Visit `http://<server-ip>` — you should see the marketing site. The dashboard
is at `/app` after signing in. Tutorial videos are at `/auditee-tutorial/`
and the investor deck is at `/auditee-deck/`.

## 8. Add HTTPS (recommended)

The bundled `nginx.conf` only speaks plain HTTP on port 80. The simplest
production-grade TLS setup is to put **Caddy** in front:

```bash
apt-get install -y caddy
```

Edit `/etc/caddy/Caddyfile`:

```
auditee.yourdomain.com {
    reverse_proxy localhost:80
}
```

Then change `WEB_HTTP_PORT=8080` in your `.env` so the web container no longer
fights Caddy for port 80, and:

```bash
systemctl reload caddy
docker compose up -d
```

Caddy automatically obtains and renews a Let's Encrypt certificate for the
domain.

## 9. Backups

The Postgres data lives in the named volume `pgdata`. A simple nightly
`pg_dump` to the host filesystem:

```bash
mkdir -p /opt/auditee-backups
cat > /etc/cron.daily/auditee-pgdump <<'SH'
#!/bin/sh
ts=$(date +%Y%m%d-%H%M)
docker compose -f /opt/auditee/docker-compose.yml exec -T db \
  pg_dump -U auditee -d auditee --format=custom \
  > /opt/auditee-backups/auditee-${ts}.dump
find /opt/auditee-backups -name 'auditee-*.dump' -mtime +14 -delete
SH
chmod +x /etc/cron.daily/auditee-pgdump
```

For off-server backups, push the dump to S3, Backblaze B2, or Hetzner Storage
Box — leave that piece of the stack to you.

## 10. Updating the app

```bash
cd /opt/auditee
git pull
docker compose up -d --build
```

The api container automatically re-runs `drizzle-kit push` on each start, so
new schema changes are applied for you. If a push would be destructive,
drizzle-kit will refuse and the api container will exit — read the log,
decide what to do, and re-run with `pnpm --filter @workspace/db run push-force`
inside the container if you accept the change.

---

## What's NOT in this stack

- No CI/CD: you are pulling and rebuilding by hand. Add GitHub Actions later
  if you want push-to-deploy.
- No managed Postgres: data lives on the same VPS in a volume. For real
  production, point `DATABASE_URL` at a Hetzner managed Postgres instance and
  remove the `db` service from `docker-compose.yml`.
- No metrics / log shipping: container logs stay on the box. Pipe to Loki or
  Grafana Cloud if you want a real observability stack.
- No worker autoscaling: this is a single-VPS deployment. The recurring-audit
  scheduler runs in-process on the api container and is fine for now.

## Switching back to Replit

Nothing in this Docker setup affects the Replit workflows. The same code runs
in both places — Replit-specific behavior (the AI proxy, the dev banner) is
gated on `REPL_ID` and only activates inside Replit.
