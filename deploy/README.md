# Deploying AgroGuard to a Linux VM (Strettch Cloud)

One small VM runs everything: the FastAPI API (uvicorn) and the built frontend
(served by nginx, which also proxies the API on the same origin). Auth and the
user database are handled by **Supabase** (managed, external), so there is no
database to host here.

**Recommended VM:** Ubuntu 22.04, 2 vCPU, 2 GB RAM, 25 GB SSD (1 vCPU / 1 GB works
but is tight). You need SSH access and `sudo`.

Everything below assumes you are SSHed into the VM. Replace `YOUR_DOMAIN_OR_IP`,
the GitHub URL, and the Supabase values with your own.

---

## 1. System packages

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip nginx git curl
# Node 20 for building the frontend:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2. Create a service user and clone the repo

```bash
sudo useradd -m -d /opt/agroguard -s /bin/bash agroguard
sudo -u agroguard git clone https://github.com/mgustavy/AgroGuard.git /opt/agroguard/AgroGuard
cd /opt/agroguard/AgroGuard
```

> Deploy from `main` once the app PRs are merged, or `git checkout <branch>` for a
> branch that has the API + dashboard changes. The trained model
> (`models/xgb_risk_model.joblib`) is committed, so nothing extra to upload.

## 3. Python environment for the API

```bash
sudo -u agroguard python3 -m venv .venv
sudo -u agroguard .venv/bin/pip install --upgrade pip
sudo -u agroguard .venv/bin/pip install -r src/api/requirements.txt
```

## 4. Build the frontend (with production env vars)

Vite bakes `VITE_*` values in at build time, so set them before building.
`VITE_API_URL=/api` keeps the frontend same-origin with the proxied API.

```bash
cd src/dashboard
cat > .env <<'EOF'
VITE_SUPABASE_URL=https://YOURREF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
VITE_API_URL=/api
EOF

npm install
npm run build

sudo mkdir -p /var/www/agroguard
sudo cp -r dist/* /var/www/agroguard/
cd /opt/agroguard/AgroGuard
```

## 5. Run the API under systemd

```bash
sudo cp deploy/systemd/agroguard-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now agroguard-api
sudo systemctl status agroguard-api        # should be "active (running)"
curl -s http://127.0.0.1:8000/             # health JSON, model_loaded: true
```

## 6. Configure nginx

```bash
sudo cp deploy/nginx/agroguard.conf /etc/nginx/sites-available/agroguard
sudo ln -sf /etc/nginx/sites-available/agroguard /etc/nginx/sites-enabled/agroguard
sudo rm -f /etc/nginx/sites-enabled/default
# Optional: edit server_name in the file to YOUR_DOMAIN
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Open the firewall

Allow inbound **80** (and **443** if you add HTTPS) in the Strettch Cloud security
group / firewall for this VM. If `ufw` is active on the VM:

```bash
sudo ufw allow 'Nginx Full'
```

## 8. Test

- Open `http://YOUR_DOMAIN_OR_IP` -> the sign-in screen loads.
- API health: `curl http://YOUR_DOMAIN_OR_IP/api/` -> JSON with `model_loaded`.
- Register a field officer, confirm you land on the dashboard, and check the row
  in Supabase -> Table Editor -> `profiles`.

## 9. (Optional) HTTPS with a domain

Point an A record at the VM IP, then:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN
```

Certbot edits the nginx config and sets up auto-renewal.

## Supabase notes

- Turn **Confirm email OFF** (Authentication -> Providers -> Email) for immediate
  login, as in local dev.
- Add `http://YOUR_DOMAIN_OR_IP` (and the https URL) under Authentication -> URL
  Configuration -> Site URL / Redirect URLs.

## Redeploying after changes

```bash
cd /opt/agroguard/AgroGuard
sudo -u agroguard git pull
sudo -u agroguard .venv/bin/pip install -r src/api/requirements.txt   # if deps changed
cd src/dashboard && npm install && npm run build && sudo cp -r dist/* /var/www/agroguard/
sudo systemctl restart agroguard-api
```
